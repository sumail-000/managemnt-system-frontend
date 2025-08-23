import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  HelpCircle,
  Menu,
  Sun,
  Moon
} from "lucide-react"
import { cn } from "@/lib/utils"

interface EnterpriseHeaderNewProps {
  onSearch?: (query: string) => void
  onNotificationClick?: () => void
  onUserMenuAction?: (action: string) => void
  onSidebarToggle: () => void
  sidebarCollapsed: boolean
}

export function EnterpriseHeaderNew({
  onSearch,
  onNotificationClick,
  onUserMenuAction,
  onSidebarToggle,
  sidebarCollapsed
}: EnterpriseHeaderNewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isDarkMode, setIsDarkMode] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchQuery)
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  const notificationCount = 3

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

        {/* Search */}
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search enterprise data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-80 bg-background/50 border-border/50 focus:bg-background focus:border-primary transition-all"
          />
        </form>
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

        {/* Help */}
        <Button variant="ghost" size="sm" className="w-9 h-9">
          <HelpCircle className="w-4 h-4" />
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onNotificationClick}
          className="relative w-9 h-9"
        >
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
            >
              {notificationCount}
            </Badge>
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 w-10 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt="Enterprise Admin" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm font-medium">
                  EA
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-56 bg-background/95 backdrop-blur-md border border-border/50"
          >
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Enterprise Admin</p>
                <p className="text-xs text-muted-foreground">admin@company.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => onUserMenuAction?.('profile')}
              className="cursor-pointer"
            >
              <User className="w-4 h-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => onUserMenuAction?.('account')}
              className="cursor-pointer"
            >
              <Settings className="w-4 h-4 mr-2" />
              Account Settings
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => onUserMenuAction?.('logout')}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}