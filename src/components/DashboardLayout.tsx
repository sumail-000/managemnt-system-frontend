import { ReactNode } from "react"
import { HeaderNavigation } from "@/components/HeaderNavigation"
import { SupportChat } from "@/components/SupportChat"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <HeaderNavigation />
      <main className="pt-0">
        {children}
      </main>
      <SupportChat />
    </div>
  )
}