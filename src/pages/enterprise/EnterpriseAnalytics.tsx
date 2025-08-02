import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, Users, Package } from "lucide-react"

export function EnterpriseAnalytics() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent dark:from-slate-100 dark:via-blue-200 dark:to-indigo-200">
            Enterprise Analytics
          </h1>
          <p className="text-muted-foreground">Advanced analytics and insights for your organization.</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
          <TrendingUp className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Team Performance</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Product Growth</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+324</div>
            <p className="text-xs text-muted-foreground">Products this month</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">91% utilization</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">+2% improvement</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}