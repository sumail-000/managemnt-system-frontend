import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
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
  Zap,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Plus,
  Filter,
  MoreVertical
} from "lucide-react"

export function NewEnterpriseDashboard() {
  const stats = [
    {
      title: "Active Members",
      value: "156",
      change: "+12",
      changeLabel: "this month",
      icon: Users,
      color: "blue",
      trend: "up"
    },
    {
      title: "Products Needing Review",
      value: "142",
      change: "-23",
      changeLabel: "last 7 days",
      icon: Package,
      color: "green",
      trend: "down"
    },
    {
      title: "Open Compliance Issues",
      value: "28",
      change: "-5",
      changeLabel: "this week",
      icon: AlertTriangle,
      color: "orange",
      trend: "down"
    },
    {
      title: "API Sync Health",
      value: "99.9%",
      change: "+0.1%",
      changeLabel: "uptime (30d)",
      icon: Zap,
      color: "purple",
      trend: "up"
    }
  ]

  const recentActivity = [
    { 
      user: "Sarah Chen", 
      action: "Created bulk import template for Q4 products", 
      time: "2 minutes ago", 
      type: "create",
      department: "Product Management"
    },
    { 
      user: "Mike Rodriguez", 
      action: "Updated compliance settings for EU regulations", 
      time: "15 minutes ago", 
      type: "update",
      department: "Compliance"
    },
    { 
      user: "Team Alpha", 
      action: "Completed product audit for organic certification", 
      time: "1 hour ago", 
      type: "complete",
      department: "Quality Assurance"
    },
    { 
      user: "Lisa Wang", 
      action: "Invited 5 new team members to Brand Center", 
      time: "2 hours ago", 
      type: "invite",
      department: "Brand Management"
    },
    { 
      user: "System", 
      action: "Generated monthly compliance report", 
      time: "4 hours ago", 
      type: "system",
      department: "Automated Process"
    }
  ]

  const recentImports = [
    { filename: "enterprise_products_q4.csv", rows: 1240, status: "success", date: "Today 14:22" },
    { filename: "brands_update.xlsx", rows: 58, status: "warning", date: "Today 09:10" },
    { filename: "api_sync_2024-12-10.json", rows: 342, status: "failed", date: "Yesterday 18:40" },
    { filename: "nutrition_batches.csv", rows: 210, status: "success", date: "Dec 09" }
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent dark:from-slate-100 dark:via-blue-200 dark:to-indigo-200">
            Enterprise Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Requirement-focused overview: compliance, API sync, team access, and bulk operations
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 text-green-700 dark:text-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            All Systems Operational
          </Badge>
          
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter Data
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
            <TrendingUp className="w-4 h-4 mr-2" />
            View Analytics
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-border/50 bg-gradient-to-br from-background to-muted/10 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg ${
                stat.color === 'blue' ? 'from-blue-500 to-blue-600' :
                stat.color === 'green' ? 'from-green-500 to-green-600' :
                stat.color === 'purple' ? 'from-purple-500 to-purple-600' :
                'from-orange-500 to-orange-600'
              }`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="flex items-center text-sm">
                <span className={`font-medium ${
                  stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {stat.change}
                </span>
                <span className="text-muted-foreground ml-1">{stat.changeLabel}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Performance Overview */}
        <Card className="lg:col-span-2 border border-border/50 bg-gradient-to-br from-background to-muted/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                Enterprise Health Overview
              </CardTitle>
              <CardDescription className="mt-1">
                Compliance, API synchronization and team readiness
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Compliance Resolution Rate</span>
                  <span className="text-sm font-bold text-green-600">78%</span>
                </div>
                <Progress value={78} className="h-3" />
                <p className="text-xs text-muted-foreground">Based on issues resolved vs. opened in the period</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">API Sync Uptime</span>
                  <span className="text-sm font-bold text-blue-600">99.9%</span>
                </div>
                <Progress value={99.9} className="h-3" />
                <p className="text-xs text-muted-foreground">Uptime and sync success rates across integrations</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Role Coverage</span>
                  <span className="text-sm font-bold text-purple-600">92%</span>
                </div>
                <Progress value={92} className="h-3" />
                <p className="text-xs text-muted-foreground">Percentage of required roles assigned in teams</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Products Ready for Labeling</span>
                  <span className="text-sm font-bold text-orange-600">65%</span>
                </div>
                <Progress value={65} className="h-3" />
                <p className="text-xs text-muted-foreground">Products passing checks and ready for label generation</p>
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="flex-1 min-w-0">
                <BarChart3 className="w-4 h-4 mr-2" />
                Detailed Reports
              </Button>
              <Button variant="outline" className="flex-1 min-w-0">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Review
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/10">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-500" />
                Recent Activity
              </span>
              <Button variant="ghost" size="sm">
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </CardTitle>
            <CardDescription>
              Latest actions across your organization
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b border-border/30 last:border-0">
                  <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                    activity.type === 'create' ? 'bg-blue-500' :
                    activity.type === 'update' ? 'bg-yellow-500' :
                    activity.type === 'complete' ? 'bg-green-500' :
                    activity.type === 'invite' ? 'bg-purple-500' :
                    'bg-gray-500'
                  }`} />
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-medium">{activity.user}</span>
                      <span className="text-muted-foreground"> {activity.action}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                      <Badge variant="outline" className="text-xs">
                        {activity.department}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <Separator className="my-4" />
            
            <Button variant="ghost" className="w-full">
              View All Activity
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bulk Import Status */}
        <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/10">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Bulk Import Status</span>
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </CardTitle>
            <CardDescription>
              Recent imports and their results
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {recentImports.map((imp, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                  <div className="space-y-1">
                    <p className="text-sm font-medium truncate max-w-[220px]">{imp.filename}</p>
                    <p className="text-xs text-muted-foreground">{imp.rows} rows</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={imp.status === 'success' ? 'default' : imp.status === 'warning' ? 'secondary' : 'destructive'}
                      className="text-xs capitalize"
                    >
                      {imp.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{imp.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/10">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Frequently used enterprise tools and shortcuts
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="grid gap-3 grid-cols-2">
              <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200">
                <Users className="h-5 w-5" />
                <span className="text-sm">Add Member</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-green-50 dark:hover:bg-green-950 hover:border-green-200 dark:hover:border-green-800 transition-all duration-200">
                <Package className="h-5 w-5" />
                <span className="text-sm">Upload CSV/XLSX</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-purple-50 dark:hover:bg-purple-950 hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-200">
                <Shield className="h-5 w-5" />
                <span className="text-sm">Run Compliance</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-orange-50 dark:hover:bg-orange-950 hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm">View Regulatory Updates</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}