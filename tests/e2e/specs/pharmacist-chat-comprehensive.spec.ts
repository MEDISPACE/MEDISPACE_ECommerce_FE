import { test, expect, request as playwrightRequest, type Page } from '@playwright/test'
import { createHash } from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { MongoClient, ObjectId } from 'mongodb'

const APP_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'
const API_URL = process.env.E2E_API_URL || 'http://localhost:8000'
const SCREENSHOT_DIR = path.resolve('tests/e2e/screenshots/pharmacist-chat-comprehensive')

const USERS = {
  customer: { email: 'e2e.customer@medispace.local', password: 'Customer123!aA' },
  pharmacist: { email: 'e2e.pharmacist@medispace.local', password: 'Pharmacist123!aA' },
  pharmacist2: { email: 'e2e.pharmacist2@medispace.local', password: 'Pharmacist123!aA' }
}

const PRODUCT_SLUG = 'e2e-chat-paracetamol-500mg'

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function mongoUri() {
  return `mongodb+srv://${encodeURIComponent(requireEnv('DB_USERNAME'))}:${encodeURIComponent(requireEnv('DB_PASSWORD'))}@medispacedb.35qkwso.mongodb.net/?retryWrites=true&w=majority&appName=MediSpaceDB`
}

function hashPassword(password: string) {
  return createHash('sha256').update(password + requireEnv('PASSWORD_SECRET')).digest('hex')
}

async function seedChatData() {
  const client = new MongoClient(mongoUri())
  await client.connect()
  try {
    const db = client.db(requireEnv('DB_NAME'))
    const users = db.collection('users')
    const products = db.collection('products')
    const conversations = db.collection('conversations')
    const messages = db.collection('messages')
    const now = new Date()

    for (const [index, user] of [USERS.pharmacist, USERS.pharmacist2].entries()) {
      await users.updateOne(
        { email: user.email },
        {
          $set: {
            email: user.email,
            password: hashPassword(user.password),
            role: 1,
            status: 1,
            firstName: 'E2E',
            lastName: index === 0 ? 'Pharmacist' : 'Pharmacist Two',
            phoneNumber: index === 0 ? '0900000003' : '0900000004',
            dateOfBirth: new Date('1990-01-01'),
            gender: 1,
            avatar: '',
            addresses: [],
            medicalProfile: {},
            lisenseNumber: index === 0 ? 'PH-E2E-0001' : 'PH-E2E-0002',
            isOnline: false,
            onlineCount: 0,
            emailVerifyToken: '',
            forgotPasswordToken: '',
            updatedAt: now,
            wishlist: []
          },
          $setOnInsert: { _id: new ObjectId(), createdAt: now, created_by: new ObjectId() }
        },
        { upsert: true }
      )
    }

    await products.updateOne(
      { slug: PRODUCT_SLUG },
      {
        $set: {
          name: '[E2E] Paracetamol 500mg Chat Test',
          slug: PRODUCT_SLUG,
          sku: 'E2E-CHAT-PARA-500',
          isActive: true,
          stockQuantity: 100,
          requiresPrescription: false,
          featuredImage: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          priceVariants: [{ unit: 'Hộp', price: 25000, isDefault: true }],
          updatedAt: now
        },
        $setOnInsert: { _id: new ObjectId(), createdAt: now }
      },
      { upsert: true }
    )

    const e2eUsers = await users
      .find({ email: { $in: [USERS.customer.email, USERS.pharmacist.email, USERS.pharmacist2.email] } })
      .project({ _id: 1 })
      .toArray()
    const userIds = e2eUsers.map((user) => user._id)
    const oldConversations = await conversations
      .find({ $or: [{ customerId: { $in: userIds } }, { pharmacistId: { $in: userIds } }] })
      .project({ _id: 1 })
      .toArray()
    const oldConversationIds = oldConversations.map((conversation) => conversation._id)
    if (oldConversationIds.length > 0) {
      await messages.deleteMany({ conversationId: { $in: oldConversationIds } })
      await conversations.deleteMany({ _id: { $in: oldConversationIds } })
    }
  } finally {
    await client.close()
  }
}

async function loginApi(email: string, password: string) {
  const api = await playwrightRequest.newContext()
  try {
    const response = await api.post(`${API_URL}/users/login`, {
      data: { email, password, rememberMe: false }
    })
    expect(response.ok(), await response.text()).toBeTruthy()
    const json = await response.json()
    return json.result.accessToken as string
  } finally {
    await api.dispose()
  }
}

async function apiRequest(method: 'GET' | 'POST' | 'DELETE', url: string, token: string, data?: unknown) {
  const api = await playwrightRequest.newContext()
  try {
    const response = await api.fetch(`${API_URL}${url}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      data
    })
    const text = await response.text()
    let json: any = {}
    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      json = { raw: text }
    }
    return { status: response.status(), ok: response.ok(), json, result: json.result || json.data || json }
  } finally {
    await api.dispose()
  }
}

async function loginUi(page: Page, email: string, password: string) {
  await page.goto(`${APP_URL}/login`, { waitUntil: 'domcontentloaded' })
  await page.getByTestId('login-email').fill(email)
  await page.getByTestId('login-password').fill(password)
  await page.getByTestId('login-submit').click()
  await page.waitForTimeout(1200)
}

async function screenshot(page: Page, name: string) {
  await mkdir(SCREENSHOT_DIR, { recursive: true })
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: true })
}

test.describe.serial('Pharmacist chat comprehensive QA', () => {
  test.setTimeout(180_000)

  test.beforeAll(async () => {
    await seedChatData()
  })

  test('covers guest, customer, pharmacist, privacy, security, product card, close, and mobile UI', async ({ browser }) => {
    const stamp = Date.now()
    const customerToken = await loginApi(USERS.customer.email, USERS.customer.password)
    const pharmacistToken = await loginApi(USERS.pharmacist.email, USERS.pharmacist.password)
    const pharmacist2Token = await loginApi(USERS.pharmacist2.email, USERS.pharmacist2.password)

    const guest = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    await guest.goto(APP_URL, { waitUntil: 'domcontentloaded' })
    await guest.getByLabel('Chat với dược sĩ').click({ force: true })
    await expect(guest.getByText('Đăng nhập để chat')).toBeVisible()
    await screenshot(guest, '01-guest-login-required')
    await guest.close()

    const customerPage = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    await loginUi(customerPage, USERS.customer.email, USERS.customer.password)
    await customerPage.goto(APP_URL, { waitUntil: 'domcontentloaded' })
    await customerPage.getByLabel('Chat với dược sĩ').click({ force: true })
    await expect(customerPage.getByText('Chọn hình thức hỗ trợ')).toBeVisible()
    await screenshot(customerPage, '02-customer-chat-portal')

    const created = await apiRequest('POST', '/chats/conversations', customerToken, { type: 'pharmacist' })
    expect(created.status).toBe(200)
    const conversationId = created.result._id as string
    const customerText = `QA phủ luồng khách hàng ${stamp}`
    const customerMessage = await apiRequest('POST', '/chats/messages', customerToken, {
      conversationId,
      type: 'text',
      content: customerText
    })
    expect(customerMessage.status).toBe(200)

    await customerPage.reload({ waitUntil: 'domcontentloaded' })
    await customerPage.getByLabel('Chat với dược sĩ').click({ force: true })
    await expect(customerPage.getByText(customerText).last()).toBeVisible()
    await screenshot(customerPage, '03-customer-active-pharmacist-chat')

    const customerProductAttack = await apiRequest('POST', '/chats/messages', customerToken, {
      conversationId,
      type: 'product',
      productRef: { productId: '6a427dc15324bb3d4c58b00f', name: 'Fake', price: 1 }
    })
    expect(customerProductAttack.status).toBe(403)
    await screenshot(customerPage, '04-customer-product-card-forbidden-api-verified')

    const badImage = await apiRequest('POST', '/chats/messages', customerToken, {
      conversationId,
      type: 'image',
      imageUrl: 'file:///etc/passwd'
    })
    expect(badImage.status).toBe(400)

    const pharmacistPage = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await loginUi(pharmacistPage, USERS.pharmacist.email, USERS.pharmacist.password)
    await pharmacistPage.goto(`${APP_URL}/pharmacist/chat`, { waitUntil: 'domcontentloaded' })
    await expect(pharmacistPage.getByText('Tin nhắn')).toBeVisible()
    await pharmacistPage.getByPlaceholder('Tìm khách hàng...').fill('E2E Customer')
    await expect(pharmacistPage.getByText('E2E Customer')).toBeVisible()
    await screenshot(pharmacistPage, '05-pharmacist-pending-queue')

    await pharmacistPage.getByRole('button', { name: 'Xem' }).first().click()
    await expect(pharmacistPage.locator('h3', { hasText: 'E2E Customer' })).toBeVisible()
    await expect(pharmacistPage.getByText(customerText).last()).toBeVisible()
    await screenshot(pharmacistPage, '06-pharmacist-preview-before-claim')

    await pharmacistPage.getByRole('button', { name: /Nhận tư vấn|Nhận tư vấn này/ }).first().click()
    await expect(pharmacistPage.getByText('Đang phụ trách')).toBeVisible()
    await screenshot(pharmacistPage, '07-pharmacist-claimed-conversation')

    const pharmacist2Page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await loginUi(pharmacist2Page, USERS.pharmacist2.email, USERS.pharmacist2.password)
    await pharmacist2Page.goto(`${APP_URL}/pharmacist/chat`, { waitUntil: 'domcontentloaded' })
    await expect(pharmacist2Page.getByText('Tin nhắn')).toBeVisible()
    await pharmacist2Page.getByPlaceholder('Tìm khách hàng...').fill('E2E Customer')
    await expect(pharmacist2Page.getByText('E2E Customer')).toHaveCount(0)
    await screenshot(pharmacist2Page, '08-second-pharmacist-cannot-see-assigned-chat')

    const reply = `QA dược sĩ trả lời realtime ${stamp}`
    await pharmacistPage.getByPlaceholder('Nhập tin nhắn...').fill(reply)
    await pharmacistPage.keyboard.press('Enter')
    await expect(pharmacistPage.getByText(reply).last()).toBeVisible()
    await screenshot(pharmacistPage, '09-pharmacist-sent-text-reply')
    await expect(customerPage.getByText(reply).last()).toBeVisible()
    await screenshot(customerPage, '10-customer-received-text-realtime')

    const assignedCustomerMessage = `QA tin riêng sau assign ${stamp}`
    await apiRequest('POST', '/chats/messages', customerToken, {
      conversationId,
      type: 'text',
      content: assignedCustomerMessage
    })
    await expect(pharmacistPage.getByText(assignedCustomerMessage).last()).toBeVisible()
    await expect(pharmacist2Page.getByText(assignedCustomerMessage)).toHaveCount(0)
    await screenshot(pharmacistPage, '11-assigned-pharmacist-receives-customer-message')
    await screenshot(pharmacist2Page, '12-second-pharmacist-no-private-message')

    await pharmacistPage.getByTitle('Gửi sản phẩm').click()
    await pharmacistPage.getByPlaceholder('Tìm sản phẩm... (VD: paracetamol, vitamin C)').fill('E2E Paracetamol')
    await expect(pharmacistPage.getByText('Gửi sản phẩm').last()).toBeVisible()
    await screenshot(pharmacistPage, '13-product-picker-opened')

    const productByApi = await apiRequest('POST', '/chats/messages', pharmacistToken, {
      conversationId,
      type: 'product',
      productRef: { productId: '6a427dc15324bb3d4c58b00f', name: 'Fake UI name', price: 1 }
    })
    expect(productByApi.status).toBe(200)
    expect(productByApi.result.productRef.price).toBe(25000)
    expect(productByApi.result.productRef.name).toBe('[E2E] Paracetamol 500mg Chat Test')

    await expect(pharmacistPage.getByText('[E2E] Paracetamol 500mg Chat Test').last()).toBeVisible()
    await expect(customerPage.getByText('[E2E] Paracetamol 500mg Chat Test').last()).toBeVisible()
    await screenshot(pharmacistPage, '14-pharmacist-product-card-sent')
    await screenshot(customerPage, '15-customer-product-card-received')

    const doubleClaim = await apiRequest('POST', `/chats/conversations/${conversationId}/assign`, pharmacist2Token)
    expect(doubleClaim.status).toBe(409)
    await screenshot(pharmacist2Page, '16-second-pharmacist-double-claim-conflict-api-verified')

    const close = await apiRequest('DELETE', `/chats/conversations/${conversationId}`, customerToken)
    expect(close.status).toBe(200)
    await expect(customerPage.getByText('Cuộc hội thoại đã được đóng.')).toBeVisible()
    await screenshot(customerPage, '17-customer-chat-closed-soft-delete')

    const closedMessages = await apiRequest('GET', `/chats/messages?conversationId=${conversationId}`, customerToken)
    expect(closedMessages.status).toBe(200)
    expect(closedMessages.result.messages.length).toBeGreaterThan(0)

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true })
    await loginUi(mobile, USERS.customer.email, USERS.customer.password)
    await mobile.goto(APP_URL, { waitUntil: 'domcontentloaded' })
    await mobile.getByLabel('Chat với dược sĩ').click({ force: true })
    await expect(mobile.getByText('Chọn hình thức hỗ trợ')).toBeVisible()
    await screenshot(mobile, '18-mobile-customer-chat-portal')
    await mobile.close()

    await customerPage.close()
    await pharmacistPage.close()
    await pharmacist2Page.close()
  })
})
