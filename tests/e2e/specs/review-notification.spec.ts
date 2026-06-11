import { test, expect } from '@playwright/test'
import { ObjectId } from 'mongodb'
import { getDb, closeDb } from './coupon-loyalty/db'
import { sessions, newAuthedPage, APP_URL, API_URL, auth } from './community/helpers'

let customer: any
let admin: any

test.beforeAll(async () => {
  const s = sessions()
  customer = s.customer
  admin = s.admin
})

test.afterAll(async () => {
  await closeDb()
})

test.describe.serial('Real Review & Notification E2E Flow', () => {

  test('Prepare DB: Clean up previous reviews/notifications and seed a delivered order', async () => {
    const db = await getDb()
    const reviewsCol = db.collection('reviews')
    const notificationsCol = db.collection('notifications')
    const ordersCol = db.collection('orders')
    const productsCol = db.collection('products')

    const customerUserIdStr = customer.user._id
    const customerUserId = new ObjectId(customerUserIdStr)

    // 1. Clean up old E2E review, notification, and order documents for this customer
    await reviewsCol.deleteMany({ userId: customerUserId })
    await notificationsCol.deleteMany({ userId: customerUserId })
    await ordersCol.deleteMany({ userId: customerUserId, orderNumber: 'ORD-E2E-REV-1' })

    // 2. Fetch the seeded product ID
    const product = await productsCol.findOne({ sku: 'E2E-PROD-001' })
    expect(product).toBeTruthy()
    const productId = product!._id

    // 3. Create a real delivered order for this customer so they have a verified purchase
    const orderId = new ObjectId()
    const now = new Date()
    await ordersCol.insertOne({
      _id: orderId,
      orderNumber: 'ORD-E2E-REV-1',
      userId: customerUserId,
      items: [
        {
          productId: productId,
          categoryId: product!.categoryId || null,
          name: product!.name,
          sku: product!.sku || '',
          quantity: 1,
          price: product!.price,
          unitPrice: product!.price,
          totalPrice: product!.price,
          unit: 'Viên',
          prescriptionRequired: product!.requiresPrescription || false,
          image: product!.featuredImage || '',
          productName: product!.name,
          productImage: product!.featuredImage || '',
          discountAllocation: 0,
          pointsAllocation: 0
        }
      ],
      subtotal: product!.price,
      discountAmount: 0,
      pointsRedeemed: 0,
      pointsRedeemAmount: 0,
      shippingFee: 30000,
      totalAmount: product!.price + 30000,
      status: 'delivered', // For frontend OrderCard
      orderStatus: 'delivered', // For backend API checks
      paymentStatus: 'paid',
      paymentMethod: 'cod',
      shippingMethod: 'standard',
      shippingAddress: {
        firstName: 'E2E',
        lastName: 'Tester',
        phone: '0901234567',
        email: customer.user.email,
        address: '123 Test Street',
        ward: 'Phường 1',
        district: 'Quận 1',
        province: 'TP. Hồ Chí Minh'
      },
      createdAt: now,
      updatedAt: now
    })

    // Confirm order is inserted
    const insertedOrder = await ordersCol.findOne({ _id: orderId })
    expect(insertedOrder).toBeTruthy()
  })

  test('Customer writes a review on the delivered product and verifies auto-approval', async ({ browser }) => {
    // 1. Open customer-authenticated page
    const { context, page } = await newAuthedPage(browser, 'customer.json')

    // 2. Navigate to orders page
    await page.goto(`${APP_URL}/account/orders`)
    await page.waitForLoadState('networkidle')

    // Take screenshot of the order list page showing the delivered order
    await page.screenshot({ path: 'tests/e2e/screenshots/orders-list.png' })

    // Find the order card and verify the button "Viết Đánh giá" is visible
    const writeReviewBtn = page.getByRole('button', { name: 'Viết Đánh giá' }).first()
    await expect(writeReviewBtn).toBeVisible()

    // Click "Viết Đánh giá"
    await writeReviewBtn.click()

    // Select product from the list dialog
    const productItem = page.getByRole('heading', { name: '[E2E] Vitamin C 1000mg' }).first()
    await expect(productItem).toBeVisible()
    await productItem.click()

    // 3. Write review dialog should be visible
    const dialog = page.locator('role=dialog')
    await expect(dialog).toBeVisible()

    // Click 5th star
    const star5 = dialog.locator('.flex.items-center.gap-0\\.5 button').nth(4)
    await star5.click()

    // Fill title and comment
    await dialog.locator('input#title').fill('Sản phẩm E2E chất lượng tốt')
    await dialog.locator('textarea#comment').fill('Tôi đã mua và sử dụng sản phẩm này. Chất lượng tuyệt vời, đóng gói rất kỹ càng.')

    // Take screenshot of the filled review dialog
    await page.screenshot({ path: 'tests/e2e/screenshots/review-dialog-filled.png' })

    // Click submit
    await dialog.locator('button[type="submit"]').click()

    // 4. Verify toast notification
    const toast = page.locator('text=thành công')
    await expect(toast).toBeVisible({ timeout: 15000 })
    await page.screenshot({ path: 'tests/e2e/screenshots/review-success-toast.png' })

    await context.close()

    // 5. DB Assertion: Verify review was saved and auto-approved
    const db = await getDb()
    const reviewsCol = db.collection('reviews')
    const savedReview = await reviewsCol.findOne({
      userId: new ObjectId(customer.user._id),
      title: 'Sản phẩm E2E chất lượng tốt'
    })

    expect(savedReview).toBeTruthy()
    expect(savedReview!.rating).toBe(5)
    expect(savedReview!.status).toBe('approved') // Auto-approved due to trusted buyer history

    // 6. UI check on product details page
    const guestPage = await browser.newPage()
    await guestPage.goto(`${APP_URL}/products/e2e-vitamin-c-1000mg`)
    await guestPage.waitForLoadState('networkidle')

    // Click reviews tab
    const reviewTabBtn = guestPage.locator('button:has-text("Đánh giá")').first()
    await reviewTabBtn.click()

    // Check if review comment is rendered correctly and visible (No XSS, safe rendering)
    const reviewComment = guestPage.getByText('Tôi đã mua và sử dụng sản phẩm này. Chất lượng tuyệt vời, đóng gói rất kỹ càng.')
    await expect(reviewComment).toBeVisible()

    await guestPage.screenshot({ path: 'tests/e2e/screenshots/product-review-list.png' })
    await guestPage.close()
  })

  test('Real-time Socket Notification is triggered on order status change', async ({ browser, request }) => {
    // 1. Open customer page (listens to socket events)
    const { context, page } = await newAuthedPage(browser, 'customer.json')
    await page.goto(`${APP_URL}/`)
    await page.waitForLoadState('networkidle')

    // Find current unread count from the bell badge (if any)
    const bellBadge = page.locator('button[aria-label="Thông báo"] span')
    let initialCount = 0
    if (await bellBadge.isVisible()) {
      const text = await bellBadge.innerText()
      initialCount = parseInt(text) || 0
    }

    // 2. Create a new pending order via API
    const db = await getDb()
    const product = await db.collection('products').findOne({ sku: 'E2E-PROD-001' })
    expect(product).toBeTruthy()

    // Add to cart and checkout via API to create a clean new order
    // We can directly call the API or create order document in DB.
    // Creating via API is safer to trigger all logic.
    const createOrderRes = await request.post(`${API_URL}/orders`, {
      headers: auth(customer.token),
      data: {
        shippingAddress: {
          firstName: 'E2E',
          lastName: 'Tester',
          phone: '0901234567',
          email: customer.user.email,
          address: '123 Test Street',
          ward: 'Phường 1',
          district: 'Quận 1',
          province: 'TP. Hồ Chí Minh'
        },
        paymentMethod: 'cod',
        shippingMethod: 'standard',
        shippingFee: 30000,
        estimatedDeliveryDate: '2-4 ngày',
        isDirectBuy: true,
        selectedItems: [
          {
            productId: product!._id.toString(),
            quantity: 1,
            unit: 'Viên'
          }
        ]
      }
    })
    expect(createOrderRes.ok()).toBeTruthy()
    const orderData = (await createOrderRes.json()).result
    const orderId = orderData.orderId || orderData.order?._id || orderData._id

    // 3. Update order status to 'delivered' as admin using backend API
    // This will trigger the notificationService.notifyOrderStatusChange inside orders.services.ts
    const updateStatusRes = await request.put(`${API_URL}/orders/${orderId}/status`, {
      headers: auth(admin.token),
      data: { status: 'delivered' }
    })
    expect(updateStatusRes.ok()).toBeTruthy()

    // 4. Check that the notification toast was received real-time in the browser page
    const notificationToast = page.locator('text=Đơn hàng đã giao thành công')
    await expect(notificationToast).toBeVisible({ timeout: 15000 })

    // Take screenshot of the real-time notification toast
    await page.screenshot({ path: 'tests/e2e/screenshots/notification-toast.png' })

    // 5. Verify unread count badge is updated (initial + 2)
    const newBadge = page.locator('button[aria-label="Thông báo"] span')
    await expect(newBadge).toBeVisible()
    const finalCount = parseInt(await newBadge.innerText())
    expect(finalCount).toBe(initialCount + 2)

    // 6. Open the notification dropdown
    const bellBtn = page.locator('button[aria-label="Thông báo"]')
    await bellBtn.click()

    // The notification item should be visible in the dropdown
    const dropdownItem = page.locator('p', { hasText: 'Đơn hàng đã giao thành công' }).first()
    await expect(dropdownItem).toBeVisible()

    // Click mark as read
    const markAsReadBtn = page.locator('button:has-text("Đọc hết")').first()
    if (await markAsReadBtn.isVisible()) {
      await markAsReadBtn.click()
      // Badge should disappear or decrease
      await expect(newBadge).not.toBeVisible()
    }

    await page.screenshot({ path: 'tests/e2e/screenshots/notification-dropdown.png' })
    await context.close()
  })

  test('Pending review and manual Admin approval (untrusted customer)', async ({ browser }) => {
    const { context: customerContext, page: customerPage } = await newAuthedPage(browser, 'customer2.json')
    const customer2UserIdStr = sessions().customer2.user._id

    const db = await getDb()
    const product = await db.collection('products').findOne({ sku: 'E2E-PROD-001' })
    expect(product).toBeTruthy()
    const productId = product!._id

    // Clean up old customer2 review if any
    await db.collection('reviews').deleteMany({ userId: new ObjectId(customer2UserIdStr) })
    await db.collection('orders').deleteMany({ userId: new ObjectId(customer2UserIdStr), orderNumber: 'ORD-E2E-REV-PENDING' })

    const orderId = new ObjectId()
    const now = new Date()
    await db.collection('orders').insertOne({
      _id: orderId,
      orderNumber: 'ORD-E2E-REV-PENDING',
      userId: new ObjectId(customer2UserIdStr),
      items: [
        {
          productId: productId,
          categoryId: product!.categoryId || null,
          name: product!.name,
          sku: product!.sku || '',
          quantity: 1,
          price: product!.price,
          unitPrice: product!.price,
          totalPrice: product!.price,
          unit: 'Viên',
          prescriptionRequired: product!.requiresPrescription || false,
          image: product!.featuredImage || '',
          productName: product!.name,
          productImage: product!.featuredImage || '',
          discountAllocation: 0,
          pointsAllocation: 0
        }
      ],
      subtotal: product!.price,
      discountAmount: 0,
      pointsRedeemed: 0,
      pointsRedeemAmount: 0,
      shippingFee: 30000,
      totalAmount: product!.price + 30000,
      status: 'delivered',
      orderStatus: 'delivered',
      paymentStatus: 'paid',
      paymentMethod: 'cod',
      shippingMethod: 'standard',
      shippingAddress: {
        firstName: 'E2E',
        lastName: 'Customer2',
        phone: '0900000002',
        email: sessions().customer2.user.email,
        address: '123 Test Street',
        ward: 'Phường 1',
        district: 'Quận 1',
        province: 'TP. Hồ Chí Minh'
      },
      createdAt: now,
      updatedAt: now
    })

    await customerPage.goto(`${APP_URL}/account/orders`)
    await customerPage.waitForLoadState('networkidle')

    const writeReviewBtn = customerPage.getByRole('button', { name: 'Viết Đánh giá' }).first()
    await expect(writeReviewBtn).toBeVisible()
    await writeReviewBtn.click()

    const productItem = customerPage.getByRole('heading', { name: '[E2E] Vitamin C 1000mg' }).first()
    await expect(productItem).toBeVisible()
    await productItem.click()

    const dialog = customerPage.locator('role=dialog')
    await expect(dialog).toBeVisible()

    const star5 = dialog.locator('.flex.items-center.gap-0\\.5 button').nth(4)
    await star5.click()
    await dialog.locator('input#title').fill('Đánh giá của khách hàng mới')
    await dialog.locator('textarea#comment').fill('Sản phẩm dùng tốt, đóng gói cẩn thận.')

    await dialog.locator('button[type="submit"]').click()
    const toastLocator = customerPage.locator('text=thành công')
    await expect(toastLocator).toBeVisible({ timeout: 15000 })

    const savedReview = await db.collection('reviews').findOne({
      userId: new ObjectId(customer2UserIdStr),
      title: 'Đánh giá của khách hàng mới'
    })
    expect(savedReview).toBeTruthy()
    expect(savedReview!.status).toBe('pending')

    await customerPage.goto(`${APP_URL}/account/reviews`)
    await customerPage.waitForLoadState('networkidle')
    const pendingTab = customerPage.locator('button:has-text("Chờ duyệt")')
    await pendingTab.click()
    await expect(customerPage.locator('text=Đang chờ duyệt').first()).toBeVisible()
    await customerPage.screenshot({ path: 'tests/e2e/screenshots/customer2-pending-review.png' })
    await customerContext.close()

    const guestPage = await browser.newPage()
    await guestPage.goto(`${APP_URL}/products/e2e-vitamin-c-1000mg`)
    await guestPage.waitForLoadState('networkidle')
    const reviewTabBtn = guestPage.locator('button:has-text("Đánh giá")').first()
    await reviewTabBtn.click()
    await expect(guestPage.getByText('Đánh giá của khách hàng mới')).not.toBeVisible()
    await guestPage.close()

    const { context: adminContext, page: adminPage } = await newAuthedPage(browser, 'admin.json')
    await adminPage.goto(`${APP_URL}/admin/reviews`)
    await adminPage.waitForLoadState('networkidle')
    await adminPage.screenshot({ path: 'tests/e2e/screenshots/admin-review-moderation-list.png' })

    const reviewRow = adminPage.locator('tr', { hasText: 'Đánh giá của khách hàng mới' })
    await expect(reviewRow).toBeVisible()
    await reviewRow.locator('button').first().click()

    const approveItem = adminPage.locator('div[role="menuitem"]:has-text("Duyệt bài")')
    await expect(approveItem).toBeVisible()
    await approveItem.click()

    await expect(adminPage.locator('text=thành công')).toBeVisible({ timeout: 15000 })
    await adminPage.screenshot({ path: 'tests/e2e/screenshots/admin-review-approved-success.png' })
    await adminContext.close()

    const approvedReview = await db.collection('reviews').findOne({ _id: savedReview!._id })
    expect(approvedReview!.status).toBe('approved')

    const guestPage2 = await browser.newPage()
    await guestPage2.goto(`${APP_URL}/products/e2e-vitamin-c-1000mg`)
    await guestPage2.waitForLoadState('networkidle')
    const reviewTabBtn2 = guestPage2.locator('button:has-text("Đánh giá")').first()
    await reviewTabBtn2.click()
    await expect(guestPage2.getByText('Đánh giá của khách hàng mới')).toBeVisible()
    await guestPage2.close()
  })

  test('Spam & medical safety rejection (unauto-approval even for trusted users)', async ({ browser }) => {
    const { context: customerContext, page: customerPage } = await newAuthedPage(browser, 'customer.json')
    const customerUserIdStr = sessions().customer.user._id

    const db = await getDb()
    const product = await db.collection('products').findOne({ sku: 'E2E-PROD-002' })
    expect(product).toBeTruthy()
    const productId = product!._id

    // Clean up old spam reviews
    await db.collection('reviews').deleteMany({ userId: new ObjectId(customerUserIdStr), title: 'Mua tại www.spamsite.com' })
    await db.collection('orders').deleteMany({ userId: new ObjectId(customerUserIdStr), orderNumber: 'ORD-E2E-REV-SPAM' })

    const orderId = new ObjectId()
    const now = new Date()
    await db.collection('orders').insertOne({
      _id: orderId,
      orderNumber: 'ORD-E2E-REV-SPAM',
      userId: new ObjectId(customerUserIdStr),
      items: [
        {
          productId: productId,
          categoryId: product!.categoryId || null,
          name: product!.name,
          sku: product!.sku || '',
          quantity: 1,
          price: product!.price,
          unitPrice: product!.price,
          totalPrice: product!.price,
          unit: 'Viên',
          prescriptionRequired: product!.requiresPrescription || false,
          image: product!.featuredImage || '',
          productName: product!.name,
          productImage: product!.featuredImage || '',
          discountAllocation: 0,
          pointsAllocation: 0
        }
      ],
      subtotal: product!.price,
      discountAmount: 0,
      pointsRedeemed: 0,
      pointsRedeemAmount: 0,
      shippingFee: 30000,
      totalAmount: product!.price + 30000,
      status: 'delivered',
      orderStatus: 'delivered',
      paymentStatus: 'paid',
      paymentMethod: 'cod',
      shippingMethod: 'standard',
      shippingAddress: {
        firstName: 'E2E',
        lastName: 'Customer',
        phone: '0901234567',
        email: sessions().customer.user.email,
        address: '123 Test Street',
        ward: 'Phường 1',
        district: 'Quận 1',
        province: 'TP. Hồ Chí Minh'
      },
      createdAt: now,
      updatedAt: now
    })

    await customerPage.goto(`${APP_URL}/account/orders`)
    await customerPage.waitForLoadState('networkidle')

    const writeReviewBtn = customerPage.getByRole('button', { name: 'Viết Đánh giá' }).first()
    await expect(writeReviewBtn).toBeVisible()
    await writeReviewBtn.click()

    const productItem = customerPage.getByRole('heading', { name: '[E2E] Omega-3 Fish Oil' }).first()
    await expect(productItem).toBeVisible()
    await productItem.click()

    const dialog = customerPage.locator('role=dialog')
    await expect(dialog).toBeVisible()

    const star5 = dialog.locator('.flex.items-center.gap-0\\.5 button').nth(4)
    await star5.click()
    await dialog.locator('input#title').fill('Mua tại www.spamsite.com')
    await dialog.locator('textarea#comment').fill('Sản phẩm này có tác dụng phụ nguy hiểm cho gan phổi của bạn.')

    await dialog.locator('button[type="submit"]').click()
    const toastLocator = customerPage.locator('text=thành công')
    await expect(toastLocator).toBeVisible({ timeout: 15000 })

    const savedReview = await db.collection('reviews').findOne({
      userId: new ObjectId(customerUserIdStr),
      title: 'Mua tại www.spamsite.com'
    })
    expect(savedReview).toBeTruthy()
    expect(savedReview!.status).toBe('pending')

    await customerPage.screenshot({ path: 'tests/e2e/screenshots/spam-review-pending.png' })
    await customerContext.close()

    const { context: adminContext, page: adminPage } = await newAuthedPage(browser, 'admin.json')
    await adminPage.goto(`${APP_URL}/admin/reviews`)
    await adminPage.waitForLoadState('networkidle')

    const reviewRow = adminPage.locator('tr', { hasText: 'Mua tại www.spamsite.com' })
    await expect(reviewRow).toBeVisible()
    await reviewRow.locator('button').first().click()

    const rejectItem = adminPage.locator('div[role="menuitem"]:has-text("Từ chối")')
    await expect(rejectItem).toBeVisible()
    await rejectItem.click()

    await expect(adminPage.locator('text=thành công')).toBeVisible({ timeout: 15000 })
    await adminPage.screenshot({ path: 'tests/e2e/screenshots/admin-review-rejected-success.png' })
    await adminContext.close()

    const rejectedReview = await db.collection('reviews').findOne({ _id: savedReview!._id })
    expect(rejectedReview!.status).toBe('rejected')

    const { context: customer2Context, page: customer2Page } = await newAuthedPage(browser, 'customer.json')
    await customer2Page.goto(`${APP_URL}/account/reviews`)
    await customer2Page.waitForLoadState('networkidle')
    const rejectedTab = customer2Page.locator('button:has-text("Bị từ chối")')
    await rejectedTab.click()

    const reasonText = customer2Page.locator('text=Lý do từ chối:')
    await expect(reasonText).toBeVisible()
    await customer2Page.screenshot({ path: 'tests/e2e/screenshots/customer-rejection-notes.png' })
    await customer2Context.close()
  })

  test('API Constraints and Permission Checks', async ({ request }) => {
    const s = sessions()
    const customerToken = s.customer.token
    const customer2Token = s.customer2.token

    const db = await getDb()
    const product = await db.collection('products').findOne({ sku: 'E2E-PROD-001' })
    expect(product).toBeTruthy()
    const productId = product!._id.toString()

    const dummyOrderId = new ObjectId().toString()
    const invalidReviewRes = await request.post(`${API_URL}/reviews`, {
      headers: auth(customerToken),
      data: {
        productId,
        orderId: dummyOrderId,
        rating: 5,
        comment: 'Sản phẩm tuyệt vời nhưng tôi chưa mua hàng.'
      }
    })
    expect(invalidReviewRes.status()).toBe(404)

    const customerReview = await db.collection('reviews').findOne({
      userId: new ObjectId(s.customer.user._id),
      status: 'approved'
    })
    expect(customerReview).toBeTruthy()

    const selfHelpfulRes = await request.post(`${API_URL}/reviews/${customerReview!._id}/helpful`, {
      headers: auth(customerToken)
    })
    expect(selfHelpfulRes.status()).toBe(400)

    const otherHelpfulRes = await request.post(`${API_URL}/reviews/${customerReview!._id}/helpful`, {
      headers: auth(customer2Token)
    })
    expect(otherHelpfulRes.status()).toBe(200)

    const duplicateHelpfulRes = await request.post(`${API_URL}/reviews/${customerReview!._id}/helpful`, {
      headers: auth(customer2Token)
    })
    expect(duplicateHelpfulRes.status()).toBe(409)

    const crossDeleteRes = await request.delete(`${API_URL}/reviews/${customerReview!._id}`, {
      headers: auth(customer2Token)
    })
    expect(crossDeleteRes.status()).toBe(403)

    const crossUpdateRes = await request.put(`${API_URL}/reviews/${customerReview!._id}`, {
      headers: auth(customer2Token),
      data: { comment: 'Đánh giá đã bị sửa đổi trái phép!' }
    })
    expect(crossUpdateRes.status()).toBe(403)
  })

  test('XSS and HTML Injection Safety rendering', async ({ browser }) => {
    // 1. Clean up reviews for customer so E2E-PROD-002 is reviewable again
    const db = await getDb()
    const reviewsCol = db.collection('reviews')
    const customerUserId = new ObjectId(customer.user._id)
    await reviewsCol.deleteMany({ userId: customerUserId })

    const { context, page } = await newAuthedPage(browser, 'customer.json')
    await page.goto(`${APP_URL}/account/orders`)
    await page.waitForLoadState('networkidle')

    const writeReviewBtn = page
      .locator('div')
      .filter({ hasText: 'ORD-E2E-REV-SPAM' })
      .locator('button:has-text("Viết Đánh giá")')
      .first()
    await expect(writeReviewBtn).toBeVisible()
    await writeReviewBtn.click()

    const productItem = page.getByRole('heading', { name: '[E2E] Omega-3 Fish Oil' }).first()
    await expect(productItem).toBeVisible()
    await productItem.click()

    const dialog = page.locator('role=dialog')
    await expect(dialog).toBeVisible()

    const star5 = dialog.locator('.flex.items-center.gap-0\\.5 button').nth(4)
    await star5.click()
    
    const xssTitle = '<script>alert("XSS Title")</script>'
    const xssComment = '<b>Tuyệt vời</b> <img src="x" onerror="alert(\'XSS Comment\')">'
    
    await dialog.locator('input#title').fill(xssTitle)
    await dialog.locator('textarea#comment').fill(xssComment)

    await dialog.locator('button[type="submit"]').click()
    const toastLocator = page.locator('text=thành công')
    await expect(toastLocator).toBeVisible({ timeout: 15000 })
    await context.close()

    const guestPage = await browser.newPage()
    
    let alertTriggered = false
    guestPage.on('dialog', async (dialog) => {
      alertTriggered = true
      await dialog.dismiss()
    })

    await guestPage.goto(`${APP_URL}/products/e2e-omega-3-fish-oil`)
    await guestPage.waitForLoadState('networkidle')

    const reviewTabBtn = guestPage.locator('button:has-text("Đánh giá")').first()
    await reviewTabBtn.click()

    const titleText = guestPage.locator('h4', { hasText: '<script>alert("XSS Title")</script>' }).first()
    const commentText = guestPage.locator('p', { hasText: '<b>Tuyệt vời</b> <img src="x" onerror="alert(\'XSS Comment\')">' }).first()

    await expect(titleText).toBeVisible()
    await expect(commentText).toBeVisible()
    expect(alertTriggered).toBeFalsy()

    await guestPage.screenshot({ path: 'tests/e2e/screenshots/xss-safe-rendering.png' })
    await guestPage.close()
  })
})
