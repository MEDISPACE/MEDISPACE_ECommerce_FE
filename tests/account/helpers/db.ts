import { addresses } from '../fixtures/addresses'
import { loyalty } from '../fixtures/loyalty'
import { orders } from '../fixtures/orders'
import { products } from '../fixtures/products'
import { users } from '../fixtures/users'

type SeedInput = Partial<{
  users: unknown[]
  orders: any[]
  addresses: any[]
  loyalty: any
  wishlist: any[]
  returns: any[]
}>

export function createAccountTestDb(seed: SeedInput = {}) {
  const state = {
    users: seed.users ?? [users.standard, users.other],
    orders: seed.orders ?? [...orders.withAllStatuses, orders.otherUser],
    addresses: seed.addresses ?? [...addresses.multiple],
    loyalty: seed.loyalty ?? structuredClone(loyalty.withHistory),
    wishlist: seed.wishlist ?? [...products.active],
    returns: seed.returns ?? [],
    avatars: [] as string[],
  }

  return {
    state,
    async seed(nextSeed: SeedInput) {
      Object.assign(state, nextSeed)
    },
    async clean() {
      state.orders = []
      state.addresses = []
      state.returns = []
      state.wishlist = []
      state.avatars = []
    },
  }
}

export function createAccountApi(db = createAccountTestDb()) {
  const requireAuth = (token?: string) => {
    if (!token) return { status: 401, body: { message: 'Unauthorized' } }
    const user = (db.state.users as any[]).find((item) => item.token === token)
    if (!user) return { status: 401, body: { message: 'Unauthorized' } }
    return { user }
  }

  const currentUserId = (token?: string): any => {
    const auth: any = requireAuth(token)
    return 'status' in auth ? auth : { userId: auth.user.id, user: auth.user }
  }

  return {
    db,
    getProfile(token?: string) {
      const auth = requireAuth(token)
      if ('status' in auth) return auth
      return { status: 200, body: auth.user }
    },
    updateProfile(token: string | undefined, payload: any) {
      const auth = requireAuth(token)
      if ('status' in auth) return auth
      if (payload.userId && payload.userId !== auth.user.id) return { status: 403, body: { message: 'Forbidden' } }
      if (payload.phone && !/^(0|\+84)\d{9,10}$/.test(payload.phone)) return { status: 400, body: { message: 'Invalid phone' } }
      if (payload.email && (db.state.users as any[]).some((user) => user.email === payload.email && user.id !== auth.user.id)) {
        return { status: 409, body: { message: 'Duplicate email' } }
      }
      Object.assign(auth.user, payload)
      return { status: 200, body: auth.user }
    },
    uploadAvatar(token: string | undefined, file: { type: string; size: number }) {
      const auth = requireAuth(token)
      if ('status' in auth) return auth
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return { status: 400, body: { message: 'Invalid type' } }
      if (file.size > 5 * 1024 * 1024) return { status: 400, body: { message: 'Too large' } }
      const url = `https://cdn.test/${auth.user.id}/avatar.webp`
      auth.user.avatar = url
      db.state.avatars.push(url)
      return { status: 200, body: { avatar: url } }
    },
    listOrders(token?: string, query: { status?: string; page?: number; limit?: number } = {}) {
      const current = currentUserId(token)
      if ('status' in current) return current
      const limit = query.limit ?? 10
      const page = query.page ?? 1
      let data = db.state.orders.filter((order: any) => order.userId === current.userId)
      if (query.status) data = data.filter((order: any) => order.status === query.status)
      return { status: 200, body: { orders: data.slice((page - 1) * limit, page * limit), total: data.length, page, limit } }
    },
    getOrder(token: string | undefined, orderId: string) {
      const current = currentUserId(token)
      if ('status' in current) return current
      const order = db.state.orders.find((item: any) => item.id === orderId && item.userId === current.userId)
      return order ? { status: 200, body: order } : { status: 404, body: { message: 'Not found' } }
    },
    cancelOrder(token: string | undefined, orderId: string) {
      const found = this.getOrder(token, orderId)
      if (found.status !== 200) return found
      if (!['pending', 'pending_payment', 'confirmed'].includes((found.body as any).status)) return { status: 400, body: { message: 'Cannot cancel' } }
      ;(found.body as any).status = 'cancelled'
      return { status: 200, body: found.body }
    },
    reorder(token: string | undefined, orderId: string) {
      const found = this.getOrder(token, orderId)
      if (found.status !== 200) return found
      return { status: 200, body: { cartItems: (found.body as any).items } }
    },
    createReturn(token: string | undefined, payload: any) {
      const found = this.getOrder(token, payload.orderId)
      if (found.status !== 200) return found
      const order = found.body as any
      if (order.status !== 'delivered') return { status: 400, body: { message: 'Order not delivered' } }
      const days = Math.floor((new Date('2026-06-23').getTime() - new Date(order.deliveredAt).getTime()) / 86400000)
      if (days > 7) return { status: 400, body: { message: 'Outside return window' } }
      if (db.state.returns.some((item: any) => item.orderId === order.id)) return { status: 409, body: { message: 'Duplicate return' } }
      const request = { id: `return-${db.state.returns.length + 1}`, userId: order.userId, status: 'pending', ...payload }
      db.state.returns.push(request)
      return { status: 201, body: request }
    },
    listReturns(token?: string) {
      const current = currentUserId(token)
      if ('status' in current) return current
      return { status: 200, body: db.state.returns.filter((item: any) => item.userId === current.userId) }
    },
    cancelReturn(token: string | undefined, id: string) {
      const current = currentUserId(token)
      if ('status' in current) return current
      const request = db.state.returns.find((item: any) => item.id === id && item.userId === current.userId)
      if (!request) return { status: 404, body: { message: 'Not found' } }
      if (request.status !== 'pending') return { status: 400, body: { message: 'Cannot cancel' } }
      request.status = 'cancelled'
      return { status: 200, body: request }
    },
    listAddresses(token?: string) {
      const current = currentUserId(token)
      if ('status' in current) return current
      return { status: 200, body: db.state.addresses.filter((item: any) => item.userId === current.userId) }
    },
    createAddress(token: string | undefined, payload: any) {
      const current = currentUserId(token)
      if ('status' in current) return current
      if (!/^(0|\+84)\d{9,10}$/.test(payload.phone)) return { status: 400, body: { message: 'Invalid phone' } }
      if (db.state.addresses.filter((item: any) => item.userId === current.userId).length >= 5) return { status: 400, body: { message: 'Limit reached' } }
      const address = { id: `addr-${Date.now()}`, userId: current.userId, ...payload }
      db.state.addresses.push(address)
      return { status: 201, body: address }
    },
    updateAddress(token: string | undefined, id: string, payload: any) {
      const current = currentUserId(token)
      if ('status' in current) return current
      const address = db.state.addresses.find((item: any) => item.id === id && item.userId === current.userId)
      if (!address) return { status: 404, body: { message: 'Not found' } }
      Object.assign(address, payload)
      return { status: 200, body: address }
    },
    deleteAddress(token: string | undefined, id: string) {
      const current = currentUserId(token)
      if ('status' in current) return current
      const owned = db.state.addresses.filter((item: any) => item.userId === current.userId)
      const address = owned.find((item: any) => item.id === id)
      if (!address) return { status: 404, body: { message: 'Not found' } }
      if (owned.length === 1 && address.isDefault) return { status: 400, body: { message: 'Cannot delete only default' } }
      db.state.addresses = db.state.addresses.filter((item: any) => item.id !== id)
      return { status: 200, body: { ok: true } }
    },
    setDefaultAddress(token: string | undefined, id: string) {
      const current = currentUserId(token)
      if ('status' in current) return current
      const owned = db.state.addresses.filter((item: any) => item.userId === current.userId)
      if (!owned.some((item: any) => item.id === id)) return { status: 404, body: { message: 'Not found' } }
      owned.forEach((item: any) => { item.isDefault = item.id === id })
      return { status: 200, body: owned.find((item: any) => item.id === id) }
    },
    getLoyaltyBalance(token?: string) {
      const current = currentUserId(token)
      if ('status' in current) return current
      return { status: 200, body: { balance: db.state.loyalty.balance } }
    },
    getLoyaltyHistory(token: string | undefined, type = 'all') {
      const current = currentUserId(token)
      if ('status' in current) return current
      const tx = db.state.loyalty.transactions.filter((item: any) => type === 'all' || item.type === type)
      return { status: 200, body: tx }
    },
  }
}
