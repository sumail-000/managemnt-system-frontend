import { ReactNode, useState } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Button } from "@/components/ui/button"
import { Bell, Search, User, Settings, LogOut, UserCircle, Crown, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { logService } from "@/services/logService"
import { getAvatarUrl } from "@/utils/storage"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      logService.info('User logout initiated', {
        userId: user?.id,
        email: user?.email,
        timestamp: new Date().toISOString()
      })
      
      setIsLoggingOut(true)
      await logout()
      
      logService.info('User logout completed successfully')
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      })
    } catch (error) {
      logService.error('Logout failed', error)
      toast({
        title: "Logout failed",
        description: "There was an error logging you out. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  const getMembershipDisplay = () => {
    if (!user?.membership_plan) {
      return { text: 'Basic Member', showCrown: false }
    }
    
    const planName = user.membership_plan.name
    const showCrown = planName === 'Pro' || planName === 'Enterprise'
    
    return {
      text: `${planName} Member`,
      showCrown
    }
  }

  const membershipInfo = getMembershipDisplay()

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Top Navigation */}
          <header className="h-16 border-b border-border bg-slate-700 text-slate-50 flex items-center justify-between px-6 shadow-md">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products, labels, users..."
                  className="pl-10 pr-4 py-2 w-80 rounded-lg border border-slate-600 bg-slate-800 text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative text-slate-200 hover:text-slate-50 hover:bg-slate-600">
                <Bell className="h-4 w-4" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  3
                </Badge>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-600 rounded-lg p-2 transition-colors">
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-50">{user?.name || 'User'}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-300">
                        {membershipInfo.showCrown && (
                          <Crown className="h-3 w-3 text-yellow-500" />
                        )}
                        <span>{membershipInfo.text}</span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-600 flex items-center justify-center">
                      {user?.avatar ? (
                        <img 
                          src={getAvatarUrl(user.avatar)} 
                          alt={user.name || 'User'} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Header avatar image failed to load:', {
                              src: e.currentTarget.src,
                              userAvatar: user?.avatar
                            });
                          }}
                          onLoad={() => {
                            console.log('Header avatar image loaded successfully:', {
                              src: getAvatarUrl(user.avatar)
                            });
                          }}
                        />
                      ) : (
                        <User className="h-4 w-4 text-slate-200" />
                      )}
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
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

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}