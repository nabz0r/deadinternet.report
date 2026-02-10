/**
 * Shared verdict display helpers.
 * Used by LiveScanner and scan history page.
 */

export function verdictColor(verdict: string): string {
  switch (verdict) {
    case 'human': return 'text-dead-safe'
    case 'mixed': return 'text-dead-ai'
    case 'ai_generated': return 'text-dead-danger'
    default: return 'text-dead-dim'
  }
}

export function verdictLabel(verdict: string): string {
  switch (verdict) {
    case 'human': return 'LIKELY HUMAN'
    case 'mixed': return 'MIXED SIGNALS'
    case 'ai_generated': return 'AI GENERATED'
    default: return verdict?.toUpperCase() || 'UNKNOWN'
  }
}

export function verdictBgColor(verdict: string): string {
  switch (verdict) {
    case 'human': return 'bg-dead-safe/10 border-dead-safe/30'
    case 'mixed': return 'bg-dead-ai/10 border-dead-ai/30'
    case 'ai_generated': return 'bg-dead-danger/10 border-dead-danger/30'
    default: return 'bg-dead-dim/10 border-dead-dim/30'
  }
}
