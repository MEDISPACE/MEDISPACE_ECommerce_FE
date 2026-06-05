/**
 * loyalty-program-config.spec.ts
 *
 * === E2E TESTS: Loyalty Program Config Management ===
 * Scope: Draft/Publish lifecycle, config validation, config-driven earn/redeem
 *
 * Test coverage:
 *   K. ADMIN PROGRAM CONFIG CRUD
 *      K1.  GET /loyalty/admin/program-config → trả published + draft + defaults
 *      K2.  PUT /loyalty/admin/program-config/draft — tạo draft mới thành công
 *      K3.  PUT draft lần 2 → update draft hiện có, không tạo mới
 *      K4.  POST /loyalty/admin/program-config/publish → archive cũ, publish draft
 *      K5.  Sau publish, getActiveProgramConfig trả config mới (via /loyalty/account)
 *      K6.  Non-admin KHÔNG thể truy cập program-config endpoints (403)
 *      K7.  Unauthenticated KHÔNG thể truy cập (401)
 *
 *   L. CONFIG VALIDATION (backend rejects invalid configs)
 *      L1.  Draft với tiers thiếu hạng → rejected (400)
 *      L2.  Draft với multiplier <= 0 → rejected (400)
 *      L3.  Draft với thresholds không tăng dần → rejected (400)
 *      L4.  Draft với maxRedeemRatio > 1 → rejected (400)
 *      L5.  Draft với maxRedeemRatio <= 0 → rejected (400)
 *      L6.  Draft với pointsPerVnd = -1 → rejected (400)
 *      L7.  Publish khi không có draft → rejected (400)
 *
 *   M. CONFIG-DRIVEN EARN/REDEEM (integration)
 *      M1.  Sau publish config mới, preview-redeem dùng config mới
 *      M2.  /loyalty/account trả config.version + tiers từ published config
 *      M3.  Admin adjust points vẫn hoạt động đúng sau config change
 *
 * Requires: backend running, seed done
 */

import { test, expect, type APIRequestContext } from '@playwright/test'
import {
  API_URL,
  type Session,
  auth,
  pickData,
  sessions,
  getLoyaltyAccount,
  previewRedeem,
} from './coupon-loyalty/helpers'

// ─── Loyalty Config API helpers ───────────────────────────────────────────────

async function getAdminProgramConfig(api: APIRequestContext, admin: Session) {
  const res = await api.get(`${API_URL}/loyalty/admin/program-config`, {
    headers: auth(admin.token),
  })
  expect(res.ok(), `getAdminProgramConfig failed: ${res.status()}`).toBeTruthy()
  return pickData(await res.json())
}

async function saveDraft(api: APIRequestContext, admin: Session, data: Record<string, unknown>) {
  const res = await api.put(`${API_URL}/loyalty/admin/program-config/draft`, {
    headers: auth(admin.token),
    data,
  })
  return res
}

async function publishDraft(api: APIRequestContext, admin: Session) {
  const res = await api.post(`${API_URL}/loyalty/admin/program-config/publish`, {
    headers: auth(admin.token),
    data: {},
  })
  return res
}

async function adjustPoints(
  api: APIRequestContext,
  admin: Session,
  userId: string,
  action: 'add' | 'subtract',
  points: number,
  reason: string,
) {
  const res = await api.post(`${API_URL}/loyalty/admin/accounts/${userId}/adjust-points`, {
    headers: auth(admin.token),
    data: { action, points, reason },
  })
  return res
}

const VALID_TIERS = [
  { code: 'member', label: 'Thành viên', minTotalSpent: 0, multiplier: 1 },
  { code: 'silver', label: 'Bạc', minTotalSpent: 2000000, multiplier: 1.2 },
  { code: 'gold', label: 'Vàng', minTotalSpent: 10000000, multiplier: 1.5 },
  { code: 'platinum', label: 'Bạch kim', minTotalSpent: 50000000, multiplier: 2 },
]

// ─── Shared state ─────────────────────────────────────────────────────────────

let admin: Session
let customer: Session
let customer2: Session
let originalPublished: any = null

test.beforeAll(() => {
  const s = sessions()
  admin = s.admin
  customer = s.customer
  customer2 = s.customer2
})

// =============================================================================
// K. ADMIN PROGRAM CONFIG CRUD
// =============================================================================

test.describe.serial('K. Admin Loyalty Program Config CRUD', () => {
  test('K1. GET program-config trả về published + draft + defaults', async ({ request }) => {
    const data = await getAdminProgramConfig(request, admin)

    // published có thể là DB config hoặc fallback default
    expect(data.published).toBeTruthy()
    expect(data.published.pointsPerVnd).toBeGreaterThan(0)
    expect(data.published.maxRedeemRatio).toBeGreaterThan(0)
    expect(data.published.maxRedeemRatio).toBeLessThanOrEqual(1)
    expect(data.published.minRedeem).toBeGreaterThanOrEqual(0)
    expect(data.published.expiryDays).toBeGreaterThan(0)
    expect(Array.isArray(data.published.tiers)).toBe(true)
    expect(data.published.tiers.length).toBe(4) // member/silver/gold/platinum

    // defaults là DEFAULT_LOYALTY_CONFIG từ env
    expect(data.defaults).toBeTruthy()
    expect(data.defaults.pointsPerVnd).toBeGreaterThan(0)

    // draft có thể null
    expect(data.draft === null || typeof data.draft === 'object').toBe(true)

    // Lưu lại để restore cuối test
    originalPublished = data.published
  })

  test('K2. PUT draft → tạo bản nháp mới thành công', async ({ request }) => {
    const draftData = {
      pointsPerVnd: 800,
      pointsToVnd: 1,
      maxRedeemRatio: 0.4,
      minRedeem: 5000,
      expiryDays: 200,
      tiers: [
        { code: 'member', label: 'E2E Thành viên', minTotalSpent: 0, multiplier: 1 },
        { code: 'silver', label: 'E2E Bạc', minTotalSpent: 1500000, multiplier: 1.15 },
        { code: 'gold', label: 'E2E Vàng', minTotalSpent: 8000000, multiplier: 1.4 },
        { code: 'platinum', label: 'E2E Bạch kim', minTotalSpent: 30000000, multiplier: 1.9 },
      ],
    }

    const res = await saveDraft(request, admin, draftData)
    expect(res.ok(), `Save draft failed: ${res.status()} ${await res.text()}`).toBeTruthy()

    const saved = pickData(await res.json())
    expect(saved.status).toBe('draft')
    expect(saved.pointsPerVnd).toBe(800)
    expect(saved.maxRedeemRatio).toBe(0.4)
    expect(saved.minRedeem).toBe(5000)
    expect(saved.expiryDays).toBe(200)
    expect(saved.tiers[0].label).toBe('E2E Thành viên')
  })

  test('K3. PUT draft lần 2 → update draft hiện có, version không đổi', async ({ request }) => {
    // Trước: lấy draft hiện tại
    const before = await getAdminProgramConfig(request, admin)
    expect(before.draft).toBeTruthy()
    const draftVersion = before.draft.version

    // Update draft
    const res = await saveDraft(request, admin, {
      ...before.draft,
      minRedeem: 8000, // đổi minRedeem
    })
    expect(res.ok(), `Update draft failed: ${res.status()}`).toBeTruthy()

    const updated = pickData(await res.json())
    expect(updated.minRedeem).toBe(8000)
    expect(updated.status).toBe('draft')

    // Version vẫn giữ nguyên (không tạo record mới)
    const after = await getAdminProgramConfig(request, admin)
    expect(after.draft.version).toBe(draftVersion)
  })

  test('K4. POST publish → archive published cũ, publish draft mới', async ({ request }) => {
    // Đảm bảo có draft
    const beforePublish = await getAdminProgramConfig(request, admin)
    expect(beforePublish.draft).toBeTruthy()
    const draftVersion = beforePublish.draft.version

    const res = await publishDraft(request, admin)
    expect(res.ok(), `Publish failed: ${res.status()} ${await res.text()}`).toBeTruthy()

    const published = pickData(await res.json())
    expect(published.status).toBe('published')
    expect(published.publishedAt).toBeTruthy()
    expect(published.publishedBy).toBeTruthy()

    // Verify: không còn draft
    const afterPublish = await getAdminProgramConfig(request, admin)
    expect(afterPublish.draft).toBeNull()
    expect(afterPublish.published.version).toBe(draftVersion)
    expect(afterPublish.published.status).toBe('published')
  })

  test('K5. Sau publish, /loyalty/account trả config version mới', async ({ request }) => {
    const account = await getLoyaltyAccount(request, customer)

    // Config phải phản ánh bản mới vừa publish
    expect(account.config).toBeTruthy()
    expect(account.config.pointsPerVnd).toBe(800) // from K2 draft
    expect(account.config.maxRedeemRatio).toBe(0.4)
    expect(account.config.minRedeem).toBe(8000) // from K3 update
    expect(account.config.expiryDays).toBe(200)
    expect(account.config.tiers).toHaveLength(4)
    expect(account.config.tiers[0].label).toBe('E2E Thành viên')
  })

  test('K6. Non-admin KHÔNG thể truy cập program-config endpoints (403)', async ({ request }) => {
    const getRes = await request.get(`${API_URL}/loyalty/admin/program-config`, {
      headers: auth(customer.token),
    })
    expect(getRes.status()).toBe(403)

    const putRes = await request.put(`${API_URL}/loyalty/admin/program-config/draft`, {
      headers: auth(customer.token),
      data: { pointsPerVnd: 999 },
    })
    expect(putRes.status()).toBe(403)

    const postRes = await request.post(`${API_URL}/loyalty/admin/program-config/publish`, {
      headers: auth(customer.token),
      data: {},
    })
    expect(postRes.status()).toBe(403)
  })

  test('K7. Unauthenticated KHÔNG thể truy cập (401)', async ({ request }) => {
    const res = await request.get(`${API_URL}/loyalty/admin/program-config`)
    expect(res.status()).toBe(401)
  })
})

// =============================================================================
// L. CONFIG VALIDATION
// =============================================================================

test.describe.serial('L. Config Validation (BE rejects invalid configs)', () => {
  test('L1. Draft với tiers thiếu hạng → 400', async ({ request }) => {
    const res = await saveDraft(request, admin, {
      tiers: [
        { code: 'member', label: 'Thành viên', minTotalSpent: 0, multiplier: 1 },
        // missing silver, gold, platinum
      ],
    })
    expect(res.ok()).toBe(false)
    expect([400, 422]).toContain(res.status())
    const body = await res.json()
    expect(JSON.stringify(body)).toContain('hạng loyalty')
  })

  test('L2. Draft với multiplier <= 0 → 400', async ({ request }) => {
    const res = await saveDraft(request, admin, {
      tiers: [
        { code: 'member', label: 'Thành viên', minTotalSpent: 0, multiplier: 0 }, // invalid
        { code: 'silver', label: 'Bạc', minTotalSpent: 2000000, multiplier: 1.2 },
        { code: 'gold', label: 'Vàng', minTotalSpent: 10000000, multiplier: 1.5 },
        { code: 'platinum', label: 'Bạch kim', minTotalSpent: 50000000, multiplier: 2 },
      ],
    })
    expect(res.ok()).toBe(false)
    expect([400, 422]).toContain(res.status())
  })

  test('L3. Draft với thresholds không tăng dần → 400', async ({ request }) => {
    const res = await saveDraft(request, admin, {
      tiers: [
        { code: 'member', label: 'Thành viên', minTotalSpent: 0, multiplier: 1 },
        { code: 'silver', label: 'Bạc', minTotalSpent: 10000000, multiplier: 1.2 }, // > gold!
        { code: 'gold', label: 'Vàng', minTotalSpent: 5000000, multiplier: 1.5 },
        { code: 'platinum', label: 'Bạch kim', minTotalSpent: 50000000, multiplier: 2 },
      ],
    })
    expect(res.ok()).toBe(false)
    expect([400, 422]).toContain(res.status())
  })

  test('L4. Draft với maxRedeemRatio > 1 → 400', async ({ request }) => {
    const res = await saveDraft(request, admin, {
      maxRedeemRatio: 1.5,
      tiers: VALID_TIERS,
    })
    expect(res.ok()).toBe(false)
    expect([400, 422]).toContain(res.status())
  })

  test('L5. Draft với maxRedeemRatio = 0 → 400', async ({ request }) => {
    const res = await saveDraft(request, admin, {
      maxRedeemRatio: 0,
      tiers: VALID_TIERS,
    })
    expect(res.ok()).toBe(false)
    expect([400, 422]).toContain(res.status())
  })

  test('L6. Draft với pointsPerVnd = -1 → 400', async ({ request }) => {
    const res = await saveDraft(request, admin, {
      pointsPerVnd: -1,
      tiers: VALID_TIERS,
    })
    expect(res.ok()).toBe(false)
    expect([400, 422]).toContain(res.status())
  })

  test('L7. Publish khi không có draft → 400', async ({ request }) => {
    // K4 đã publish xong → hiện không còn draft
    const config = await getAdminProgramConfig(request, admin)
    if (config.draft) {
      // Nếu bất ngờ còn draft, publish trước rồi test lại
      await publishDraft(request, admin)
    }

    const res = await publishDraft(request, admin)
    expect(res.ok()).toBe(false)
    expect([400, 422]).toContain(res.status())
    const body = await res.json()
    expect(JSON.stringify(body).toLowerCase()).toContain('nháp')
  })
})

// =============================================================================
// M. CONFIG-DRIVEN EARN/REDEEM (integration)
// =============================================================================

test.describe.serial('M. Config-Driven Integration', () => {
  test('M1. Preview redeem dùng config mới (maxRedeemRatio=0.4)', async ({ request }) => {
    // Config hiện tại: maxRedeemRatio = 0.4, minRedeem = 8000 (from K2/K3)
    const account = await getLoyaltyAccount(request, customer)

    const res = await previewRedeem(request, customer, 1000000)
    expect(res.ok()).toBeTruthy()
    const data = pickData(await res.json())

    // maxRedeemRatio phải là 0.4 (không phải default 0.3)
    expect(data.maxRedeemRatio).toBe(0.4)
    expect(data.minRedeem).toBe(8000)

    // maxRedeemAmount = min(balance * pointsToVnd, floor(1000000 * 0.4))
    const maxByRatio = Math.floor(1000000 * 0.4) // 400,000
    const maxByBalance = account.pointsBalance * (account.config?.pointsToVnd || 1)
    const expectedMax = Math.min(maxByRatio, maxByBalance)
    expect(data.maxRedeemAmount).toBe(expectedMax)
  })

  test('M2. /loyalty/account trả config.version + tier labels từ published config', async ({ request }) => {
    const account = await getLoyaltyAccount(request, customer)

    expect(account.config).toBeTruthy()
    expect(typeof account.config.version).toBe('number')
    expect(account.config.version).toBeGreaterThanOrEqual(1)

    // Tier labels phải từ config, không phải hard-code
    expect(account.config.tiers).toHaveLength(4)
    for (const tier of account.config.tiers) {
      expect(tier.code).toMatch(/member|silver|gold|platinum/)
      expect(tier.label).toBeTruthy()
      expect(tier.multiplier).toBeGreaterThan(0)
      expect(typeof tier.minTotalSpent).toBe('number')
    }

    // tierLabel phải khớp config
    const currentTier = account.config.tiers.find((t: any) => t.code === account.tier)
    expect(currentTier).toBeTruthy()
    expect(account.tierLabel).toBe(currentTier.label)
    expect(account.multiplier).toBe(currentTier.multiplier)
  })

  test('M3. Admin adjust points vẫn hoạt động đúng sau config change', async ({ request }) => {
    const accountBefore = await getLoyaltyAccount(request, customer)
    const balanceBefore = accountBefore.pointsBalance

    // Admin cộng 500 điểm
    const addRes = await adjustPoints(
      request,
      admin,
      customer.user._id,
      'add',
      500,
      'E2E test config integration - cộng điểm kiểm tra',
    )
    expect(addRes.ok(), `Adjust add failed: ${addRes.status()} ${await addRes.text()}`).toBeTruthy()

    const accountAfter = await getLoyaltyAccount(request, customer)
    expect(accountAfter.pointsBalance).toBe(balanceBefore + 500)

    // Admin trừ lại 500 điểm (cleanup)
    const subRes = await adjustPoints(
      request,
      admin,
      customer.user._id,
      'subtract',
      500,
      'E2E test config integration - trừ điểm cleanup',
    )
    expect(subRes.ok(), `Adjust subtract failed: ${subRes.status()} ${await subRes.text()}`).toBeTruthy()

    const accountFinal = await getLoyaltyAccount(request, customer)
    expect(accountFinal.pointsBalance).toBe(balanceBefore)
  })
})

// =============================================================================
// CLEANUP: Restore original config
// =============================================================================

test.describe.serial('Z. Cleanup — Restore original config', () => {
  test('Z1. Restore config ban đầu', async ({ request }) => {
    if (!originalPublished || !originalPublished.pointsPerVnd) {
      // Nếu ban đầu dùng default (không có published record), tạo draft giống default và publish
      const res = await saveDraft(request, admin, {
        pointsPerVnd: 1000,
        pointsToVnd: 1,
        maxRedeemRatio: 0.3,
        minRedeem: 10000,
        expiryDays: 365,
        tiers: VALID_TIERS,
      })
      expect(res.ok()).toBeTruthy()
    } else {
      // Restore published gốc
      const res = await saveDraft(request, admin, {
        pointsPerVnd: originalPublished.pointsPerVnd,
        pointsToVnd: originalPublished.pointsToVnd || 1,
        maxRedeemRatio: originalPublished.maxRedeemRatio,
        minRedeem: originalPublished.minRedeem,
        expiryDays: originalPublished.expiryDays,
        tiers: originalPublished.tiers,
      })
      expect(res.ok()).toBeTruthy()
    }

    // Publish restoration draft
    const pubRes = await publishDraft(request, admin)
    expect(pubRes.ok(), `Restore publish failed: ${pubRes.status()}`).toBeTruthy()

    // Verify restored
    const config = await getAdminProgramConfig(request, admin)
    expect(config.published).toBeTruthy()
    if (originalPublished?.pointsPerVnd) {
      expect(config.published.pointsPerVnd).toBe(originalPublished.pointsPerVnd)
    }
  })
})
