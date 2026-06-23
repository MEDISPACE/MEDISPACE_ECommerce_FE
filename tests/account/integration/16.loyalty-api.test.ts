import { beforeEach, describe, expect, test } from 'vitest'
import { createAccountApi, createAccountTestDb } from '../helpers/db'
import { users } from '../fixtures/users'

describe('loyalty account API integration contract', () => {
  let api: ReturnType<typeof createAccountApi>

  beforeEach(() => {
    api = createAccountApi(createAccountTestDb())
  })

  test('GET /account/loyalty/balance returns correct balance', () => {
    expect(api.getLoyaltyBalance(users.standard.token)).toMatchObject({ status: 200, body: { balance: 1250 } })
  })

  test("GET /account/loyalty/history returns user's history only", () => {
    expect(api.getLoyaltyHistory(users.standard.token).body).toHaveLength(3)
  })

  test('GET /account/loyalty/history?type=earned filters correctly', () => {
    expect(api.getLoyaltyHistory(users.standard.token, 'earned').body).toHaveLength(1)
  })

  test('Points added correctly after order completion', () => {
    api.db.state.loyalty.balance += 100
    expect(api.getLoyaltyBalance(users.standard.token).body).toEqual({ balance: 1350 })
  })

  test('Points reversed after order cancellation', () => {
    api.db.state.loyalty.balance -= 100
    expect(api.getLoyaltyBalance(users.standard.token).body).toEqual({ balance: 1150 })
  })

  test('Points reversed after refund', () => {
    api.db.state.loyalty.balance -= 50
    expect(api.getLoyaltyBalance(users.standard.token).body).toEqual({ balance: 1200 })
  })

  test('GET /account/loyalty without auth returns 401', () => {
    expect(api.getLoyaltyBalance().status).toBe(401)
  })
})
