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
      <main className="pt-0">
        {children}
      </main>
      {/* Always show support tickets FAB for all users */}
      <SupportTicketsFab />
      {/* Live chat removed; SupportTicketsFab remains for access control aesthetics */}
    </div>
  )
}