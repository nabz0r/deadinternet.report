/**
 * API client for backend communication.
 * Handles auth headers, error parsing, and base URL config.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface FetchOptions extends RequestInit {
  token?: string
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(path: string, options: FetchOptions = {}): Promise<T> {
    const { token, ...fetchOptions } = options

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...fetchOptions,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // --- Stats (public) ---
  async getStats() {
    return this.request<any>('/api/v1/stats/')
  }

  async getPlatforms() {
    return this.request<any>('/api/v1/stats/platforms')
  }

  async getTimeline() {
    return this.request<any[]>('/api/v1/stats/timeline')
  }

  async getTicker() {
    return this.request<string[]>('/api/v1/stats/ticker')
  }

  async getDeadIndex() {
    return this.request<{ index: number; last_updated: string }>('/api/v1/stats/index')
  }

  // --- Scanner (auth required) ---
  async scanUrl(url: string, token: string) {
    return this.request<any>('/api/v1/scanner/scan', {
      method: 'POST',
      body: JSON.stringify({ url }),
      token,
    })
  }

  async getScanUsage(token: string) {
    return this.request<any>('/api/v1/scanner/usage', { token })
  }

  async getScanHistory(token: string, limit = 20, offset = 0) {
    return this.request<any>(`/api/v1/scanner/history?limit=${limit}&offset=${offset}`, { token })
  }

  // --- User ---
  async getProfile(token: string) {
    return this.request<any>('/api/v1/users/me', { token })
  }

  async createCheckout(priceId: string, token: string) {
    return this.request<{ checkout_url: string }>(
      `/api/v1/users/checkout?price_id=${priceId}`,
      { method: 'POST', token }
    )
  }

  async createPortal(token: string) {
    return this.request<{ portal_url: string }>('/api/v1/users/portal', {
      method: 'POST',
      token,
    })
  }
}

export const api = new ApiClient(API_BASE)
