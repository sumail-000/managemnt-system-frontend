import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Users, 
  Package, 
  TrendingUp, 
  Shield, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Building2,
  Zap
} from "lucide-react"

export function EnterpriseDashboard() {
  const stats = [
    {
      title: "Active Team Members",
      value: "156",
      change: "+12",
      changeLabel: "this month",
      icon: Users,
      color: "blue"
    },
    {
      title: "Products Managed",
      value: "2,847",
      change: "+324",
      changeLabel: "this week",
      icon: Package,
      color: "green"
    },
    {
      title: "Compliance Score",
      value: "94%",
      change: "+2%",
      changeLabel: "this quarter",
      icon: Shield,
      color: "purple"
    },
    {
      title: "API Calls",
      value: "1.2M",
      change: "+18%",
      changeLabel: "vs last month",
      icon: Zap,
      color: "orange"
    }
  ]

  const recentActivity = [
    { user: "Sarah Chen", action: "Created bulk import template", time: "2 minutes ago", type: "create" },
    { user: "Mike Rodriguez", action: "Updated compliance settings", time: "15 minutes ago", type: "update" },
    { user: "Team Alpha", action: "Completed product audit", time: "1 hour ago", type: "complete" },
    { user: "Lisa Wang", action: "Invited 5 new team members", time: "2 hours ago", type: "invite" },
    { user: "System", action: "Generated monthly compliance report", time: "4 hours ago", type: "system" }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent dark:from-slate-100 dark:via-blue-200 dark:to-indigo-200">
            Enterprise Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your organization's product data, team, and compliance from one central hub.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 text-green-700 dark:text-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            All Systems Operational
          </Badge>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
            <TrendingUp className="w-4 h-4 mr-2" />
            View Full Analytics
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border border-border/50 bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center group-hover:scale-110 transition-transform duration-200 ${
                stat.color === 'blue' ? 'from-blue-500 to-blue-600' :
                stat.color === 'green' ? 'from-green-500 to-green-600' :
                stat.color === 'purple' ? 'from-purple-500 to-purple-600' :
                'from-orange-500 to-orange-600'
              }`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600 font-medium">{stat.change}</span> {stat.changeLabel}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Company Health Overview */}
        <Card className="lg:col-span-2 border border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Organization Health
            </CardTitle>
            <CardDescription>
              Key metrics for your enterprise operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Team Productivity</span>
                <span className="font-medium">87%</span>
              </div>
              <Progress value={87} className="h-2" />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Compliance Status</span>
                <span className="font-medium">94%</span>
              </div>
              <Progress value={94} className="h-2" />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>API Performance</span>
                <span className="font-medium">99.8%</span>
              </div>
              <Progress value={99.8} className="h-2" />
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="outline" className="flex-1">
                <ArrowUpRight className="w-4 h-4 mr-2" />
                View Details
              </Button>
              <Button variant="outline" className="flex-1">
                <Clock className="w-4 h-4 mr-2" />
                Schedule Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest actions across your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b border-border/30 last:border-0">
                  <div className={`h-2 w-2 rounded-full mt-2 ${
                    activity.type === 'create' ? 'bg-blue-500' :
                    activity.type === 'update' ? 'bg-yellow-500' :
                    activity.type === 'complete' ? 'bg-green-500' :
                    activity.type === 'invite' ? 'bg-purple-500' :
                    'bg-gray-500'
                  }`} />
                  <div className="flex-1 space-y-1">
                    <div className="text-sm">
                      <span className="font-medium">{activity.user}</span>
                      <span className="text-muted-foreground"> {activity.action}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4">
              View All Activity
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Frequently used enterprise tools and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200">
              <Users className="h-5 w-5" />
              <span className="text-sm">Invite Members</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-green-50 dark:hover:bg-green-950 hover:border-green-200 dark:hover:border-green-800 transition-all duration-200">
              <Package className="h-5 w-5" />
              <span className="text-sm">Bulk Import</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-purple-50 dark:hover:bg-purple-950 hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-200">
              <Shield className="h-5 w-5" />
              <span className="text-sm">Run Compliance</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-orange-50 dark:hover:bg-orange-950 hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm">Generate Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}