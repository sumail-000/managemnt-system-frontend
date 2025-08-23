import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Settings,
  LogOut,
  Menu,
  Sun,
  Moon,
  LayoutDashboard
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"

interface EnterpriseHeaderNewProps {
  onSearch?: (query: string) => void
  onNotificationClick?: () => void
  onUserMenuAction?: (action: string) => void
  onSidebarToggle: () => void
  sidebarCollapsed: boolean
}

export function EnterpriseHeaderNew({
  onSidebarToggle,
  sidebarCollapsed
}: EnterpriseHeaderNewProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  const initials = (user?.name || user?.email || 'User')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handleExitToUserDashboard = () => {
    navigate('/dashboard')
  }

  return (
    <header className="enterprise-header h-16 flex items-center justify-between px-6 z-40">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Sidebar Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSidebarToggle}
          className="lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Status Badge */}
        <Badge 
          variant="outline" 
          className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 text-green-700 dark:text-green-300 hidden sm:flex"
        >
          All Systems Operational
        </Badge>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-9 h-9"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 w-10 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={(user as any)?.avatar || ''} alt={user?.name || user?.email || 'User'} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-64 bg-background/95 backdrop-blur-md border border-border/50"
          >
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Single action: Exit to User Dashboard */}
            <DropdownMenuItem 
              onClick={handleExitToUserDashboard}
              className="cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Exit to User Dashboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}