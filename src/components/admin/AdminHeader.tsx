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
  Shield
} from "lucide-react"

interface AdminHeaderProps {
  onMenuClick: () => void
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
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
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users, products..."
            className="w-64 pl-9"
          />
        </div>
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
                <AvatarImage src="/avatars/admin.png" alt="Admin" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Admin User</p>
                <p className="text-xs leading-none text-muted-foreground">
                  admin@company.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Activity className="mr-2 h-4 w-4" />
              <span>Activity Log</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}