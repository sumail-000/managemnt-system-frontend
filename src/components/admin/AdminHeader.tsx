import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Menu,
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  Activity,
  Shield,
  Home,
  Loader2
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { getAvatarUrl } from "@/utils/storage"

interface AdminHeaderProps {
  onMenuClick: () => void
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of the admin panel.",
      })
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging you out. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleReturnToDashboard = () => {
    navigate('/dashboard')
  }
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="h-8 w-8"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {/* System Status */}
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          <span className="text-xs text-muted-foreground">System Healthy</span>
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <Badge 
                variant="destructive" 
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
              >
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="space-y-2 p-2">
              <div className="flex items-start space-x-2 rounded-lg p-2 hover:bg-accent">
                <Activity className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="font-medium">High API usage detected</p>
                  <p className="text-muted-foreground">User exceeded rate limit</p>
                </div>
              </div>
              <div className="flex items-start space-x-2 rounded-lg p-2 hover:bg-accent">
                <Shield className="h-4 w-4 text-red-500 mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="font-medium">Suspicious activity</p>
                  <p className="text-muted-foreground">Multiple login attempts</p>
                </div>
              </div>
              <div className="flex items-start space-x-2 rounded-lg p-2 hover:bg-accent">
                <User className="h-4 w-4 text-green-500 mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="font-medium">New Enterprise signup</p>
                  <p className="text-muted-foreground">Acme Corp registered</p>
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Admin Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user?.avatar ? `${getAvatarUrl(user.avatar)}?t=${Date.now()}` : undefined}
                  alt={user?.name || 'Admin'}
                />
                <AvatarFallback className="bg-destructive text-destructive-foreground">
                  {(user?.name || 'Admin').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || 'Admin User'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || 'admin@company.com'}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Shield className="h-3 w-3 text-destructive" />
                  <span className="text-xs text-destructive font-medium">Administrator</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/admin-panel/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Admin Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin-panel/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Admin Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <User className="mr-2 h-4 w-4" />
              <span>Personal Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleReturnToDashboard}>
              <Home className="mr-2 h-4 w-4" />
              <span>Return to Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}