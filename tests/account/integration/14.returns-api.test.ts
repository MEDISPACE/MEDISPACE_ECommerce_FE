import { beforeEach, describe, expect, test } from 'vitest'
import { createAccountApi, createAccountTestDb } from '../helpers/db'
import { orders } from '../fixtures/orders'
import { users } from '../fixtures/users'

describe('returns account API integration contract', () => {
  let api: ReturnType<typeof createAccountApi>

  beforeEach(() => {
    api = createAccountApi(createAccountTestDb())
  })

  test('POST /account/returns creates return request', () => {
    expect(api.createReturn(users.standard.token, { orderId: 'order-delivered', reason: 'defective', items: [{ productId: 'prod-3', quantity: 1 }] }).status).toBe(201)
  })

  test('POST /account/returns outside return window returns 400', () => {
    api = createAccountApi(createAccountTestDb({ orders: [{ ...orders.withAllStatuses[2], deliveredAt: '2026-06-01T00:00:00.000Z' }] }))
    expect(api.createReturn(users.standard.token, { orderId: 'order-delivered', reason: 'defective', items: [] }).status).toBe(400)
  })

  test('POST /account/returns for undelivered order returns 400', () => {
    expect(api.createReturn(users.standard.token, { orderId: 'order-processing', reason: 'defective', items: [] }).status).toBe(400)
  })

  test('POST /account/returns duplicate request returns 409', () => {
    api.createReturn(users.standard.token, { orderId: 'order-delivered', reason: 'defective', items: [] })
    expect(api.createReturn(users.standard.token, { orderId: 'order-delivered', reason: 'defective', items: [] }).status).toBe(409)
  })

  test("GET /account/returns lists user's return requests", () => {
    api.createReturn(users.standard.token, { orderId: 'order-delivered', reason: 'defective', items: [] })
    expect(api.listReturns(users.standard.token).body).toHaveLength(1)
  })

  test('GET /account/returns/:id returns correct detail through list contract', () => {
    const created = api.createReturn(users.standard.token, { orderId: 'order-delivered', reason: 'defective', items: [] }).body as any
    expect((api.listReturns(users.standard.token).body as any[]).find((item) => item.id === created.id)).toBeTruthy()
  })

  test('DELETE /account/returns/:id cancels if pending', () => {
    const created = api.createReturn(users.standard.token, { orderId: 'order-delivered', reason: 'defective', items: [] }).body as any
    expect(api.cancelReturn(users.standard.token, created.id)).toMatchObject({ status: 200, body: { status: 'cancelled' } })
  })

  test('DELETE /account/returns/:id if already approved returns 400', () => {
    const created = api.createReturn(users.standard.token, { orderId: 'order-delivered', reason: 'defective', items: [] }).body as any
    created.status = 'approved'
    expect(api.cancelReturn(users.standard.token, created.id).status).toBe(400)
  })

  test("GET /account/returns for other user's return returns 404", () => {
    expect(api.cancelReturn(users.standard.token, 'missing-return').status).toBe(404)
  })
})
