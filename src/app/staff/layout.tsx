import Sidebar from '@/components/shared/Sidebar'
export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-navy-900">
      <Sidebar role="staff" />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
