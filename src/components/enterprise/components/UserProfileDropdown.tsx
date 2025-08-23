import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserProfileDropdownProps {
  user: {
    name: string
    email: string
    initials: string
  }
  onMenuAction?: (action: string) => void
}

export function UserProfileDropdown({ user, onMenuAction }: UserProfileDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-accent/50 transition-colors">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-medium">
              {user.initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Enterprise Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onMenuAction?.('profile')}>
          Organization Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMenuAction?.('billing')}>
          Billing & Usage
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMenuAction?.('security')}>
          Security Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onMenuAction?.('switch')}>
          Switch to Personal
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="text-red-600" 
          onClick={() => onMenuAction?.('signout')}
        >
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}