import { beforeEach, describe, expect, test } from 'vitest'
import { addresses } from '../fixtures/addresses'
import { createAccountApi, createAccountTestDb } from '../helpers/db'
import { users } from '../fixtures/users'

describe('addresses account API integration contract', () => {
  let api: ReturnType<typeof createAccountApi>

  beforeEach(() => {
    api = createAccountApi(createAccountTestDb())
  })

  test("GET /account/addresses returns user's addresses only", () => {
    const res = api.listAddresses(users.standard.token)
    expect(res.status).toBe(200)
    expect((res.body as any[]).every((item) => item.userId === users.standard.id)).toBe(true)
  })

  test('POST /account/addresses creates new address', () => {
    const res = api.createAddress(users.standard.token, { name: 'Tran Bao', phone: '0901234567', province: 'HCM', district: 'Q1', ward: 'BN', address: '1 Le Loi' })
    expect(res.status).toBe(201)
  })

  test('POST /account/addresses with invalid phone returns 400', () => {
    expect(api.createAddress(users.standard.token, { phone: '123' }).status).toBe(400)
  })

  test('POST /account/addresses when at limit returns 400', () => {
    api = createAccountApi(createAccountTestDb({ addresses: addresses.max }))
    expect(api.createAddress(users.standard.token, { phone: '0901234567' }).status).toBe(400)
  })

  test('PUT /account/addresses/:id updates correctly', () => {
    expect(api.updateAddress(users.standard.token, 'addr-2', { address: 'Updated' })).toMatchObject({ status: 200, body: { address: 'Updated' } })
  })

  test('DELETE /account/addresses/:id deletes correctly', () => {
    expect(api.deleteAddress(users.standard.token, 'addr-2').status).toBe(200)
  })

  test('DELETE /account/addresses/:id when default + only returns 400', () => {
    api = createAccountApi(createAccountTestDb({ addresses: [{ ...addresses.multiple[0] }] }))
    expect(api.deleteAddress(users.standard.token, 'addr-1').status).toBe(400)
  })

  test('PATCH /account/addresses/:id/default sets as default', () => {
    expect(api.setDefaultAddress(users.standard.token, 'addr-2')).toMatchObject({ status: 200, body: { isDefault: true } })
  })

  test("All endpoints: other user's address returns 404", () => {
    expect(api.updateAddress(users.other.token, 'addr-1', { address: 'Hack' }).status).toBe(404)
    expect(api.deleteAddress(users.other.token, 'addr-1').status).toBe(404)
    expect(api.setDefaultAddress(users.other.token, 'addr-1').status).toBe(404)
  })
})
