import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Shield, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Download,
  Eye,
  Zap
} from "lucide-react"

export function ComplianceCenter() {
  const complianceMetrics = [
    { title: "Overall Score", value: "94%", status: "excellent", change: "+2%" },
    { title: "Active Violations", value: "3", status: "warning", change: "-5" },
    { title: "Pending Reviews", value: "12", status: "info", change: "+4" },
    { title: "Last Audit", value: "2 days ago", status: "success", change: "On time" }
  ]

  const regulations = [
    {
      name: "FDA Nutrition Labeling",
      status: "Compliant",
      coverage: 98,
      lastUpdate: "2024-01-15",
      violations: 0
    },
    {
      name: "EU Allergen Regulations",
      status: "Minor Issues",
      coverage: 92,
      lastUpdate: "2024-01-10",
      violations: 3
    },
    {
      name: "CFIA Food Labeling",
      status: "Compliant",
      coverage: 96,
      lastUpdate: "2024-01-12",
      violations: 0
    },
    {
      name: "USDA Organic Standards",
      status: "Under Review",
      coverage: 85,
      lastUpdate: "2024-01-08",
      violations: 1
    }
  ]

  const recentAlerts = [
    {
      type: "warning",
      title: "Missing Allergen Declaration",
      description: "3 products missing required allergen information",
      time: "2 hours ago",
      urgent: true
    },
    {
      type: "info",
      title: "New Regulation Update",
      description: "FDA updated nutrition labeling requirements",
      time: "1 day ago",
      urgent: false
    },
    {
      type: "success",
      title: "Audit Completed",
      description: "Q4 2023 compliance audit successfully completed",
      time: "3 days ago",
      urgent: false
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Compliant":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Minor Issues":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "Under Review":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent dark:from-slate-100 dark:via-blue-200 dark:to-indigo-200">
            Compliance Center
          </h1>
          <p className="text-muted-foreground">
            Monitor regulatory compliance and maintain audit readiness.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Zap className="w-4 h-4 mr-2" />
            Run Audit
          </Button>
        </div>
      </div>

      {/* Compliance Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        {complianceMetrics.map((metric, index) => (
          <Card key={index} className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                metric.status === 'excellent' ? 'bg-green-500' :
                metric.status === 'warning' ? 'bg-yellow-500' :
                metric.status === 'info' ? 'bg-blue-500' : 'bg-green-500'
              }`}>
                <Shield className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600 font-medium">{metric.change}</span> vs last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Regulations Overview */}
      <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-blue-500" />
            Regulatory Compliance Status
          </CardTitle>
          <CardDescription>
            Current compliance status across all applicable regulations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {regulations.map((regulation, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-border/30 rounded-lg bg-background/50">
                <div className="flex items-center gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{regulation.name}</h4>
                      <Badge className={getStatusColor(regulation.status)}>
                        {regulation.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Coverage: {regulation.coverage}%</span>
                      <span>•</span>
                      <span>Last updated: {regulation.lastUpdate}</span>
                      <span>•</span>
                      <span>{regulation.violations} violations</span>
                    </div>
                    <div className="w-64">
                      <Progress value={regulation.coverage} className="h-2" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts & Updates */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Recent Alerts
            </CardTitle>
            <CardDescription>
              Important compliance notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAlerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border border-border/30 rounded-lg bg-background/50">
                  <div className="mt-1">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-sm">{alert.title}</h5>
                      {alert.urgent && (
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs">
                          Urgent
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <p className="text-xs text-muted-foreground">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Compliance Trends
            </CardTitle>
            <CardDescription>
              Your compliance performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Compliance Score Trend</span>
                  <span className="text-green-600 font-medium">↗ +5.2%</span>
                </div>
                <Progress value={94} className="h-3" />
                <div className="text-xs text-muted-foreground">94% (Target: 95%)</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Violation Resolution Time</span>
                  <span className="text-green-600 font-medium">↗ -18%</span>
                </div>
                <Progress value={78} className="h-3" />
                <div className="text-xs text-muted-foreground">2.3 days average</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Audit Readiness</span>
                  <span className="text-blue-600 font-medium">→ Stable</span>
                </div>
                <Progress value={89} className="h-3" />
                <div className="text-xs text-muted-foreground">89% ready</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}