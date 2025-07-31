import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Key, BarChart3, Webhook, FileText } from "lucide-react"

export function APIManagement() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent dark:from-slate-100 dark:via-blue-200 dark:to-indigo-200">
            API Management
          </h1>
          <p className="text-muted-foreground">Manage API keys, monitor usage, and configure integrations.</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
          <Key className="w-4 h-4 mr-2" />
          Generate API Key
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Key className="h-6 w-6 text-white" />
            </div>
            <CardTitle>API Keys</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <CardTitle>Usage Analytics</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Webhook className="h-6 w-6 text-white" />
            </div>
            <CardTitle>Webhooks</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <CardTitle>Documentation</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}