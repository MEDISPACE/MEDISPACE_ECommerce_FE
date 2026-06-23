import { beforeEach, describe, expect, test } from 'vitest'
import { createAccountApi, createAccountTestDb } from '../helpers/db'
import { orders } from '../fixtures/orders'
import { users } from '../fixtures/users'

describe('orders account API integration contract', () => {
  let api: ReturnType<typeof createAccountApi>

  beforeEach(() => {
    api = createAccountApi(createAccountTestDb())
  })

  test("GET /account/orders returns only current user's orders", () => {
    const res = api.listOrders(users.standard.token)
    expect(res.status).toBe(200)
    expect((res.body as any).orders.every((order: any) => order.userId === users.standard.id)).toBe(true)
  })

  test('GET /account/orders?status=pending filters correctly', () => {
    const res = api.listOrders(users.standard.token, { status: 'pending' })
    expect((res.body as any).orders).toHaveLength(1)
  })

  test('GET /account/orders?page=2 pagination works', () => {
    const res = api.listOrders(users.standard.token, { page: 2, limit: 2 })
    expect((res.body as any).orders).toHaveLength(2)
  })

  test('GET /account/orders/:id returns correct order detail', () => {
    expect(api.getOrder(users.standard.token, orders.withAllStatuses[0].id).status).toBe(200)
  })

  test("GET /account/orders/:id for other user's order returns 404", () => {
    expect(api.getOrder(users.standard.token, orders.otherUser.id).status).toBe(404)
  })

  test('POST /account/orders/:id/cancel cancels if eligible', () => {
    expect(api.cancelOrder(users.standard.token, 'order-pending')).toMatchObject({ status: 200, body: { status: 'cancelled' } })
  })

  test('POST /account/orders/:id/cancel when shipped returns 400', () => {
    expect(api.cancelOrder(users.standard.token, 'order-shipped').status).toBe(400)
  })

  test('POST /account/orders/:id/reorder adds items to cart', () => {
    expect((api.reorder(users.standard.token, 'order-delivered').body as any).cartItems).toHaveLength(1)
  })

  test('GET /account/orders without auth returns 401', () => {
    expect(api.listOrders().status).toBe(401)
  })
})
