import { test, expect, request as playwrightRequest, type Page } from '@playwright/test'
import { createHash } from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { MongoClient, ObjectId } from 'mongodb'

const APP_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'
const API_URL = process.env.E2E_API_URL || 'http://localhost:8000'
const SCREENSHOT_DIR = path.resolve('tests/e2e/screenshots/pharmacist-dashboard-production-gate')

const USERS = {
  pharmacist: { email: 'e2e.dashboard.pharmacist@medispace.local', password: 'Pharmacist123!aA' },
  customer: { email: 'e2e.dashboard.customer@medispace.local', password: 'Customer123!aA' },
  otherCustomer: { email: 'e2e.dashboard.other@medispace.local', password: 'Customer123!aA' },
}

const RX_PRODUCT_SLUG = 'e2e-dashboard-rx-amoxicillin'
const PREFIX = '[E2E-DASHBOARD]'

type SeedData = {
  pharmacist: any
  customer: any
  otherCustomer: any
  product: any
  pendingPrescription: any
  verifiedPrescription: any
  rejectedPrescription: any
}

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

function mongoUri() {
  return `mongodb+srv://${encodeURIComponent(requireEnv('DB_USERNAME'))}:${encodeURIComponent(requireEnv('DB_PASSWORD'))}@medispacedb.35qkwso.mongodb.net/?retryWrites=true&w=majority&appName=MediSpaceDB`
}

function hashPassword(password: string) {
  return createHash('sha256')
    .update(password + requireEnv('PASSWORD_SECRET'))
    .digest('hex')
}

async function seedDashboardData(): Promise<SeedData> {
  const client = new MongoClient(mongoUri())
  await client.connect()
  try {
    const db = client.db(requireEnv('DB_NAME'))
    const users = db.collection('users')
    const products = db.collection('products')
    const prescriptions = db.collection('prescriptions')
    const orders = db.collection('orders')
    const conversations = db.collection('conversations')
    const now = new Date()
    const future = new Date(Date.now() + 30 * 86_400_000)

    await orders.deleteMany({ orderNumber: { $regex: '^E2E-DASH-' } })
    await prescriptions.deleteMany({ prescriptionNumber: { $regex: '^E2E-DASH-' } })
    await conversations.deleteMany({ lastMessage: { $regex: '^E2E dashboard' } })

    const userDocs = [
      {
        ...USERS.pharmacist,
        role: 1,
        firstName: 'E2E',
        lastName: 'Dashboard Pharmacist',
        phoneNumber: '0919000001',
        lisenseNumber: 'PH-E2E-DASH',
      },
      {
        ...USERS.customer,
        role: 0,
        firstName: 'E2E',
        lastName: 'Dashboard Customer',
        phoneNumber: '0919000002',
        lisenseNumber: '',
      },
      {
        ...USERS.otherCustomer,
        role: 0,
        firstName: 'E2E',
        lastName: 'Other Customer',
        phoneNumber: '0919000003',
        lisenseNumber: '',
      },
    ]

    for (const user of userDocs) {
      await users.updateOne(
        { email: user.email },
        {
          $set: {
            email: user.email,
            password: hashPassword(user.password),
            role: user.role,
            status: 1,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            dateOfBirth: new Date('1990-01-01'),
            gender: 1,
            avatar: '',
            addresses: [
              {
                isDefault: true,
                phone: user.phoneNumber,
                address: '1 E2E Street',
                ward: 'Ben Thanh',
                district: '1',
                province: 'TP.HCM',
              },
            ],
            medicalProfile: {},
            lisenseNumber: user.lisenseNumber,
            isOnline: user.role === 1,
            onlineCount: user.role === 1 ? 1 : 0,
            emailVerifyToken: '',
            forgotPasswordToken: '',
            updatedAt: now,
            wishlist: [],
          },
          $setOnInsert: { _id: new ObjectId(), createdAt: now, created_by: new ObjectId() },
        },
        { upsert: true },
      )
    }

    const [pharmacist, customer, otherCustomer] = await Promise.all([
      users.findOne({ email: USERS.pharmacist.email }),
      users.findOne({ email: USERS.customer.email }),
      users.findOne({ email: USERS.otherCustomer.email }),
    ])
    if (!pharmacist || !customer || !otherCustomer) throw new Error('Failed to seed E2E users')

    await products.updateOne(
      { slug: RX_PRODUCT_SLUG },
      {
        $set: {
          name: `${PREFIX} Amoxicillin 500mg`,
          slug: RX_PRODUCT_SLUG,
          sku: 'E2E-DASH-RX-AMOX',
          isActive: true,
          stockQuantity: 100,
          requiresPrescription: true,
          featuredImage: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          priceVariants: [{ unit: 'Hộp', price: 120000, quantityPerUnit: 10, isDefault: true }],
          updatedAt: now,
        },
        $setOnInsert: { _id: new ObjectId(), createdAt: now },
      },
      { upsert: true },
    )
    const product = await products.findOne({ slug: RX_PRODUCT_SLUG })
    if (!product) throw new Error('Failed to seed E2E product')

    const makePrescription = (status: 'pending' | 'verified' | 'rejected') => ({
      _id: new ObjectId(),
      prescriptionNumber: `E2E-DASH-${status.toUpperCase()}-${Date.now()}`,
      customerId: customer._id,
      doctorName: `${PREFIX} Dr. QA`,
      hospitalName: `${PREFIX} Clinic`,
      prescriptionDate: now,
      images: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'],
      medications: [
        {
          productId: product._id,
          productName: product.name,
          dosage: '500mg',
          quantity: 1,
          instructions: 'Uống sau ăn',
        },
      ],
      status,
      verifiedBy: status === 'pending' ? undefined : pharmacist._id,
      verifiedAt: status === 'pending' ? undefined : now,
      pharmacistNotes: status === 'rejected' ? 'E2E rejection reason' : 'E2E verified note',
      validUntil: future,
      createdAt: now,
      updatedAt: now,
    })

    const pendingPrescription = makePrescription('pending')
    const verifiedPrescription = makePrescription('verified')
    const rejectedPrescription = makePrescription('rejected')
    await prescriptions.insertMany([pendingPrescription, verifiedPrescription, rejectedPrescription])

    await orders.insertOne({
      _id: new ObjectId(),
      userId: customer._id,
      orderNumber: `E2E-DASH-PAID-${Date.now()}`,
      items: [
        {
          productId: product._id,
          name: product.name,
          sku: product.sku,
          quantity: 1,
          unit: 'Hộp',
          unitPrice: 120000,
          totalPrice: 120000,
          prescriptionRequired: true,
        },
      ],
      itemCount: 1,
      shippingAddress: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phoneNumber,
        email: customer.email,
        address: 'Tại quầy',
        ward: '',
        district: '',
        province: '',
      },
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      subtotal: 120000,
      taxAmount: 0,
      shippingFee: 0,
      discountAmount: 0,
      totalAmount: 120000,
      createdAt: now,
      updatedAt: now,
      paidAt: now,
      deliveredAt: now,
    })

    await conversations.insertOne({
      _id: new ObjectId(),
      customerId: customer._id,
      pharmacistId: pharmacist._id,
      type: 'pharmacist',
      status: 'active',
      lastMessage: `E2E dashboard active chat ${Date.now()}`,
      unreadCount: { customer: 0, pharmacist: 1 },
      createdAt: now,
      updatedAt: now,
    })

    return {
      pharmacist,
      customer,
      otherCustomer,
      product,
      pendingPrescription,
      verifiedPrescription,
      rejectedPrescription,
    }
  } finally {
    await client.close()
  }
}

async function loginApi(email: string, password: string) {
  const api = await playwrightRequest.newContext()
  try {
    const response = await api.post(`${API_URL}/users/login`, {
      data: { email, password, rememberMe: false },
    })
    expect(response.ok(), await response.text()).toBeTruthy()
    const json = await response.json()
    return json.result.accessToken as string
  } finally {
    await api.dispose()
  }
}

async function screenshot(page: Page, name: string) {
  await mkdir(SCREENSHOT_DIR, { recursive: true })
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: true })
}

test.describe.serial('Pharmacist dashboard production gate', () => {
  test.setTimeout(180_000)

  let seed: SeedData
  let pharmacistToken: string

  test.beforeAll(async () => {
    seed = await seedDashboardData()
    pharmacistToken = await loginApi(USERS.pharmacist.email, USERS.pharmacist.password)
  })

  test('renders dashboard with live pharmacist KPIs and pending queue screenshots', async ({ browser, request }) => {
    const statsResponse = await request.get(`${API_URL}/pharmacist/dashboard/stats`, {
      headers: { Authorization: `Bearer ${pharmacistToken}` },
    })
    expect(statsResponse.ok(), await statsResponse.text()).toBeTruthy()
    const stats = (await statsResponse.json()).result
    expect(stats.pendingPrescriptions).toBeGreaterThanOrEqual(1)
    expect(stats.activeChats).toBeGreaterThanOrEqual(1)
    expect(stats.totalRevenue).toBeGreaterThanOrEqual(120000)

    const pendingResponse = await request.get(`${API_URL}/prescriptions/pending`, {
      headers: { Authorization: `Bearer ${pharmacistToken}` },
      params: { limit: 50 },
    })
    expect(pendingResponse.ok(), await pendingResponse.text()).toBeTruthy()
    const pendingRows = (await pendingResponse.json()).result.prescriptions
    expect(pendingRows.some((row: any) => row._id === seed.pendingPrescription._id.toString())).toBeTruthy()
    expect(pendingRows.some((row: any) => row._id === seed.rejectedPrescription._id.toString())).toBeFalsy()

    const context = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [
          {
            origin: new URL(APP_URL).origin,
            localStorage: [
              { name: 'medispace_access_token', value: pharmacistToken },
              { name: 'medispace_user_data', value: JSON.stringify(seed.pharmacist) },
              { name: 'medispace_session_hint', value: '1' },
            ],
          },
        ],
      },
      viewport: { width: 1440, height: 900 },
    })
    const page = await context.newPage()
    await page.goto(`${APP_URL}/pharmacist/dashboard`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Dashboard Tổng quan')).toBeVisible()
    await expect(page.getByText('Đơn thuốc chờ')).toBeVisible()
    await expect(page.getByText('Chat đang mở')).toBeVisible()
    await expect(page.getByText(seed.pendingPrescription.prescriptionNumber)).toBeVisible()
    await screenshot(page, '01-dashboard-overview-live-kpis')

    await page.getByRole('tab', { name: 'Đơn thuốc' }).click()
    await expect(page.getByRole('heading', { name: /Quản lý đơn thuốc/ })).toBeVisible()
    await expect(page.getByText(seed.pendingPrescription.prescriptionNumber)).toBeVisible()
    await expect(page.getByText(seed.rejectedPrescription.prescriptionNumber)).toHaveCount(0)
    await screenshot(page, '02-dashboard-pending-prescriptions-only')

    await page.goto(`${APP_URL}/pharmacist/create-order?prescriptionId=${seed.verifiedPrescription._id.toString()}`, {
      waitUntil: 'domcontentloaded',
    })
    await expect(page.getByRole('heading', { name: 'Tạo đơn hàng' })).toBeVisible()
    await expect(page.getByText(new RegExp(seed.verifiedPrescription.prescriptionNumber))).toBeVisible()
    await screenshot(page, '03-create-order-from-verified-prescription')

    await page.goto(`${APP_URL}/pharmacist/create-order?prescriptionId=${seed.pendingPrescription._id.toString()}`, {
      waitUntil: 'domcontentloaded',
    })
    await expect(page).toHaveURL(/\/pharmacist\/prescriptions/)
    await screenshot(page, '04-pending-prescription-create-order-blocked')

    await context.close()
  })

  test('enforces prescription verification and duplicate-order API guardrails', async ({ request }) => {
    const rejectWithoutReason = await request.put(
      `${API_URL}/prescriptions/${seed.pendingPrescription._id.toString()}/verify`,
      {
        headers: { Authorization: `Bearer ${pharmacistToken}` },
        data: { status: 'rejected', notes: '   ' },
      },
    )
    expect(rejectWithoutReason.status()).toBe(400)

    const baseOrderPayload = {
      customerId: seed.customer.phoneNumber,
      items: [{ productId: seed.product._id.toString(), quantity: 1, unit: 'Hộp' }],
      shippingAddress: {
        firstName: seed.customer.firstName,
        lastName: seed.customer.lastName,
        phone: seed.customer.phoneNumber,
        email: seed.customer.email,
        address: 'Tại quầy',
        ward: '',
        district: '',
        province: '',
      },
      deliveryMethod: 'instore',
      paymentMethod: 'cash',
      safetyReviewConfirmed: true,
      pharmacistNotes: 'E2E dashboard production gate',
    }

    const pendingOrder = await request.post(`${API_URL}/pharmacist/orders`, {
      headers: { Authorization: `Bearer ${pharmacistToken}` },
      data: { ...baseOrderPayload, prescriptionId: seed.pendingPrescription._id.toString() },
    })
    expect(pendingOrder.status()).toBe(400)

    const wrongCustomer = await request.post(`${API_URL}/pharmacist/orders`, {
      headers: { Authorization: `Bearer ${pharmacistToken}` },
      data: {
        ...baseOrderPayload,
        customerId: seed.otherCustomer.phoneNumber,
        prescriptionId: seed.verifiedPrescription._id.toString(),
      },
    })
    expect(wrongCustomer.status()).toBe(400)

    const created = await request.post(`${API_URL}/pharmacist/orders`, {
      headers: { Authorization: `Bearer ${pharmacistToken}` },
      data: { ...baseOrderPayload, prescriptionId: seed.verifiedPrescription._id.toString() },
    })
    expect(created.ok(), await created.text()).toBeTruthy()
    const createdOrder = (await created.json()).result
    expect(createdOrder.order.paymentStatus).toBe('paid')
    expect(createdOrder.order.orderStatus).toBe('delivered')

    const duplicate = await request.post(`${API_URL}/pharmacist/orders`, {
      headers: { Authorization: `Bearer ${pharmacistToken}` },
      data: { ...baseOrderPayload, prescriptionId: seed.verifiedPrescription._id.toString() },
    })
    expect(duplicate.status()).toBe(409)
  })
})
