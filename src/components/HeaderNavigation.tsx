import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { 
  Package, 
  Plus, 
  QrCode, 
  FileText, 
  Heart, 
  Tag, 
  Bell, 
  Search, 
  User, 
  Settings, 
  LogOut, 
  UserCircle, 
  Crown, 
  Loader2,
  CreditCard,
  Shield,
  ChevronDown,
  LayoutDashboard,
  Menu,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { logService } from "@/services/logService"
import { getAvatarUrl } from "@/utils/storage"
import { cn } from "@/lib/utils"
import { NotificationModal } from "@/components/notifications/NotificationModal"
import { NotificationSettings } from "@/components/notifications/NotificationSettings"

const coreNavItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Recipes", href: "/products", icon: Package },
  { title: "Categories", href: "/categories", icon: Tag },
  { title: "Labels", href: "/labels", icon: FileText },
  { title: "QR Codes", href: "/qr-codes", icon: QrCode },
  { title: "Favorites", href: "/favorites", icon: Heart },
]

const settingsNavItems = [
  { title: "Billing", href: "/billing", icon: CreditCard, description: "Manage subscriptions and payments" },
  { title: "Settings", href: "/settings", icon: Settings, description: "Account and preferences" },
]

export function HeaderNavigation() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notificationModalOpen, setNotificationModalOpen] = useState(false)
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false)
  const location = useLocation()

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

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === href
    }
    return location.pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        
        {/* Logo and Brand */}
        <div className="flex items-center gap-6">
          <NavLink to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary/90 to-accent rounded-xl flex items-center justify-center shadow-lg ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300 group-hover:scale-105">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                FoodManager
              </h1>
              <p className="text-xs text-muted-foreground -mt-1">Recipe SAAS Platform</p>
            </div>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex">
            <NavigationMenu>
              <NavigationMenuList className="gap-1">
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-9 px-4 bg-transparent hover:bg-accent/50 data-[state=open]:bg-accent/70">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Navigation
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-2">
                      <div className="row-span-3">
                        <NavigationMenuLink asChild>
                          <NavLink
                            to="/dashboard"
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-primary/10 via-primary/5 to-background p-6 no-underline outline-none focus:shadow-md group"
                          >
                            <LayoutDashboard className="h-6 w-6 text-primary mb-2" />
                            <div className="mb-2 mt-4 text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                              Dashboard
                            </div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              Overview of your recipes, analytics, and quick actions.
                            </p>
                          </NavLink>
                        </NavigationMenuLink>
                      </div>
                      {coreNavItems.slice(1).map((item) => (
                        <NavigationMenuLink key={item.href} asChild>
                          <NavLink
                            to={item.href}
                            className={cn(
                              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group",
                              isActive(item.href) && "bg-accent/70 text-accent-foreground"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <item.icon className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                              <div className="text-sm font-medium leading-none">{item.title}</div>
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {item.title === "Recipes" && "Manage your food recipe inventory"}
                              {item.title === "Categories" && "Organize recipes by categories"}
                              {item.title === "Labels" && "Generate compliance labels"}
                              {item.title === "QR Codes" && "Create digital QR codes"}
                              {item.title === "Favorites" && "Your saved favorite items"}
                            </p>
                          </NavLink>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </nav>
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Right Side - Actions & User Menu */}
        <div className="flex items-center gap-4">
          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 hover:bg-accent/50 transition-colors">
                <Settings className="h-4 w-4" />
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-2">
              <DropdownMenuLabel className="text-sm font-medium px-2 py-2">
                Settings & Administration
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {settingsNavItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild className="p-0">
                  <NavLink
                    to={item.href}
                    className={cn(
                      "flex items-start gap-3 rounded-md px-3 py-3 text-sm transition-colors hover:bg-accent w-full",
                      isActive(item.href) && "bg-accent/70"
                    )}
                  >
                    <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/10 to-accent/10 mt-0.5">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                  </NavLink>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative hover:bg-accent/50 transition-colors">
                <Bell className="h-4 w-4" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-background border border-border shadow-lg z-50">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <DropdownMenuLabel className="text-base font-semibold">Notifications</DropdownMenuLabel>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => setNotificationModalOpen(true)}>
                    Mark all read
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => setNotificationSettingsOpen(true)}>
                    Settings
                  </Button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="p-2 space-y-1">
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">New recipe added</p>
                      <p className="text-xs text-muted-foreground">Premium Olive Oil has been added to your recipes</p>
                      <p className="text-xs text-muted-foreground mt-1">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Label generated successfully</p>
                      <p className="text-xs text-muted-foreground">Your nutrition label for Organic Greek Yogurt is ready</p>
                      <p className="text-xs text-muted-foreground mt-1">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Compliance alert</p>
                      <p className="text-xs text-muted-foreground">Please review allergen information for Margherita Pizza</p>
                      <p className="text-xs text-muted-foreground mt-1">3 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer opacity-60">
                    <div className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Weekly report available</p>
                      <p className="text-xs text-muted-foreground">Your recipe analytics report for this week is ready</p>
                      <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-3 border-t border-border">
                <Button variant="ghost" size="sm" className="w-full text-sm" onClick={() => setNotificationModalOpen(true)}>
                  View all notifications
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 rounded-lg p-2 transition-all duration-200 hover:scale-105">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium">{user?.name || 'User'}</p>
                  <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                    {membershipInfo.showCrown && (
                      <Crown className="h-3 w-3 text-yellow-500" />
                    )}
                    <span>{membershipInfo.text}</span>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-200">
                  {user?.avatar ? (
                    <img 
                      src={getAvatarUrl(user.avatar)} 
                      alt={user.name || 'User'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
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

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Notification Modals */}
      <NotificationModal 
        open={notificationModalOpen}
        onOpenChange={setNotificationModalOpen}
      />
      <NotificationSettings
        open={notificationSettingsOpen}
        onOpenChange={setNotificationSettingsOpen}
      />

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur">
          <div className="p-4 space-y-4">
            {/* Mobile Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Mobile Navigation Links */}
            <div className="grid gap-2">
              {coreNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg text-sm transition-colors",
                    isActive(item.href) 
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </NavLink>
              ))}
            </div>

          </div>
        </div>
      )}
    </header>
  )
}