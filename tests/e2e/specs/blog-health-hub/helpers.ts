/**
 * helpers.ts — Shared utilities for blog-health-hub E2E tests
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { type APIRequestContext, type Page, expect } from '@playwright/test'

export const APP_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'
export const API_URL = process.env.E2E_API_URL || 'http://localhost:8000'
export const AUTH_DIR = path.resolve('tests/e2e/.auth')
export const SS_DIR = path.resolve('tests/e2e/screenshots/blog-health-hub')

// ── Session helpers ─────────────────────────────────────────────────────────

export type Session = { token: string; user: { _id: string; email: string } }
export type Sessions = { admin: Session; customer: Session; customer2: Session }

export function sessions(): Sessions {
  return JSON.parse(readFileSync(path.join(AUTH_DIR, 'sessions.json'), 'utf8')) as Sessions
}

export function auth(token: string) {
  return { Authorization: `Bearer ${token}` }
}

function pickData(payload: unknown): unknown {
  const p = payload as Record<string, unknown>
  if (p?.data !== undefined) return p.data
  if (p?.result !== undefined) return p.result
  return payload
}

// ── Screenshot helper ────────────────────────────────────────────────────────

export async function snap(page: Page, name: string) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  await page.screenshot({
    path: path.join(SS_DIR, `${name}__${ts}.png`),
    fullPage: true,
  })
}

// ── API helpers ──────────────────────────────────────────────────────────────

export async function createCategory(api: APIRequestContext, adminToken: string) {
  const ts = Date.now()
  const slug = `e2e-cat-${ts}`
  const name = `E2E Category ${ts}`  // unique name + slug → tránh 409
  const res = await api.post(`${API_URL}/health-categories`, {
    headers: auth(adminToken),
    data: { name, slug, description: 'Auto-created by E2E test', color: '#0066CC' },
  })
  if (!res.ok()) {
    const body = await res.text()
    throw new Error(`createCategory failed ${res.status()}: ${body}`)
  }
  const json = await res.json()
  const data = json?.result || json?.data || json
  return data as { _id: string; slug: string; name: string }
}

export async function createArticle(
  api: APIRequestContext,
  adminToken: string,
  categoryId: string,
  overrides: Record<string, unknown> = {},
) {
  const slug = `e2e-article-${Date.now()}`
  const payload = {
    title: 'E2E Article: Cách chăm sóc sức khỏe mùa lạnh',
    slug,
    excerpt:
      'Mùa lạnh mang đến nhiều nguy cơ cho sức khỏe. Bài viết này hướng dẫn các biện pháp phòng ngừa hiệu quả.',
    content:
      '<p>Mùa lạnh là thời điểm dễ mắc các bệnh đường hô hấp như cảm cúm, viêm họng, viêm phổi.</p>' +
      '<p>Để phòng ngừa, bạn nên giữ ấm cơ thể, uống đủ nước, bổ sung vitamin C và tiêm vaccine cúm định kỳ.</p>' +
      '<p>Nếu có triệu chứng nặng như sốt cao, khó thở, hãy đến cơ sở y tế ngay.</p>',
    categoryId,
    status: 'published',
    tags: ['sức khỏe', 'mùa lạnh', 'phòng ngừa'],
    healthTopics: ['cảm cúm', 'hô hấp'],
    symptoms: ['ho', 'sốt', 'đau họng'],
    riskLevel: 'general',
    ...overrides,
  }
  const res = await api.post(`${API_URL}/articles`, {
    headers: auth(adminToken),
    data: payload,
  })
  if (!res.ok()) {
    const body = await res.text()
    throw new Error(`createArticle failed ${res.status()}: ${body}`)
  }
  const json = await res.json()
  const data = json?.result || json?.data || json
  return data as { _id: string; slug: string; title: string }
}

export async function deleteArticle(api: APIRequestContext, adminToken: string, id: string) {
  // Try admin route first, fallback to regular route
  const res = await api.delete(`${API_URL}/admin/articles/${id}`, { headers: auth(adminToken) })
  if (!res.ok()) {
    await api.delete(`${API_URL}/articles/${id}`, { headers: auth(adminToken) })
  }
}

export async function deleteCategory(api: APIRequestContext, adminToken: string, id: string) {
  await api.delete(`${API_URL}/health-categories/${id}`, { headers: auth(adminToken) })
}

// ── Page navigation helpers ──────────────────────────────────────────────────

export async function gotoAsAdmin(page: Page, path: string) {
  await page.goto(`${APP_URL}${path}`)
  await page.waitForLoadState('networkidle')
}

export async function waitForToast(page: Page, text: string) {
  await expect(page.getByText(text)).toBeVisible({ timeout: 10_000 })
}
