import { Card } from "@/components/ui/card"

export function DashboardContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enterprise Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your enterprise management center
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">156</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <span className="text-blue-500 text-sm">👥</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
              <p className="text-2xl font-bold">23</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <span className="text-green-500 text-sm">📊</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Monthly Usage</p>
              <p className="text-2xl font-bold">89.5%</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <span className="text-orange-500 text-sm">📈</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
              <p className="text-2xl font-bold">94%</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <span className="text-purple-500 text-sm">✅</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">New team member added</p>
              <p className="text-xs text-muted-foreground">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">Compliance check completed</p>
              <p className="text-xs text-muted-foreground">4 hours ago</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-2 w-2 rounded-full bg-orange-500"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">Bulk upload processed</p>
              <p className="text-xs text-muted-foreground">6 hours ago</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}