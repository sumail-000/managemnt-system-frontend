import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Package,
  Database,
  RefreshCw
} from "lucide-react"

export function BulkOperations() {
  const operations = [
    {
      id: 1,
      name: "Product Import - Q1 2024",
      type: "Import",
      status: "Completed",
      progress: 100,
      itemsProcessed: 2847,
      totalItems: 2847,
      startedAt: "2024-01-15 09:30 AM",
      completedAt: "2024-01-15 10:45 AM"
    },
    {
      id: 2,
      name: "Nutrition Data Export",
      type: "Export",
      status: "In Progress",
      progress: 67,
      itemsProcessed: 1893,
      totalItems: 2847,
      startedAt: "2024-01-20 02:15 PM",
      completedAt: null
    },
    {
      id: 3,
      name: "Category Bulk Update",
      type: "Update",
      status: "Pending",
      progress: 0,
      itemsProcessed: 0,
      totalItems: 1250,
      startedAt: null,
      completedAt: null
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "In Progress":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case "Pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "In Progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent dark:from-slate-100 dark:via-blue-200 dark:to-indigo-200">
            Bulk Operations
          </h1>
          <p className="text-muted-foreground">
            Import, export, and manage large datasets efficiently.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border border-border/50 bg-gradient-to-br from-background to-muted/20 cursor-pointer">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <CardTitle>Bulk Import</CardTitle>
            <CardDescription>
              Import products, categories, or nutrition data from CSV/Excel files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Start Import</Button>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border border-border/50 bg-gradient-to-br from-background to-muted/20 cursor-pointer">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Download className="h-6 w-6 text-white" />
            </div>
            <CardTitle>Bulk Export</CardTitle>
            <CardDescription>
              Export your data in various formats for backup or analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Start Export</Button>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border border-border/50 bg-gradient-to-br from-background to-muted/20 cursor-pointer">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Database className="h-6 w-6 text-white" />
            </div>
            <CardTitle>Template Manager</CardTitle>
            <CardDescription>
              Create and manage templates for consistent bulk operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Manage Templates</Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Operations */}
      <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-500" />
            Recent Operations
          </CardTitle>
          <CardDescription>
            Track the progress and status of your bulk operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {operations.map((operation) => (
              <div key={operation.id} className="flex items-center justify-between p-4 border border-border/30 rounded-lg bg-background/50">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                    {operation.type === "Import" && <Upload className="h-5 w-5" />}
                    {operation.type === "Export" && <Download className="h-5 w-5" />}
                    {operation.type === "Update" && <Package className="h-5 w-5" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{operation.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(operation.status)}`}>
                        {operation.status}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {operation.itemsProcessed} of {operation.totalItems} items processed
                    </div>
                    {operation.status === "In Progress" && (
                      <div className="w-48">
                        <Progress value={operation.progress} className="h-2" />
                        <div className="text-xs text-muted-foreground mt-1">
                          {operation.progress}% complete
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm text-muted-foreground">
                    {operation.startedAt && (
                      <div>Started: {operation.startedAt}</div>
                    )}
                    {operation.completedAt && (
                      <div>Completed: {operation.completedAt}</div>
                    )}
                  </div>
                  {getStatusIcon(operation.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Import/Export Guidelines */}
      <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-500" />
            Guidelines & Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-3">Import Requirements</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• CSV or Excel files up to 50MB</li>
                <li>• Maximum 10,000 rows per import</li>
                <li>• UTF-8 encoding required</li>
                <li>• Required fields must be present</li>
                <li>• Use our template for best results</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Export Options</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• CSV, Excel, or JSON formats</li>
                <li>• Filter by date range or category</li>
                <li>• Include/exclude specific fields</li>
                <li>• Automatic compression for large files</li>
                <li>• Email notification when ready</li>
              </ul>
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              View Documentation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}