import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserPlus, Package, DollarSign, AlertTriangle } from "lucide-react"

export function AdminRecentActivity() {
  const activities = [
    {
      id: 1,
      type: "user_signup",
      user: "John Doe",
      action: "signed up for Pro plan",
      time: "2 minutes ago",
      icon: UserPlus,
      color: "green"
    },
    {
      id: 2,
      type: "product_created",
      user: "Sarah Wilson",
      action: "created new product",
      time: "5 minutes ago",
      icon: Package,
      color: "blue"
    },
    {
      id: 3,
      type: "payment",
      user: "Acme Corp",
      action: "upgraded to Enterprise",
      time: "15 minutes ago",
      icon: DollarSign,
      color: "purple"
    },
    {
      id: 4,
      type: "violation",
      user: "Mike Johnson",
      action: "product flagged for review",
      time: "1 hour ago",
      icon: AlertTriangle,
      color: "red"
    },
    {
      id: 5,
      type: "user_signup",
      user: "Lisa Chen",
      action: "signed up for Basic plan",
      time: "2 hours ago",
      icon: UserPlus,
      color: "green"
    }
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case "green":
        return "text-green-600 bg-green-100"
      case "blue":
        return "text-blue-600 bg-blue-100"
      case "purple":
        return "text-purple-600 bg-purple-100"
      case "red":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${getColorClasses(activity.color)}`}>
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">{activity.user}</span>
                  <span className="text-sm text-muted-foreground">{activity.action}</span>
                </div>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}