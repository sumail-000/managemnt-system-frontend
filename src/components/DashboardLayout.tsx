import { ReactNode } from "react"
import { HeaderNavigation } from "@/components/HeaderNavigation"
import { SupportChat } from "@/components/SupportChat"
import { SupportTicketsFab } from "@/components/SupportTicketsFab"
import { useAuth } from "@/contexts/AuthContext"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth()
  const planName = user?.membership_plan?.name || 'Basic'
  const hasLiveChat = planName === 'Pro' || planName === 'Enterprise'

  return (
    <div className="min-h-screen bg-background">
      <HeaderNavigation />
      <main className="pt-0">
        {children}
      </main>
      {/* Always show support tickets FAB for all users */}
      <SupportTicketsFab />
      {/* Show live chat only to Pro and Enterprise */}
      {hasLiveChat && <SupportChat />}
    </div>
  )
}