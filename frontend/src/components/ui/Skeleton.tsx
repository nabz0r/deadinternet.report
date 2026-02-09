/**
 * Loading skeleton components for dashboard.
 * Terminal aesthetic with subtle pulse animation.
 */

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-dead-surface border border-dead-border p-6 ${className}`}>
      <div className="h-3 w-24 bg-dead-muted/50 rounded-sm animate-pulse mb-3" />
      <div className="h-8 w-32 bg-dead-muted/30 rounded-sm animate-pulse mb-2" />
      <div className="h-2 w-20 bg-dead-muted/20 rounded-sm animate-pulse" />
    </div>
  )
}

export function SkeletonGauge() {
  return (
    <div className="bg-dead-surface border border-dead-border p-6 flex flex-col items-center justify-center">
      <div className="w-32 h-32 rounded-full border-4 border-dead-muted/20 animate-pulse mb-4" />
      <div className="h-3 w-28 bg-dead-muted/30 rounded-sm animate-pulse" />
    </div>
  )
}

export function SkeletonChart({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-dead-surface border border-dead-border p-6 ${className}`}>
      <div className="h-3 w-32 bg-dead-muted/50 rounded-sm animate-pulse mb-4" />
      <div className="flex items-end gap-2 h-40">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-dead-muted/20 rounded-sm animate-pulse"
            style={{
              height: `${30 + Math.random() * 60}%`,
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-dead-surface border border-dead-border">
      <div className="px-4 py-3 border-b border-dead-border">
        <div className="h-3 w-24 bg-dead-muted/50 rounded-sm animate-pulse" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="px-4 py-3 border-b border-dead-border/50 flex items-center gap-4"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="h-3 flex-[2] bg-dead-muted/20 rounded-sm animate-pulse" />
          <div className="h-3 flex-1 bg-dead-muted/15 rounded-sm animate-pulse" />
          <div className="h-3 w-16 bg-dead-muted/10 rounded-sm animate-pulse" />
        </div>
      ))}
    </div>
  )
}
