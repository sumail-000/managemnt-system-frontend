import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Package, 
  DollarSign, 
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  UserPlus,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { AdminStatsCard } from "@/components/admin/AdminStatsCard"
import { AdminChart } from "@/components/admin/AdminChart"
import { AdminRecentActivity } from "@/components/admin/AdminRecentActivity"

export default function AdminDashboard() {
  const stats = [
    {
      title: "Total Users",
      value: "2,847",
      change: "+12.5%",
      trend: "up" as const,
      icon: Users,
      color: "blue"
    },
    {
      title: "Active Products",
      value: "18,924",
      change: "+8.2%",
      trend: "up" as const,
      icon: Package,
      color: "green"
    },
    {
      title: "Monthly Revenue",
      value: "$47,892",
      change: "+15.3%",
      trend: "up" as const,
      icon: DollarSign,
      color: "purple"
    },
    {
      title: "API Calls Today",
      value: "89,342",
      change: "-2.1%",
      trend: "down" as const,
      icon: Activity,
      color: "orange"
    }
  ]

  const userDistribution = [
    { name: "Basic", value: 1247, color: "#e2e8f0" },
    { name: "Pro", value: 892, color: "#3b82f6" },
    { name: "Enterprise", value: 708, color: "#8b5cf6" }
  ]

  const revenueData = [
    { month: "Jan", revenue: 32000, users: 2100 },
    { month: "Feb", revenue: 35000, users: 2300 },
    { month: "Mar", revenue: 38000, users: 2500 },
    { month: "Apr", revenue: 42000, users: 2700 },
    { month: "May", revenue: 45000, users: 2800 },
    { month: "Jun", revenue: 47892, users: 2847 }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your platform.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Last 30 days
          </Button>
          <Button size="sm">
            <BarChart3 className="mr-2 h-4 w-4" />
            View Reports
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <AdminStatsCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue & User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminChart data={revenueData} />
            </CardContent>
          </Card>
        </div>

        {/* User Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">{item.value}</span>
                    <Badge variant="outline" className="text-xs">
                      {((item.value / 2847) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">API Response Time</span>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">142ms</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Server Uptime</span>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">99.8%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Status</span>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Healthy</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Error Rate</span>
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">0.12%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <AdminRecentActivity />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Button variant="outline" size="sm" className="justify-start">
                <UserPlus className="mr-2 h-4 w-4" />
                Add New User
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <AlertTriangle className="mr-2 h-4 w-4" />
                View Flagged Products
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <Activity className="mr-2 h-4 w-4" />
                System Maintenance
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}