import { useState, useEffect } from "react"
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
  ArrowDownRight,
  RefreshCw
} from "lucide-react"
import { AdminStatsCard } from "@/components/admin/AdminStatsCard"
import { AdminChart } from "@/components/admin/AdminChart"
import { AdminRecentActivity } from "@/components/admin/AdminRecentActivity"
import { MonthYearPicker } from "@/components/admin/MonthYearPicker"
import { useToast } from "@/hooks/use-toast"
import api from "@/services/api"

interface DashboardMetric {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  icon: string
  color: "blue" | "green" | "purple" | "orange"
}

interface SystemHealth {
  api_response_time: { value: string; status: string }
  server_uptime: { value: string; status: string }
  database_status: { value: string; status: string }
  error_rate: { value: string; status: string }
}

export default function AdminDashboard() {
  const { toast } = useToast()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [metrics, setMetrics] = useState<DashboardMetric[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const iconMap = {
    Users,
    Package,
    DollarSign,
    Activity
  }

  const getDefaultMetrics = (): DashboardMetric[] => [
    {
      title: "Total Users",
      value: "0",
      change: "0%",
      trend: "up",
      icon: "Users",
      color: "blue"
    },
    {
      title: "Active Products",
      value: "0",
      change: "0%",
      trend: "up",
      icon: "Package",
      color: "green"
    },
    {
      title: "Monthly Revenue",
      value: "$0.00",
      change: "0%",
      trend: "up",
      icon: "DollarSign",
      color: "purple"
    },
    {
      title: "API Calls Today",
      value: "0",
      change: "0%",
      trend: "up",
      icon: "Activity",
      color: "orange"
    }
  ]

  const fetchDashboardData = async (month?: number, year?: number) => {
    try {
      const currentMonth = month || selectedMonth
      const currentYear = year || selectedYear
      
      const [metricsResponse, healthResponse] = await Promise.all([
        api.get(`/admin/dashboard/metrics?month=${currentMonth}&year=${currentYear}`),
        api.get('/admin/dashboard/system-health')
      ])

      if (metricsResponse.data.success) {
        const data = metricsResponse.data.data
        const formattedMetrics: DashboardMetric[] = [
          {
            title: data.total_users?.title || "Total Users",
            value: data.total_users?.value || "0",
            change: data.total_users?.change || "0%",
            trend: data.total_users?.trend || "up",
            icon: data.total_users?.icon || "Users",
            color: data.total_users?.color || "blue"
          },
          {
            title: data.active_products?.title || "Active Products",
            value: data.active_products?.value || "0",
            change: data.active_products?.change || "0%",
            trend: data.active_products?.trend || "up",
            icon: data.active_products?.icon || "Package",
            color: data.active_products?.color || "green"
          },
          {
            title: data.monthly_revenue?.title || "Monthly Revenue",
            value: data.monthly_revenue?.value || "$0.00",
            change: data.monthly_revenue?.change || "0%",
            trend: data.monthly_revenue?.trend || "up",
            icon: data.monthly_revenue?.icon || "DollarSign",
            color: data.monthly_revenue?.color || "purple"
          },
          {
            title: data.api_calls_today?.title || "API Calls Today",
            value: data.api_calls_today?.value || "0",
            change: data.api_calls_today?.change || "0%",
            trend: data.api_calls_today?.trend || "up",
            icon: data.api_calls_today?.icon || "Activity",
            color: data.api_calls_today?.color || "orange"
          }
        ]
        setMetrics(formattedMetrics)
      } else {
        // If API fails, show default metrics with zeros
        setMetrics(getDefaultMetrics())
      }

      if (healthResponse.data.success) {
        setSystemHealth(healthResponse.data.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Set default metrics on error
      setMetrics(getDefaultMetrics())
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Showing default values.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    // Initialize with default metrics first
    setMetrics(getDefaultMetrics())
    fetchDashboardData()
  }, [])

  const handleDateChange = (month: number, year: number) => {
    setSelectedMonth(month)
    setSelectedYear(year)
    setLoading(true)
    fetchDashboardData(month, year)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchDashboardData()
  }

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
          <MonthYearPicker
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onDateChange={handleDateChange}
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm">
            <BarChart3 className="mr-2 h-4 w-4" />
            View Reports
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="mt-4">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          // Always show metrics, even if empty (with fallback to default)
          (metrics.length > 0 ? metrics : getDefaultMetrics()).map((metric) => {
            const IconComponent = iconMap[metric.icon as keyof typeof iconMap]
            return (
              <AdminStatsCard
                key={metric.title}
                {...metric}
                icon={IconComponent}
              />
            )
          })
        )}
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
              {systemHealth ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Response Time</span>
                    <div className="flex items-center space-x-1">
                      {systemHealth.api_response_time.status === 'healthy' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-sm font-medium">{systemHealth.api_response_time.value}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Server Uptime</span>
                    <div className="flex items-center space-x-1">
                      {systemHealth.server_uptime.status === 'healthy' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-sm font-medium">{systemHealth.server_uptime.value}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database Status</span>
                    <div className="flex items-center space-x-1">
                      {systemHealth.database_status.status === 'healthy' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">{systemHealth.database_status.value}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Error Rate</span>
                    <div className="flex items-center space-x-1">
                      {systemHealth.error_rate.status === 'healthy' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-sm font-medium">{systemHealth.error_rate.value}</span>
                    </div>
                  </div>
                </>
              ) : (
                // Loading skeleton for system health
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                ))
              )}
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