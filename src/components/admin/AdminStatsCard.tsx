import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface AdminStatsCardProps {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  icon: LucideIcon
  color: "blue" | "green" | "purple" | "orange" | string
}

const colorClasses = {
  blue: "text-blue-600 bg-blue-100",
  green: "text-green-600 bg-green-100",
  purple: "text-purple-600 bg-purple-100",
  orange: "text-orange-600 bg-orange-100"
}

export function AdminStatsCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color
}: AdminStatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center", colorClasses[color])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-4">
          <Badge
            variant={trend === "up" ? "default" : "destructive"}
            className="flex items-center space-x-1"
          >
            {trend === "up" ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            <span>{change}</span>
          </Badge>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      </CardContent>
    </Card>
  )
}