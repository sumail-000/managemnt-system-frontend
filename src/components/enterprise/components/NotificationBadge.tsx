import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface NotificationBadgeProps {
  count: number
  onClick?: () => void
}

export function NotificationBadge({ count, onClick }: NotificationBadgeProps) {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="relative hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <Bell className="h-4 w-4" />
      {count > 0 && (
        <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white">
          {count > 99 ? '99+' : count}
        </Badge>
      )}
    </Button>
  )
}