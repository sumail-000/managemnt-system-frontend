import { ReactNode } from "react"
import { HeaderNavigation } from "@/components/HeaderNavigation"
import { SupportTicketsFab } from "@/components/SupportTicketsFab"
import { useAuth } from "@/contexts/AuthContext"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth()
  const planName = user?.membership_plan?.name || 'Basic'
  const hasLiveChat = false

  return (
    <div className="min-h-screen bg-background">
      <HeaderNavigation />
      {user?.is_suspended && (
        <div className="bg-yellow-100 text-yellow-900 border-b border-yellow-300">
          <div className="max-w-7xl mx-auto px-4 py-3 text-sm">
            Your account is currently suspended. The dashboard is in read-only mode. You can still view content and contact support.
            <a href="/support" className="ml-2 underline font-medium">Open Support Center</a>
          </div>
        </div>
      )}
      <main className="pt-0">
        {children}
      </main>
      {/* Always show support tickets FAB for all users */}
      <SupportTicketsFab />
      {/* Live chat removed; SupportTicketsFab remains for access control aesthetics */}
    </div>
  )
}