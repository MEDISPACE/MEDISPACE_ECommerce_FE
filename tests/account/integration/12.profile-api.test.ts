import { beforeEach, describe, expect, test } from 'vitest'
import { createAccountApi, createAccountTestDb } from '../helpers/db'
import { users } from '../fixtures/users'

describe('profile account API integration contract', () => {
  let api: ReturnType<typeof createAccountApi>

  beforeEach(() => {
    api = createAccountApi(createAccountTestDb())
  })

  test('GET /account/profile returns correct user data', () => {
    expect(api.getProfile(users.standard.token)).toMatchObject({ status: 200, body: { id: users.standard.id } })
  })

  test('PUT /account/profile updates name, phone, DOB, gender', () => {
    const res = api.updateProfile(users.standard.token, { firstName: 'New', lastName: 'Name', phone: '0909999999', dob: '1990-01-01', gender: 'female' })
    expect(res.status).toBe(200)
    expect((res.body as any).firstName).toBe('New')
  })

  test('PUT /account/profile with invalid phone returns 400 validation error', () => {
    expect(api.updateProfile(users.standard.token, { phone: '123' }).status).toBe(400)
  })

  test('PUT /account/profile with duplicate email returns 409 conflict', () => {
    expect(api.updateProfile(users.standard.token, { email: users.other.email }).status).toBe(409)
  })

  test('POST /account/profile/avatar uploads and saves URL', () => {
    const res = api.uploadAvatar(users.standard.token, { type: 'image/png', size: 1000 })
    expect(res.status).toBe(200)
    expect((res.body as any).avatar).toContain('https://cdn.test')
  })

  test('POST /account/profile/avatar with invalid type returns 400', () => {
    expect(api.uploadAvatar(users.standard.token, { type: 'text/plain', size: 1000 }).status).toBe(400)
  })

  test('POST /account/profile/avatar with oversized file returns 400', () => {
    expect(api.uploadAvatar(users.standard.token, { type: 'image/png', size: 6 * 1024 * 1024 }).status).toBe(400)
  })

  test('GET /account/profile without auth returns 401', () => {
    expect(api.getProfile().status).toBe(401)
  })

  test("User A cannot update User B's profile", () => {
    expect(api.updateProfile(users.standard.token, { userId: users.other.id, firstName: 'Hack' }).status).toBe(403)
  })
})
