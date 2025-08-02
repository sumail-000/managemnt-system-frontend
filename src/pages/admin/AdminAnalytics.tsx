import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Package,
  DollarSign,
  Activity,
  Calendar,
  Download
} from "lucide-react"
import { AdminChart } from "@/components/admin/AdminChart"
import { AdminStatsCard } from "@/components/admin/AdminStatsCard"

export default function AdminAnalytics() {
  const revenueData = [
    { month: "Jan", revenue: 32000, users: 2100 },
    { month: "Feb", revenue: 35000, users: 2300 },
    { month: "Mar", revenue: 38000, users: 2500 },
    { month: "Apr", revenue: 42000, users: 2700 },
    { month: "May", revenue: 45000, users: 2800 },
    { month: "Jun", revenue: 47892, users: 2847 }
  ]

  const featureUsage = [
    { feature: "Product Creation", usage: 89.2, trend: "+5.2%" },
    { feature: "Label Generator", usage: 76.8, trend: "+8.1%" },
    { feature: "QR Code Generator", usage: 65.4, trend: "+3.7%" },
    { feature: "Nutrition Analysis", usage: 58.9, trend: "+12.3%" },
    { feature: "Recipe Search", usage: 45.2, trend: "-2.1%" },
    { feature: "Category Management", usage: 34.7, trend: "+6.8%" }
  ]

  const userGrowth = [
    { period: "This Week", new: 156, churned: 23, net: 133 },
    { period: "This Month", new: 687, churned: 89, net: 598 },
    { period: "This Quarter", new: 1847, churned: 234, net: 1613 },
    { period: "This Year", new: 6254, churned: 567, net: 5687 }
  ]

  const planDistribution = [
    { plan: "Basic", count: 1247, percentage: 43.8, revenue: 12470 },
    { plan: "Pro", count: 892, percentage: 31.3, revenue: 26760 },
    { plan: "Enterprise", count: 708, percentage: 24.9, revenue: 212400 }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into platform performance and user behavior
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Custom Range
          </Button>
          <Button size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="Monthly Recurring Revenue"
          value="$47,892"
          change="+15.3%"
          trend="up"
          icon={DollarSign}
          color="purple"
        />
        <AdminStatsCard
          title="Active Users"
          value="2,456"
          change="+8.2%"
          trend="up"
          icon={Users}
          color="blue"
        />
        <AdminStatsCard
          title="Products Created"
          value="18,924"
          change="+12.5%"
          trend="up"
          icon={Package}
          color="green"
        />
        <AdminStatsCard
          title="API Calls (30d)"
          value="2.3M"
          change="+18.7%"
          trend="up"
          icon={Activity}
          color="orange"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue & User Growth Chart */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Revenue & User Growth Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminChart data={revenueData} />
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {planDistribution.map((plan) => (
                <div key={plan.plan} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{plan.plan}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{plan.count} users</Badge>
                      <span className="text-sm text-muted-foreground">
                        {plan.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary rounded-full h-2"
                        style={{ width: `${plan.percentage}%` }}
                      />
                    </div>
                    <span className="ml-2 text-muted-foreground">
                      ${plan.revenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Growth Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userGrowth.map((period) => (
                <div key={period.period} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <div className="font-medium">{period.period}</div>
                    <div className="text-sm text-muted-foreground">
                      +{period.new} new, -{period.churned} churned
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">+{period.net}</div>
                    <div className="text-xs text-muted-foreground">net growth</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feature Usage */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Feature Usage Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {featureUsage.map((feature) => (
                <div key={feature.feature} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-1">
                    <div className="font-medium">{feature.feature}</div>
                    <div className="text-2xl font-bold">{feature.usage}%</div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={feature.trend.startsWith('+') ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {feature.trend}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">vs last month</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* API Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle>API Usage by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Basic Plan</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div className="bg-blue-500 rounded-full h-2" style={{ width: '45%' }} />
                  </div>
                  <span className="text-sm text-muted-foreground">456K</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pro Plan</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div className="bg-purple-500 rounded-full h-2" style={{ width: '75%' }} />
                  </div>
                  <span className="text-sm text-muted-foreground">892K</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Enterprise Plan</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div className="bg-green-500 rounded-full h-2" style={{ width: '90%' }} />
                  </div>
                  <span className="text-sm text-muted-foreground">1.2M</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Response Time</span>
                <Badge className="bg-green-100 text-green-800">142ms</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Uptime (30 days)</span>
                <Badge className="bg-green-100 text-green-800">99.8%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Error Rate</span>
                <Badge className="bg-yellow-100 text-yellow-800">0.12%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Performance</span>
                <Badge className="bg-green-100 text-green-800">Optimal</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}