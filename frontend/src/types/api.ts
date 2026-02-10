/**
 * API response types for the deadinternet.report backend.
 * Replaces all `any` types with proper interfaces.
 */

export type Verdict = 'human' | 'mixed' | 'ai_generated'
export type TierName = 'ghost' | 'hunter' | 'operator'

export interface Platform {
  bot_pct: number
  source: string
  ai_generated_pct?: number
}

export interface TimelineEntry {
  year: number
  bot_pct: number
  ai_content_pct: number
  projected?: boolean
}

export interface DashboardStats {
  dead_internet_index: number
  global: {
    bot_traffic_pct: number
    ai_content_pct: number
    fake_accounts_pct: number
    sources: string[]
  }
  platforms: Record<string, Platform>
  timeline: TimelineEntry[]
  ticker_facts: string[]
  last_updated: string
}

export interface ScanResult {
  ai_probability: number
  verdict: Verdict
  analysis: string
  content_snippet: string
  model_used: string
  tokens_used: number
  scan_duration_ms: number
  url?: string
  from_cache?: boolean
}

export interface ScanResponse {
  result: ScanResult
  usage?: ScanUsage
}

export interface ScanUsage {
  used: number
  limit: number
  remaining: number
}

export interface ScanHistoryItem {
  id: number
  url: string
  ai_probability: number
  verdict: Verdict
  analysis: string
  created_at: string
}

export interface ScanHistoryResponse {
  scans: ScanHistoryItem[]
  total: number
}

export interface UserProfile {
  id: string
  email: string
  name: string | null
  image: string | null
  tier: TierName
  created_at: string
}

export interface DeadIndexResponse {
  index: number
  last_updated: string
}
