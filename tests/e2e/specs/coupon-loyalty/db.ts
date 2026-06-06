/**
 * db.ts — Direct MongoDB client for E2E DB assertions
 *
 * Opens a single connection per test-suite run.
 * Use dbClient.collection() to query real DB state
 * and confirm side-effects beyond what the API exposes.
 *
 * Connection is established lazily on first call to getDb().
 */
import { MongoClient, ObjectId } from 'mongodb'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

let _client: MongoClient | null = null
let _connected = false

const AUTH_DIR = path.resolve('tests/e2e/.auth')

export function getSeedManifest() {
  const p = path.join(AUTH_DIR, 'coupon-loyalty-seed.json')
  if (!existsSync(p)) {
    throw new Error(
      `Seed manifest not found at ${p}.\nRun: cd ../MEDISPACE_ECommerce_BE && npm run seed:e2e:coupon-loyalty`,
    )
  }
  return JSON.parse(readFileSync(p, 'utf8')) as {
    customerUserId: string
    customer2UserId: string
    products: Record<string, string>
    coupons: string[]
    loyaltyPoints: { customer: number; customer2: number }
    config: {
      POINTS_PER_VND: number
      POINTS_MAX_REDEEM_RATIO: number
      POINTS_EXPIRY_DAYS: number
      POINTS_MIN_REDEEM: number
      E2E_PRODUCT_PRICE_1: number
      E2E_PRODUCT_PRICE_2: number
    }
  }
}

export async function getDb() {
  if (!_connected || !_client) {
    const username = encodeURIComponent(process.env.E2E_DB_USERNAME || process.env.DB_USERNAME || '')
    const password = encodeURIComponent(process.env.E2E_DB_PASSWORD || process.env.DB_PASSWORD || '')
    const dbName = process.env.E2E_DB_NAME || process.env.DB_NAME || 'medispacedb'

    if (!username || !password) {
      throw new Error(
        'Missing E2E_DB_USERNAME / E2E_DB_PASSWORD env vars.\n' +
          'Set them in .env or export before running tests.\n' +
          'These match DB_USERNAME / DB_PASSWORD on the backend.',
      )
    }

    const uri = `mongodb+srv://${username}:${password}@medispacedb.35qkwso.mongodb.net/?retryWrites=true&w=majority&appName=MediSpaceDB`
    _client = new MongoClient(uri)
    await _client.connect()
    _connected = true
  }
  const dbName = process.env.E2E_DB_NAME || process.env.DB_NAME || 'medispacedb'
  return _client!.db(dbName)
}

export async function closeDb() {
  if (_client && _connected) {
    await _client.close()
    _connected = false
    _client = null
  }
}

// ── Collection accessors (mirror BE env names) ────────────────────────────────

export async function collections() {
  const db = await getDb()
  return {
    orders: db.collection(process.env.DB_ORDERS_COLLECTION || 'orders'),
    coupons: db.collection(process.env.DB_COUPONS_COLLECTION || 'coupons'),
    couponRedemptions: db.collection(process.env.DB_COUPON_REDEMPTIONS_COLLECTION || 'couponRedemptions'),
    loyaltyAccounts: db.collection(process.env.DB_LOYALTY_ACCOUNTS_COLLECTION || 'loyaltyAccounts'),
    loyaltyTransactions: db.collection(process.env.DB_LOYALTY_TRANSACTIONS_COLLECTION || 'loyaltyTransactions'),
    products: db.collection(process.env.DB_PRODUCTS_COLLECTION || 'products'),
    carts: db.collection(process.env.DB_CARTS_COLLECTION || 'carts'),
    users: db.collection('users'),
  }
}

// ── DB Assertion helpers ──────────────────────────────────────────────────────

export async function dbGetOrder(orderId: string) {
  const { orders } = await collections()
  return orders.findOne({ _id: new ObjectId(orderId) })
}

export async function dbGetCoupon(code: string) {
  const { coupons } = await collections()
  return coupons.findOne({ code })
}

export async function dbGetCouponRedemptions(orderId: string) {
  const { couponRedemptions } = await collections()
  return couponRedemptions.find({ orderId: new ObjectId(orderId) }).toArray()
}

export async function dbGetLoyaltyAccount(userId: string) {
  const { loyaltyAccounts } = await collections()
  return loyaltyAccounts.findOne({ userId: new ObjectId(userId) })
}

export async function dbGetLoyaltyTransactionsForOrder(orderId: string, userId: string) {
  const { loyaltyTransactions } = await collections()
  return loyaltyTransactions
    .find({ orderId: new ObjectId(orderId), userId: new ObjectId(userId) })
    .toArray()
}

export async function dbGetProduct(sku: string) {
  const { products } = await collections()
  return products.findOne({ sku })
}

export async function dbGetProductById(productId: string) {
  const { products } = await collections()
  return products.findOne({ _id: new ObjectId(productId) })
}

/**
 * Directly set an order's createdAt to simulate abandonment.
 * Used for testing abandoned-order cleanup.
 */
export async function dbSetOrderCreatedAt(orderId: string, date: Date) {
  const { orders } = await collections()
  await orders.updateOne({ _id: new ObjectId(orderId) }, { $set: { createdAt: date, updatedAt: date } })
}

/**
 * Directly call cleanupAbandonedOrders logic without cron:
 * finds online-payment orders with pending status older than cutoff and cancels them via updateOrderStatus.
 * Returns list of orderId strings that were cancelled.
 * NOTE: This bypasses OrderService — it directly marks cancelled + logs reason.
 *       In integration tests, call the admin trigger endpoint if available.
 */
export async function dbTriggerAbandonedOrderCleanup(cutoffDate: Date) {
  const { orders } = await collections()
  const toCancel = await orders
    .find({
      paymentStatus: 'pending',
      paymentMethod: { $in: ['vnpay', 'payos', 'bank_transfer'] },
      orderStatus: { $nin: ['cancelled', 'delivered'] },
      createdAt: { $lt: cutoffDate },
    })
    .toArray()
  return toCancel.map((o) => o._id!.toString())
}
