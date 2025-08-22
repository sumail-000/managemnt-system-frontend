import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
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

// Define types for the API responses to ensure type safety
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface MetricsData {
  total_users: DashboardMetric;
  active_products: DashboardMetric;
  monthly_revenue: DashboardMetric;
  api_calls_today: DashboardMetric;
  user_distribution: any[];
}

interface AnalyticsData {
    date: string;
    label: string;
    value: number;
}

export default function AdminDashboard() {
  const { toast } = useToast()
  const [metrics, setMetrics] = useState<DashboardMetric[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [userDistribution, setUserDistribution] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30d');

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

  const fetchDashboardData = async () => {
    try {
      const [metricsResponse, healthResponse]: [any, any] = await Promise.all([
        api.get(`/admin/dashboard/metrics`),
        api.get('/admin/dashboard/system-health')
      ]);

      if (metricsResponse && metricsResponse.success) {
        const data = metricsResponse.data;
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
        ];
        setMetrics(formattedMetrics);
        setUserDistribution(data.user_distribution || []);
      } else {
        setMetrics(getDefaultMetrics());
      }

      if (healthResponse && healthResponse.success) {
        setSystemHealth(healthResponse.data);
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

  const fetchAnalyticsData = async (period: string) => {
    try {
        const [revenueResponse, usersResponse]: [any, any] = await Promise.all([
            api.get('/admin/dashboard/analytics', { params: { metric: 'revenue', period } }),
            api.get('/admin/dashboard/analytics', { params: { metric: 'users', period } })
        ]);

        if (revenueResponse.success && usersResponse.success) {
            const combinedData = revenueResponse.data.map((revItem: AnalyticsData) => {
                const userItem = usersResponse.data.find((u: AnalyticsData) => u.date === revItem.date);
                return {
                    month: revItem.label,
                    revenue: revItem.value,
                    users: userItem ? userItem.value : 0,
                };
            });
            setRevenueData(combinedData);
        }
    } catch (error) {
        console.error('Error fetching analytics data:', error);
        toast({
            title: "Error",
            description: "Failed to load chart data.",
            variant: "destructive",
        });
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
        fetchDashboardData(),
        fetchAnalyticsData(analyticsPeriod)
    ]).finally(() => setLoading(false));
  }, [analyticsPeriod])

  const handleRefresh = () => {
    setRefreshing(true)
    Promise.all([
        fetchDashboardData(),
        fetchAnalyticsData(analyticsPeriod)
    ]).finally(() => setRefreshing(false));
  }

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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" asChild>
            <Link to="/admin-panel/reports">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Reports
            </Link>
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
            const period = metric.title === "API Calls Today" ? "vs yesterday" : "vs last month";
            return (
              <AdminStatsCard
                key={metric.title}
                {...metric}
                icon={IconComponent}
                period={period}
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
                      {((item.value / (userDistribution.reduce((acc, cur) => acc + cur.value, 0) || 1)) * 100).toFixed(1)}%
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
      </div>
    </div>
  )
}
