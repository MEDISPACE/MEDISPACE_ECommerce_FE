import type { Page, APIRequestContext } from '@playwright/test'
import { pharmacistUsers } from '../fixtures/pharmacists'

export async function loginAsPharmacist(page: Page) {
  await page.addInitScript((token) => {
    window.localStorage.setItem('medispace_access_token', token)
    window.localStorage.setItem('medispace_session_hint', '1')
    window.localStorage.setItem('medispace_user_data', JSON.stringify({ role: 1, email: 'pharmacist.a@medispace.test' }))
  }, pharmacistUsers.pharmacistA.accessToken)
}

export async function loginAsCustomer(page: Page) {
  await page.addInitScript((token) => {
    window.localStorage.setItem('medispace_access_token', token)
    window.localStorage.setItem('medispace_session_hint', '1')
    window.localStorage.setItem('medispace_user_data', JSON.stringify({ role: 0, email: 'customer@medispace.test' }))
  }, pharmacistUsers.customer.accessToken)
}

export function authHeaders(role: keyof typeof pharmacistUsers = 'pharmacistA') {
  return { Authorization: `Bearer ${pharmacistUsers[role].accessToken}` }
}

export async function apiLoginAsPharmacist(request: APIRequestContext) {
  const response = await request.post('/users/login', {
    data: { email: pharmacistUsers.pharmacistA.email, password: pharmacistUsers.pharmacistA.password },
  })
  if (!response.ok()) return pharmacistUsers.pharmacistA.accessToken
  const body = await response.json()
  return body?.result?.accessToken || pharmacistUsers.pharmacistA.accessToken
}
