/**
 * Global loading state - shown during page transitions.
 */

export default function Loading() {
  return (
    <div className="min-h-screen bg-dead-bg flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-2 border-dead-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-mono text-dead-accent text-sm animate-pulse">
          [ LOADING... ]
        </p>
      </div>
    </div>
  )
}
