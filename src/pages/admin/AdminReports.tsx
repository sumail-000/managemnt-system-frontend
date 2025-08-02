import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  Download, 
  FileText, 
  Calendar as CalendarIcon,
  Users,
  Package,
  DollarSign,
  Activity,
  TrendingUp,
  BarChart3
} from "lucide-react"
import { format } from "date-fns"

export default function AdminReports() {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: new Date(2024, 0, 1),
    to: new Date()
  })

  const reports = [
    {
      id: 1,
      name: "User Activity Report",
      description: "Detailed analysis of user engagement and activity patterns",
      type: "User Analytics",
      icon: Users,
      color: "blue",
      lastGenerated: "2 hours ago",
      status: "ready"
    },
    {
      id: 2,
      name: "Revenue Summary",
      description: "Monthly revenue breakdown by subscription plans",
      type: "Financial",
      icon: DollarSign,
      color: "green",
      lastGenerated: "1 day ago",
      status: "ready"
    },
    {
      id: 3,
      name: "Product Performance",
      description: "Most popular products and creation trends",
      type: "Product Analytics",
      icon: Package,
      color: "purple",
      lastGenerated: "6 hours ago",
      status: "ready"
    },
    {
      id: 4,
      name: "API Usage Statistics",
      description: "API call patterns and rate limiting analysis",
      type: "System Analytics",
      icon: Activity,
      color: "orange",
      lastGenerated: "Generating...",
      status: "generating"
    },
    {
      id: 5,
      name: "Platform Growth Report",
      description: "User acquisition and retention metrics",
      type: "Growth Analytics",
      icon: TrendingUp,
      color: "blue",
      lastGenerated: "3 days ago",
      status: "ready"
    },
    {
      id: 6,
      name: "Feature Adoption Report",
      description: "Feature usage patterns and adoption rates",
      type: "Feature Analytics",
      icon: BarChart3,
      color: "green",
      lastGenerated: "1 week ago",
      status: "outdated"
    }
  ]

  const quickStats = [
    { label: "Total Reports Generated", value: "1,247", period: "This month" },
    { label: "Active Report Subscribers", value: "89", period: "Current" },
    { label: "Automated Reports", value: "24", period: "Scheduled" },
    { label: "Export Downloads", value: "456", period: "This week" }
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "text-blue-600 bg-blue-100"
      case "green":
        return "text-green-600 bg-green-100"
      case "purple":
        return "text-purple-600 bg-purple-100"
      case "orange":
        return "text-orange-600 bg-orange-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return <Badge className="bg-green-100 text-green-800">Ready</Badge>
      case "generating":
        return <Badge className="bg-yellow-100 text-yellow-800">Generating</Badge>
      case "outdated":
        return <Badge className="bg-red-100 text-red-800">Outdated</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate and download comprehensive platform reports
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from && dateRange.to ? (
                  `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
                ) : (
                  "Select Date Range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Custom Report
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-sm font-medium">{stat.label}</p>
              <p className="text-xs text-muted-foreground">{stat.period}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Available Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <Card key={report.id} className="relative">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${getColorClasses(report.color)}`}>
                      <report.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">{report.name}</h3>
                        {getStatusBadge(report.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">{report.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">{report.type}</Badge>
                        <span className="text-xs text-muted-foreground">{report.lastGenerated}</span>
                      </div>
                      <div className="flex items-center space-x-2 pt-2">
                        <Button size="sm" variant="outline" className="text-xs h-8">
                          <Download className="mr-1 h-3 w-3" />
                          Download
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs h-8">
                          Generate
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Templates */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-medium text-sm">Weekly User Summary</div>
                  <div className="text-xs text-muted-foreground">Every Monday at 9:00 AM</div>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-medium text-sm">Monthly Revenue Report</div>
                  <div className="text-xs text-muted-foreground">1st of every month</div>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-medium text-sm">Quarterly Growth Analysis</div>
                  <div className="text-xs text-muted-foreground">End of each quarter</div>
                </div>
                <Badge variant="outline">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Export Formats</h4>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">PDF</Button>
                  <Button variant="outline" size="sm">Excel</Button>
                  <Button variant="outline" size="sm">CSV</Button>
                  <Button variant="outline" size="sm">JSON</Button>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Delivery Methods</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" defaultChecked />
                    <span>Email delivery</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" />
                    <span>FTP upload</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" defaultChecked />
                    <span>Direct download</span>
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}