/**
 * Dashboard layout - adds bottom padding for fixed ticker tape.
 */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="pb-10">
      {children}
    </div>
  )
}
