import { expect, test, type Page, type APIRequestContext } from '@playwright/test'
import { auth, cleanupPrescriptionData, loginSession, newPharmacistPage, seedPrescriptionData, API_URL } from '../../prescriptions/e2e/helpers'

const TYPESENSE_URL = process.env.E2E_TYPESENSE_URL || 'http://localhost:7700'
const TYPESENSE_API_KEY = process.env.TYPESENSE_API_KEY || 'medispace-ts-secret'
const indexedTypesenseProductIds = new Set<string>()

function typesenseProductDocument(product: { _id: { toString(): string }; name: string; sku: string }) {
  const id = product._id.toString()
  return {
    id,
    mongoId: id,
    name: product.name,
    slug: product.sku.toLowerCase(),
    sku: product.sku,
    barcode: product.sku,
    shortDescription: 'E2E pharmacist create-order product',
    categoryId: 'e2e-rx-category',
    categoryName: 'Rx',
    brandId: 'e2e-rx-brand',
    brandName: 'E2E Brand',
    requiresPrescription: true,
    isActive: true,
    inStock: true,
    stockQuantity: 100,
    price: 120000,
    originalPrice: 120000,
    salePrice: 120000,
    discountPercentage: 0,
    defaultUnit: 'Hộp',
    priceVariantsJson: JSON.stringify([{ unit: 'Hộp', price: 120000, quantityPerUnit: 10, isDefault: true }]),
    maxOrderQuantity: 10,
    campaignId: '',
    campaignName: '',
    campaignBadgeText: '',
    campaignBadgeColor: '',
    searchTextNormalized: `${product.name} ${product.sku}`.toLowerCase(),
    rating: 4.8,
    reviewCount: 0,
    featuredImage: '/__mock_storage/e2e-prescription-image.png',
    activeIngredients: 'Amoxicillin',
    indications: 'E2E prescription product',
    manufacturer: 'E2E Manufacturer',
    dosageForm: 'Viên nang',
    strength: '500mg',
    packSize: 'Hộp 10 viên',
    dosageInstructions: 'Uống sau ăn',
    storageInstructions: 'Bảo quản nơi khô ráo',
    createdAt: Date.now(),
  }
}

async function indexE2EProductsInTypesense(request: APIRequestContext, data: Awaited<ReturnType<typeof seedPrescriptionData>>) {
  const health = await request.get(`${TYPESENSE_URL}/health`, { headers: { 'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY } })
  expect(health.ok(), `Typesense must be running at ${TYPESENSE_URL}`).toBeTruthy()

  for (const product of [data.product, data.extraProduct]) {
    const response = await request.post(`${TYPESENSE_URL}/collections/products/documents?action=upsert`, {
      headers: { 'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY },
      data: typesenseProductDocument(product),
    })
    expect(response.ok(), await response.text()).toBeTruthy()
    indexedTypesenseProductIds.add(product._id.toString())
  }
}

async function cleanupTypesenseProducts(request: APIRequestContext) {
  const ids = Array.from(indexedTypesenseProductIds)
  indexedTypesenseProductIds.clear()
  await Promise.all(
    ids.map(async (id) => {
      await request.delete(`${TYPESENSE_URL}/collections/products/documents/${id}`, {
        headers: { 'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY },
      }).catch(() => undefined)
    })
  )
}

async function expectTypesenseSearch(response: Awaited<ReturnType<Page['waitForResponse']>>) {
  expect(response.ok(), await response.text()).toBeTruthy()
  const body = await response.json()
  expect(body.source, 'product search should use real Typesense in this action matrix').toBe('typesense')
  expect(body.found).toBeGreaterThan(0)
  return body
}

async function addProductByName(page: Page, productName: string) {
  const productCard = page
    .getByText(productName)
    .first()
    .locator('xpath=ancestor::*[.//button[contains(normalize-space(.), "Thêm")]][1]')
  await productCard.getByRole('button', { name: /Thêm/ }).click()
}

async function expectCreateOrderPayload(page: Page, action: () => Promise<void>) {
  const [request, response] = await Promise.all([
    page.waitForRequest((req) => req.method() === 'POST' && req.url().includes('/pharmacist/orders')),
    page.waitForResponse((res) => res.request().method() === 'POST' && res.url().includes('/pharmacist/orders')),
    action(),
  ])
  return { payload: request.postDataJSON(), response }
}

async function createOnlinePaymentOrder(request: APIRequestContext, token: string, data: Awaited<ReturnType<typeof seedPrescriptionData>>, paymentMethod: 'payos' | 'vnpay') {
  const response = await request.post(`${API_URL}/pharmacist/orders`, {
    headers: { ...auth(token), 'x-idempotency-key': `ui-action-${paymentMethod}-${Date.now()}` },
    data: {
      customerId: '0900000999',
      items: [{ productId: data.product._id.toString(), quantity: 1, unit: 'Hộp' }],
      shippingAddress: {
        firstName: 'E2E',
        lastName: 'Customer',
        phone: '0900000999',
        email: 'e2e.rx.customer@medispace.local',
        address: 'Tại quầy',
        ward: '',
        district: '',
        province: '',
      },
      deliveryMethod: 'instore',
      paymentMethod,
      safetyReviewConfirmed: true,
      pharmacistNotes: `E2E action matrix ${paymentMethod}`,
    },
  })
  expect(response.ok(), await response.text()).toBeTruthy()
  const result = (await response.json()).result
  expect(result.paymentUrl, `${paymentMethod} should return a payment URL`).toContain('http')
  expect(result.paymentUrlError).toBe(false)
  expect(result.order.taxAmount).toBe(0)
  expect(result.order.paymentStatus).toBe('pending')
  return result
}

test.describe.serial('pharmacist/create-order action matrix', () => {
  test.afterEach(async ({ request }) => {
    await cleanupTypesenseProducts(request)
    await cleanupPrescriptionData()
  })

  test('clicks product, cart, customer, payment, safety, note, and submit actions with real create-order API', async ({ browser, request }) => {
    const data = await seedPrescriptionData()
    await indexE2EProductsInTypesense(request, data)
    const page = await newPharmacistPage(browser, data.pharmacist)

    await page.goto('/pharmacist/create-order')
    await expect(page.getByTestId('create-order-page')).toBeVisible({ timeout: 30_000 })
    const submit = page.getByTestId('create-order-submit-btn')
    await expect(submit).toBeDisabled()

    const productSearch = page.getByPlaceholder('Tìm thuốc, barcode, tên, thành phần...')
    const firstSearch = page.waitForResponse((res) => res.url().includes('/search/products') && res.url().includes(data.product.sku))
    await productSearch.fill(data.product.sku)
    await expectTypesenseSearch(await firstSearch)
    await expect(page.getByText(data.product.name).first()).toBeVisible()

    await page.getByRole('button', { name: /^Xoá$/ }).click()
    await expect(page.getByText('Không tìm thấy sản phẩm')).toBeVisible()

    const rxSearch = page.waitForResponse((res) => res.url().includes('/search/products') && res.url().includes('requiresPrescription=true'))
    await page.getByRole('button', { name: /Thuốc kê đơn/ }).click()
    await expectTypesenseSearch(await rxSearch)
    await expect(page.getByText(data.product.name).first()).toBeVisible()

    await addProductByName(page, data.product.name)
    await expect(page.getByTestId('order-item')).toHaveCount(1)
    await expect(submit).toBeDisabled()
    await expect(page.getByText('Tôi xác nhận đã kiểm tra đơn thuốc')).toBeVisible()

    const quantity = page.getByTestId('order-item-quantity-input').first()
    await expect(quantity).toHaveValue('1')
    await page.getByTestId('order-item').first().getByRole('button').filter({ has: page.locator('svg') }).nth(2).click()
    await expect(quantity).toHaveValue('2')
    await quantity.fill('1')
    await expect(page.getByText('Tổng cộng:')).toBeVisible()
    await expect(page.getByText('VAT 10%')).toHaveCount(0)

    await page.getByRole('button', { name: /Ghi chú/ }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('dialog').getByRole('textbox').fill('Uống sau ăn, theo dõi dị ứng')
    await page.getByRole('button', { name: /Lưu/ }).click()
    await expect(page.getByText('Uống sau ăn, theo dõi dị ứng')).toBeVisible()

    const customerSearch = page.getByPlaceholder('Nhập tên hoặc số điện thoại khách hàng...')
    const patientResponse = page.waitForResponse((res) => res.url().includes('/pharmacist/patients/search'))
    await customerSearch.fill('0900000999')
    await patientResponse
    await page.getByText('E2E Customer').click()
    await expect(page.getByText('0900000999')).toBeVisible()
    await page.getByTitle('Gọi cho khách hàng').click()
    await page.getByTitle('Chat với khách hàng').click()
    await page.getByTitle('Lịch sử mua hàng').click()
    await expect(page.getByText('0900000999')).toBeVisible()

    await page.getByText('Chuyển khoản ngân hàng').click()
    await page.getByText('Thanh toán qua PayOS').click()
    await page.getByText('Thanh toán qua VNPay').click()
    await page.getByText('Quẹt thẻ máy POS').click()

    await page.getByLabel(/Tôi xác nhận đã kiểm tra đơn thuốc/).click()
    await expect(submit).toBeEnabled()

    await page.getByPlaceholder(/Hướng dẫn sử dụng/).fill('E2E pharmacist notes from button matrix')
    const { payload, response } = await expectCreateOrderPayload(page, () => submit.click())
    expect(response.status()).toBe(201)
    const result = (await response.json()).result
    expect(payload.paymentMethod).toBe('credit_card_pos')
    expect(payload.deliveryMethod).toBe('instore')
    expect(payload.safetyReviewConfirmed).toBe(true)
    expect(payload.items).toEqual([{ productId: data.product._id.toString(), quantity: 1, unit: 'Hộp', notes: 'Uống sau ăn, theo dõi dị ứng' }])
    expect(result.order.taxAmount).toBe(0)
    expect(result.order.totalAmount).toBe(120000)
    expect(result.order.paymentStatus).toBe('paid')
    await expect(page).toHaveURL(/\/pharmacist\/orders/)
  })

  test('delivery tab exposes GHN address validation and blocks submit before selecting GHN service', async ({ browser, request }) => {
    const data = await seedPrescriptionData()
    await indexE2EProductsInTypesense(request, data)
    const page = await newPharmacistPage(browser, data.pharmacist)

    await page.goto('/pharmacist/create-order')
    await expect(page.getByTestId('create-order-page')).toBeVisible({ timeout: 30_000 })
    await page.getByRole('tab', { name: 'Giao tận nơi' }).click()
    await expect(page.getByText('Địa chỉ giao hàng (GHN)')).toBeVisible()
    await expect(page.getByText('Thanh toán khi nhận hàng (COD)')).toBeVisible()
    await expect(page.getByText('Vui lòng điền đầy đủ Quận/Huyện và Phường/Xã để xem phí giao hàng')).toBeVisible()

    const search = page.waitForResponse((res) => res.url().includes('/search/products') && res.url().includes(data.product.sku))
    await page.getByPlaceholder('Tìm thuốc, barcode, tên, thành phần...').fill(data.product.sku)
    await expectTypesenseSearch(await search)
    await expect(page.getByText(data.product.name).first()).toBeVisible()
    await addProductByName(page, data.product.name)
    await page.getByLabel(/Tôi xác nhận đã kiểm tra đơn thuốc/).click()
    await page.getByText('Thanh toán qua PayOS').click()

    let created = false
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().includes('/pharmacist/orders')) created = true
    })
    await page.getByTestId('create-order-submit-btn').click()
    await expect(page.getByText('Vui lòng nhập đầy đủ địa chỉ giao hàng GHN')).toBeVisible()
    expect(created).toBe(false)
  })

  test('PayOS and VNPay pharmacist order APIs return real payment URLs', async ({ request }) => {
    const data = await seedPrescriptionData()
    const session = await loginSession(data.pharmacist.email, data.pharmacist.password)
    const payos = await createOnlinePaymentOrder(request, session.token, data, 'payos')
    const vnpay = await createOnlinePaymentOrder(request, session.token, data, 'vnpay')
    expect(payos.paymentUrl).toContain('pay')
    expect(vnpay.paymentUrl).toContain('vnpayment')
  })
})
