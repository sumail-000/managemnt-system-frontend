import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bell, HelpCircle, Search, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

export function EnterpriseHeader() {
  return (
    <header className="h-16 border-b border-border/40 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="hover:bg-accent/50 transition-colors" />
          
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search enterprise features..." 
              className="pl-10 bg-muted/50 border-border/50 focus:border-primary/50 transition-all duration-200"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Enterprise Status Badge */}
          <Badge variant="outline" className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300">
            Enterprise Plan
          </Badge>
          
          {/* Help */}
          <Button variant="ghost" size="icon" className="hover:bg-accent/50 transition-colors">
            <HelpCircle className="h-4 w-4" />
          </Button>
          
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative hover:bg-accent/50 transition-colors">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white">
              3
            </Badge>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-accent/50 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-medium">
                    EA
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">Enterprise Admin</p>
                  <p className="text-xs text-muted-foreground">admin@company.com</p>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Enterprise Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Organization Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing & Usage</DropdownMenuItem>
              <DropdownMenuItem>Security Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Switch to Personal</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}