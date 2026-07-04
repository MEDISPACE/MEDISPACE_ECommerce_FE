import { expect, request as playwrightRequest, type Browser, type Page, type APIRequestContext } from '@playwright/test'
import { createHash } from 'node:crypto'
import { mkdir } from 'node:fs/promises'
import { MongoClient, ObjectId, type Db } from 'mongodb'

export const APP_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'
export const API_URL = process.env.E2E_API_URL || 'http://localhost:8000'
export const PREFIX = '[E2E-RX]'
export const MOCK_IMAGE_URL = `${APP_URL}/__mock_storage/e2e-prescription-image.png`
export const EVIDENCE_DIR = 'tests/prescriptions/evidence'

export type SeededPrescriptionData = Awaited<ReturnType<typeof seedPrescriptionData>>

export function auth(token: string) {
  return { Authorization: `Bearer ${token}` }
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
  return createHash('sha256').update(password + requireEnv('PASSWORD_SECRET')).digest('hex')
}

async function withDb<T>(fn: (db: Db) => Promise<T>) {
  const client = new MongoClient(mongoUri())
  await client.connect()
  try {
    return await fn(client.db(requireEnv('DB_NAME')))
  } finally {
    await client.close()
  }
}

export async function cleanupPrescriptionData() {
  await withDb(async (db) => {
    await Promise.all([
      db.collection('orders').deleteMany({ orderNumber: { $regex: '^E2E-RX-' } }),
      db.collection('orders').deleteMany({ pharmacistNotes: { $regex: 'E2E' } }),
      db.collection('orders').deleteMany({ 'shippingAddress.email': { $regex: String.raw`^e2e\.rx\.` } }),
      db.collection('prescriptions').deleteMany({ prescriptionNumber: { $regex: '^E2E-RX-' } }),
      db.collection('products').deleteMany({ sku: { $regex: '^E2E-RX-' } }),
      db.collection('notifications').deleteMany({ title: { $regex: 'E2E-RX' } }).catch(() => undefined),
      db.collection('prescription_audit_logs').deleteMany({ e2e: true }).catch(() => undefined),
      db.collection('users').deleteMany({ email: { $regex: String.raw`^e2e\.rx\.` } })
    ])
  })
}

export async function seedPrescriptionData(options: { brokenImage?: boolean; missingCustomer?: boolean; longPending?: boolean; midnight?: boolean; zeroMapped?: boolean } = {}) {
  await cleanupPrescriptionData()
  return withDb(async (db) => {
    const now = new Date()
    const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000)
    const todayVnMidnightUtc = new Date(
      Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate()) - 7 * 60 * 60 * 1000
    )
    const old = new Date(Date.now() - (options.longPending ? 30 : 2) * 60 * 60 * 1000)
    const future = new Date(Date.now() + 30 * 86_400_000)
    const past = new Date(Date.now() - 2 * 86_400_000)
    const pharmacist = { _id: new ObjectId(), email: 'e2e.rx.pharmacist@medispace.local', password: 'Pharmacist123!aA' }
    const pharmacistB = { _id: new ObjectId(), email: 'e2e.rx.pharmacist.b@medispace.local', password: 'Pharmacist123!aA' }
    const unlicensed = { _id: new ObjectId(), email: 'e2e.rx.unlicensed@medispace.local', password: 'Pharmacist123!aA' }
    const offline = { _id: new ObjectId(), email: 'e2e.rx.offline@medispace.local', password: 'Pharmacist123!aA' }
    const customer = { _id: new ObjectId(), email: 'e2e.rx.customer@medispace.local', password: 'Customer123!aA' }
    const product = { _id: new ObjectId(), name: `${PREFIX} Amoxicillin 500mg`, sku: `E2E-RX-AMOX-${Date.now()}` }
    const extraProduct = { _id: new ObjectId(), name: `${PREFIX} Tampered Product 10mg`, sku: `E2E-RX-TAMPER-${Date.now()}` }
    const image = options.brokenImage ? `${APP_URL}/__mock_storage/broken-prescription-image.png` : MOCK_IMAGE_URL

    await db.collection('users').insertMany([
      makeUser(pharmacist, 1, 'PH-E2E-RX-1', true),
      makeUser(pharmacistB, 1, 'PH-E2E-RX-2', true),
      makeUser(unlicensed, 1, '', true),
      makeUser(offline, 1, 'PH-E2E-RX-OFF', false),
      makeUser(customer, 0, '', true, '0900000999')
    ])
    await db.collection('products').insertMany([
      makeProduct(product, 100, true),
      makeProduct(extraProduct, 100, true)
    ])

    const mappedMedication = { productId: product._id, productName: product.name, matchedName: product.name, dosage: '500mg', quantity: 1, unit: 'Hộp', instructions: 'Uống sau ăn', image: MOCK_IMAGE_URL }
    const unmatchedMedication = { productName: `${PREFIX} Unmapped 10mg`, dosage: '10mg', quantity: 1, unit: 'Hộp', instructions: 'Không có trong kho' }
    const base = {
      customerId: options.missingCustomer ? new ObjectId() : customer._id,
      customer: options.missingCustomer
        ? undefined
        : { _id: customer._id, firstName: 'E2E', lastName: 'Customer', phoneNumber: '0900000999', email: customer.email },
      patientName: 'Nguyen Van E2E',
      patientAge: '32',
      patientGender: 'male',
      diagnosis: 'Viêm họng cấp',
      doctorName: `${PREFIX} Dr. QA`,
      hospitalName: `${PREFIX} Clinic`,
      prescriptionDate: now,
      images: [image],
      medications: options.zeroMapped ? [unmatchedMedication] : [mappedMedication, unmatchedMedication],
      validUntil: future,
      createdAt: options.midnight ? todayVnMidnightUtc : old,
      updatedAt: old,
      ocrConfidence: 'high'
    }
    const pending = { _id: new ObjectId(), ...base, prescriptionNumber: `E2E-RX-PENDING-${Date.now()}`, status: 'pending' }
    const verified = { _id: new ObjectId(), ...base, prescriptionNumber: `E2E-RX-VERIFIED-${Date.now()}`, status: 'verified', verifiedBy: pharmacist._id, verifiedAt: now, pharmacistNotes: 'E2E verified note' }
    const rejected = { _id: new ObjectId(), ...base, prescriptionNumber: `E2E-RX-REJECTED-${Date.now()}`, status: 'rejected', verifiedBy: pharmacist._id, verifiedAt: now, pharmacistNotes: 'E2E rejection reason' }
    const expired = { _id: new ObjectId(), ...base, prescriptionNumber: `E2E-RX-EXPIRED-${Date.now()}`, status: 'expired', validUntil: past, createdAt: past }
    const today = { _id: new ObjectId(), ...base, prescriptionNumber: `E2E-RX-TODAY-${Date.now()}`, status: 'pending', createdAt: now }
    const many = Array.from({ length: 7 }, (_, index) => ({ _id: new ObjectId(), ...base, prescriptionNumber: `E2E-RX-PAGE-${index}-${Date.now()}`, status: 'pending', createdAt: new Date(now.getTime() - index * 1000) }))
    await db.collection('prescriptions').insertMany([pending, verified, rejected, expired, today, ...many])

    return { pharmacist, pharmacistB, unlicensed, offline, customer, product, extraProduct, pending, verified, rejected, expired, today, many }
  })
}

function makeUser(user: { _id: ObjectId; email: string; password: string }, role: number, license: string, isOnline: boolean, phone = '0900000111') {
  return {
    _id: user._id,
    email: user.email,
    password: hashPassword(user.password),
    role,
    status: 1,
    firstName: 'E2E',
    lastName: role === 1 ? 'Pharmacist' : 'Customer',
    phoneNumber: phone,
    dateOfBirth: new Date('1990-01-01'),
    gender: 1,
    avatar: '',
    addresses: [{ isDefault: true, phone, address: '1 E2E Street', ward: 'Ben Thanh', district: '1', province: 'TP.HCM' }],
    medicalProfile: {},
    lisenseNumber: license,
    isOnline,
    onlineCount: isOnline ? 1 : 0,
    emailVerifyToken: '',
    forgotPasswordToken: '',
    wishlist: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    created_by: new ObjectId()
  }
}

function makeProduct(product: { _id: ObjectId; name: string; sku: string }, stockQuantity: number, requiresPrescription: boolean) {
  return {
    _id: product._id,
    name: product.name,
    slug: product.sku.toLowerCase(),
    sku: product.sku,
    isActive: true,
    stockQuantity,
    requiresPrescription,
    featuredImage: MOCK_IMAGE_URL,
    priceVariants: [{ unit: 'Hộp', price: 120000, quantityPerUnit: 10, isDefault: true }],
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

export async function loginSession(email: string, password: string) {
  const api = await playwrightRequest.newContext()
  try {
    const res = await api.post(`${API_URL}/users/login`, { data: { email, password, rememberMe: false } })
    if (!res.ok()) throw new Error(`Cannot login ${email}: ${res.status()} ${await res.text()}`)
    const json = await res.json()
    const token = json?.result?.accessToken || json?.data?.accessToken || json?.accessToken
    if (!token) throw new Error(`Missing token for ${email}`)
    const me = await api.get(`${API_URL}/users/me`, { headers: auth(token) })
    const meJson = await me.json()
    const user = meJson?.user || meJson?.result?.user || meJson?.data?.user || {}
    return { token, user }
  } finally {
    await api.dispose()
  }
}

export async function newPharmacistPage(browser: Browser, account: { email: string; password: string }) {
  const session = await loginSession(account.email, account.password)
  const context = await browser.newContext()
  const page = await context.newPage()
  await mockImageStorage(page)
  await page.goto(APP_URL)
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('medispace_access_token', token)
    localStorage.setItem('medispace_user_data', JSON.stringify(user))
    localStorage.setItem('medispace_session_hint', '1')
  }, session)
  return page
}

export async function mockImageStorage(page: Page) {
  await page.route('**/__mock_storage/e2e-prescription-image.png', async (route) => {
    await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><rect width="100%" height="100%" fill="#fff"/><text x="80" y="120" font-size="42" fill="#0A2463">${PREFIX} PRESCRIPTION</text><text x="80" y="220" font-size="32" fill="#111">Amoxicillin 500mg - SL 1</text><text x="80" y="300" font-size="28" fill="#444">Doctor QA - MediSpace Clinic</text></svg>` })
  })
  await page.route('**/__mock_storage/broken-prescription-image.png', async (route) => route.fulfill({ status: 404, body: 'missing' }))
}

export async function openPrescriptionPage(page: Page) {
  await mockImageStorage(page)
  await page.goto(`${APP_URL}/pharmacist/prescriptions`)
  await expect(page.getByTestId('prescriptions-page')).toBeVisible({ timeout: 30_000 })
}

export async function openReviewDialog(page: Page, prescription: ObjectId | string | { _id: ObjectId | string; prescriptionNumber?: string }) {
  const prescriptionId = typeof prescription === 'object' && '_id' in prescription ? prescription._id : prescription
  if (typeof prescription === 'object' && 'prescriptionNumber' in prescription && prescription.prescriptionNumber) {
    await page.getByTestId('prescription-search-input').fill(prescription.prescriptionNumber)
  }
  const card = page.getByTestId(`prescription-card-${prescriptionId.toString()}`)
  await expect(card).toBeVisible({ timeout: 30_000 })
  await card.getByTestId('review-prescription-btn').click()
  await expect(page.getByTestId('prescription-detail-dialog')).toBeVisible()
}

export async function selectRadixOption(page: Page, triggerTestId: string, optionText: string) {
  await page.getByTestId(triggerTestId).click()
  await page.getByRole('option', { name: optionText }).click()
}

export async function captureEvidence(page: Page, name: string) {
  await mkdir(EVIDENCE_DIR, { recursive: true })
  await page.screenshot({ path: `${EVIDENCE_DIR}/${name}.png`, fullPage: true })
}

export async function getPrescriptionFromDb(id: ObjectId | string) {
  return withDb((db) => db.collection('prescriptions').findOne({ _id: new ObjectId(id.toString()) }))
}

export async function setPharmacistGate(id: ObjectId, patch: { lisenseNumber?: string; isOnline?: boolean }) {
  const gatePatch = {
    ...patch,
    ...(patch.isOnline === undefined ? {} : { onlineCount: patch.isOnline ? 1 : 0 })
  }
  await withDb((db) => db.collection('users').updateOne({ _id: id }, { $set: gatePatch }))
}

export async function getUserFromDb(id: ObjectId | string) {
  return withDb((db) => db.collection('users').findOne({ _id: new ObjectId(id.toString()) }))
}

export async function apiContext() {
  return playwrightRequest.newContext({ baseURL: API_URL }) as Promise<APIRequestContext>
}
