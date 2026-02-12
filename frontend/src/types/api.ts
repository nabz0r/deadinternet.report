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
    ai_content_new_pages_pct: number
    ai_articles_pct: number
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

// ── Analytics types ─────────────────────────────────────────────────

export interface ScanVolumeEntry {
  date: string
  total: number
  ai_generated: number
  mixed: number
  human: number
  avg_ai_probability: number
}

export interface DomainStatsItem {
  domain: string
  scan_count: number
  ai_generated_count: number
  mixed_count: number
  human_count: number
  avg_ai_probability: number
  ai_rate: number
  last_scanned: string | null
}

export interface VerdictBreakdown {
  ai_generated: number
  mixed: number
  human: number
}

export interface ScanSummary {
  total_scans: number
  avg_ai_probability: number
  verdict_breakdown: VerdictBreakdown
  verdict_rates: VerdictBreakdown
  total_tokens_used: number
  avg_scan_duration_ms: number
}

export interface AnalyticsResponse {
  dead_internet_index: number
  scan_summary: ScanSummary
  dynamic_ticker_facts: string[]
  scan_volume_trend: ScanVolumeEntry[]
  top_domains: DomainStatsItem[]
}

export interface UserAnalytics {
  total_scans: number
  scans_this_month: number
  avg_ai_probability: number
  verdict_breakdown: VerdictBreakdown
  top_domains: DomainStatsItem[]
  recent_activity: ScanVolumeEntry[]
}

// ── API Token types ─────────────────────────────────────────────────

export interface ApiToken {
  id: string
  name: string
  token_prefix: string
  revoked: boolean
  last_used_at: string | null
  created_at: string
}

export interface ApiTokenCreated {
  id: string
  name: string
  token: string
  token_prefix: string
  created_at: string
}

// ── Batch Scan types ────────────────────────────────────────────────

export interface BatchScanResultItem {
  url: string
  status: 'success' | 'error'
  result: ScanResult | null
  error: string | null
}

export interface BatchScanResponse {
  total: number
  succeeded: number
  failed: number
  results: BatchScanResultItem[]
  usage: ScanUsage
}
