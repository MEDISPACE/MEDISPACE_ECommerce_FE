import { readFileSync } from 'node:fs'
import path from 'node:path'

export type TestRole = 'admin' | 'host' | 'registeredUser' | 'guest'

export type TestUser = {
  token: string
  user: {
    _id: string
    email: string
    firstName?: string
    lastName?: string
    role?: number
  }
}

export type TestUsers = {
  admin: TestUser
  host: TestUser
  registeredUser: TestUser
  guest: TestUser
}

const AUTH_DIR = path.resolve('tests/e2e/.auth')

export const storageState = {
  admin: path.join(AUTH_DIR, 'admin.json'),
  host: path.join(AUTH_DIR, 'customer2.json'),
  registeredUser: path.join(AUTH_DIR, 'customer.json'),
  guest: undefined,
} as const

export function users(): TestUsers {
  const sessions = JSON.parse(readFileSync(path.join(AUTH_DIR, 'sessions.json'), 'utf8'))
  return {
    admin: sessions.admin,
    host: sessions.customer2,
    registeredUser: sessions.customer,
    guest: { token: '', user: { _id: 'guest', email: 'guest@anonymous.local' } },
  }
}

export function authHeader(user?: TestUser): Record<string, string> {
  return user?.token ? { Authorization: `Bearer ${user.token}` } : {}
}
