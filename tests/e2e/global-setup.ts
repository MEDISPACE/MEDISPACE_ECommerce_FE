import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { request, type FullConfig } from '@playwright/test'

const AUTH_DIR = path.resolve('tests/e2e/.auth')
const DEFAULTS = {
  adminEmail: process.env.E2E_ADMIN_EMAIL || 'e2e.admin@medispace.local',
  adminPassword: process.env.E2E_ADMIN_PASSWORD || 'Admin123!aA',
  customerEmail: process.env.E2E_CUSTOMER_EMAIL || 'e2e.customer@medispace.local',
  customerPassword: process.env.E2E_CUSTOMER_PASSWORD || 'Customer123!aA',
  customer2Email: process.env.E2E_CUSTOMER2_EMAIL || 'e2e.customer2@medispace.local',
  customer2Password: process.env.E2E_CUSTOMER2_PASSWORD || 'Customer123!aA',
}

type Session = {
  token: string
  user: Record<string, unknown>
}

function pickData(payload: any) {
  if (payload?.data !== undefined) return payload.data
  if (payload?.result !== undefined) return payload.result
  return payload
}

async function login(api: Awaited<ReturnType<typeof request.newContext>>, apiURL: string, email: string, password: string) {
  const res = await api.post(`${apiURL}/users/login`, {
    data: { email, password, rememberMe: false },
  })
  if (!res.ok()) {
    throw new Error(`Cannot login ${email}: ${res.status()} ${await res.text()}`)
  }
  const json = await res.json()
  const token = json?.result?.accessToken || json?.data?.accessToken || json?.accessToken
  if (!token) throw new Error(`Missing access token for ${email}`)

  const meRes = await api.get(`${apiURL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!meRes.ok()) {
    throw new Error(`Cannot load profile for ${email}: ${meRes.status()} ${await meRes.text()}`)
  }
  const meJson = await meRes.json()
  const user = meJson?.user || meJson?.result?.user || meJson?.data?.user
  if (!user) throw new Error(`Missing user profile for ${email}`)
  return { token, user } as Session
}

async function ensureCustomer(
  api: Awaited<ReturnType<typeof request.newContext>>,
  apiURL: string,
  adminToken: string,
  email: string,
  password: string,
  suffix: string,
) {
  try {
    return await login(api, apiURL, email, password)
  } catch {
    const createRes = await api.post(`${apiURL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        email,
        password,
        firstName: 'E2E',
        lastName: suffix,
        phoneNumber: suffix === 'Customer' ? '0900000001' : '0900000002',
        role: 0,
        gender: 1,
      },
    })
    if (!createRes.ok() && createRes.status() !== 409) {
      throw new Error(`Cannot create ${email}: ${createRes.status()} ${await createRes.text()}`)
    }
    return login(api, apiURL, email, password)
  }
}

async function writeStorageState(fileName: string, baseURL: string, session: Session) {
  const origin = new URL(baseURL).origin
  await writeFile(
    path.join(AUTH_DIR, fileName),
    JSON.stringify(
      {
        cookies: [],
        origins: [
          {
            origin,
            localStorage: [
              { name: 'medispace_access_token', value: session.token },
              { name: 'medispace_user_data', value: JSON.stringify(session.user) },
            ],
          },
        ],
      },
      null,
      2,
    ),
  )
}

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL || process.env.E2E_BASE_URL || 'http://localhost:3000'
  const apiURL = process.env.E2E_API_URL || 'http://localhost:8000'
  const api = await request.newContext()
  await mkdir(AUTH_DIR, { recursive: true })

  try {
    const admin = await login(api, apiURL, DEFAULTS.adminEmail, DEFAULTS.adminPassword).catch((error) => {
      throw new Error(
        `${error.message}\nRun backend seed first: cd ../MEDISPACE_ECommerce_BE && npm run seed:e2e`,
      )
    })
    const customer = await ensureCustomer(
      api,
      apiURL,
      admin.token,
      DEFAULTS.customerEmail,
      DEFAULTS.customerPassword,
      'Customer',
    )
    const customer2 = await ensureCustomer(
      api,
      apiURL,
      admin.token,
      DEFAULTS.customer2Email,
      DEFAULTS.customer2Password,
      'Customer Two',
    )

    await writeStorageState('admin.json', baseURL, admin)
    await writeStorageState('customer.json', baseURL, customer)
    await writeStorageState('customer2.json', baseURL, customer2)
    await writeFile(path.join(AUTH_DIR, 'sessions.json'), JSON.stringify({ admin, customer, customer2 }, null, 2))
  } finally {
    await api.dispose()
  }
}
