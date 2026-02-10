/**
 * API client for backend communication.
 *
 * Public endpoints (stats) -> call backend directly.
 * Authenticated endpoints (scanner, users) -> proxy via /api/backend/
 * to keep JWT tokens server-side only.
 */

import type {
  DashboardStats,
  ScanResponse,
  ScanUsage,
  ScanHistoryResponse,
  UserProfile,
  DeadIndexResponse,
  Platform,
  TimelineEntry,
} from '@/types/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const PROXY_BASE = '/api/backend'  // Next.js API route that proxies to backend

class ApiClient {
  private baseUrl: string
  private proxyUrl: string

  constructor(baseUrl: string, proxyUrl: string) {
    this.baseUrl = baseUrl
    this.proxyUrl = proxyUrl
  }

  /** Direct call to backend (public, no auth) */
  private async publicRequest<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`)
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }
    return response.json()
  }

  /** Proxied call via Next.js (auth, JWT handled server-side) */
  private async authRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.proxyUrl}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }
    return response.json()
  }

  // --- Stats (public, direct) ---
  async getStats() {
    return this.publicRequest<DashboardStats>('/api/v1/stats/')
  }

  async getPlatforms() {
    return this.publicRequest<Record<string, Platform>>('/api/v1/stats/platforms')
  }

  async getTimeline() {
    return this.publicRequest<TimelineEntry[]>('/api/v1/stats/timeline')
  }

  async getTicker() {
    return this.publicRequest<string[]>('/api/v1/stats/ticker')
  }

  async getDeadIndex() {
    return this.publicRequest<DeadIndexResponse>('/api/v1/stats/index')
  }

  // --- Scanner (auth, proxied) ---
  async scanUrl(url: string) {
    return this.authRequest<ScanResponse>('/scanner/scan', {
      method: 'POST',
      body: JSON.stringify({ url }),
    })
  }

  async getScanUsage() {
    return this.authRequest<ScanUsage>('/scanner/usage')
  }

  async getScanHistory(limit = 20, offset = 0) {
    return this.authRequest<ScanHistoryResponse>(`/scanner/history?limit=${limit}&offset=${offset}`)
  }

  // --- User (auth, proxied) ---
  async getProfile() {
    return this.authRequest<UserProfile>('/users/me')
  }

  async createCheckout(priceId: string) {
    return this.authRequest<{ checkout_url: string }>(
      `/users/checkout?price_id=${priceId}`,
      { method: 'POST' }
    )
  }

  async createPortal() {
    return this.authRequest<{ portal_url: string }>('/users/portal', {
      method: 'POST',
    })
  }
}

export const api = new ApiClient(API_BASE, PROXY_BASE)
