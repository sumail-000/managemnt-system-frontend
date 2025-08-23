import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CircleHelp } from "lucide-react"
import { SearchBar } from "./components/SearchBar"
import { NotificationBadge } from "./components/NotificationBadge"
import { UserProfileDropdown } from "./components/UserProfileDropdown"
import { mockStore } from "./EnterpriseMockData"

interface EnterpriseHeaderProps {
  onSearch?: (query: string) => void
  onNotificationClick?: () => void
  onUserMenuAction?: (action: string) => void
}

export function EnterpriseHeader({ 
  onSearch, 
  onNotificationClick, 
  onUserMenuAction 
}: EnterpriseHeaderProps) {
  return (
    <header className="h-16 border-b border-border/40 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="hover:bg-accent/50 transition-colors" />
          <SearchBar onSearch={onSearch} />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Enterprise Status Badge */}
          <Badge 
            variant="outline" 
            className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300"
          >
            Enterprise Plan
          </Badge>
          
          {/* Help */}
          <Button variant="ghost" size="icon" className="hover:bg-accent/50 transition-colors">
            <CircleHelp className="h-4 w-4" />
          </Button>
          
          {/* Notifications */}
          <NotificationBadge 
            count={mockStore.notifications.count} 
            onClick={onNotificationClick}
          />

          {/* User Menu */}
          <UserProfileDropdown 
            user={mockStore.user}
            onMenuAction={onUserMenuAction}
          />
        </div>
      </div>
    </header>
  )
}