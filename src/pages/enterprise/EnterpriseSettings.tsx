import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Building2, CreditCard, Bell } from "lucide-react"

export function EnterpriseSettings() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent dark:from-slate-100 dark:via-blue-200 dark:to-indigo-200">
            Enterprise Settings
          </h1>
          <p className="text-muted-foreground">Configure your organization settings and preferences.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              Organization
            </CardTitle>
            <CardDescription>Manage organization details and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Manage Organization</Button>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-500" />
              Billing
            </CardTitle>
            <CardDescription>View billing details and subscription management</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">View Billing</Button>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-500" />
              Notifications
            </CardTitle>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Notification Settings</Button>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-500" />
              Advanced
            </CardTitle>
            <CardDescription>Advanced configuration and feature toggles</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Advanced Settings</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}