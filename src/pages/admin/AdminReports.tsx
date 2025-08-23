import { useEffect, useMemo, useState } from "react"
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
import { format as dfFormat } from "date-fns"
import api from "@/services/api"
import jsPDF from "jspdf"

interface ReportItem {
  id: number
  key: "user_activity" | "revenue_summary" | "product_performance" | "api_usage" | "platform_growth" | "feature_adoption"
  name: string
  description: string
  type: string
  icon: any
  color: "blue" | "green" | "purple" | "orange"
  lastGenerated: string
  status: "ready" | "generating" | "outdated" | string
}

export default function AdminReports() {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: new Date(2024, 0, 1),
    to: new Date()
  })

  // Make reports stateful so we can update status/lastGenerated
  const [reports, setReports] = useState<ReportItem[]>([
    {
      id: 1,
      key: "user_activity",
      name: "User Activity Report",
      description: "Detailed analysis of user engagement and activity patterns",
      type: "User Analytics",
      icon: Users,
      color: "blue",
      lastGenerated: "—",
      status: "outdated"
    },
    {
      id: 2,
      key: "revenue_summary",
      name: "Revenue Summary",
      description: "Monthly revenue breakdown by subscription plans",
      type: "Financial",
      icon: DollarSign,
      color: "green",
      lastGenerated: "—",
      status: "outdated"
    },
    {
      id: 3,
      key: "product_performance",
      name: "Product Performance",
      description: "Most popular products and creation trends",
      type: "Product Analytics",
      icon: Package,
      color: "purple",
      lastGenerated: "—",
      status: "outdated"
    },
    {
      id: 4,
      key: "api_usage",
      name: "API Usage Statistics",
      description: "API call patterns and rate limiting analysis",
      type: "System Analytics",
      icon: Activity,
      color: "orange",
      lastGenerated: "—",
      status: "outdated"
    },
    {
      id: 5,
      key: "platform_growth",
      name: "Platform Growth Report",
      description: "User acquisition and retention metrics",
      type: "Growth Analytics",
      icon: TrendingUp,
      color: "blue",
      lastGenerated: "—",
      status: "outdated"
    },
    {
      id: 6,
      key: "feature_adoption",
      name: "Feature Adoption Report",
      description: "Feature usage patterns and adoption rates",
      type: "Feature Analytics",
      icon: BarChart3,
      color: "green",
      lastGenerated: "—",
      status: "outdated"
    }
  ])

  // Datasets cache per report key
  const [datasets, setDatasets] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  const quickStats = useMemo(() => ([
    { label: "Total Reports Generated", value: Object.values(datasets).length.toString(), period: "This session" },
    { label: "Active Report Types", value: reports.filter(r => r.status === 'ready').length.toString(), period: "Generated" },
    { label: "Automated Reports", value: "0", period: "Scheduled" },
    { label: "Export Downloads", value: "—", period: "Manual" }
  ]), [datasets, reports])

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

  const rangeParams = () => {
    const from = dateRange.from ? dfFormat(dateRange.from, 'yyyy-MM-dd') : dfFormat(new Date(), 'yyyy-MM-dd')
    const to = dateRange.to ? dfFormat(dateRange.to, 'yyyy-MM-dd') : dfFormat(new Date(), 'yyyy-MM-dd')
    return { from, to }
  }

  const setReportStatus = (id: number, status: ReportItem['status'], lastGenerated?: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status, lastGenerated: lastGenerated ?? r.lastGenerated } : r))
  }

  // Fetch functions per report
  const fetchUserActivity = async () => {
    const res: any = await api.get('/admin/reports/user-activity', { params: rangeParams() })
    return res
  }
  const fetchRevenueSummary = async () => {
    const res: any = await api.get('/admin/reports/revenue-summary', { params: rangeParams() })
    return res
  }
  const fetchProductPerformance = async () => {
    const res: any = await api.get('/admin/reports/product-performance', { params: rangeParams() })
    return res
  }
  const fetchApiUsage = async () => {
    const res: any = await api.get('/admin/reports/api-usage', { params: rangeParams() })
    return res
  }
  const fetchPlatformGrowth = async () => {
    const res: any = await api.get('/admin/reports/platform-growth', { params: rangeParams() })
    return res
  }
  const fetchFeatureAdoption = async () => {
    const res: any = await api.get('/admin/reports/feature-adoption', { params: rangeParams() })
    return res
  }

  const generateReport = async (report: ReportItem) => {
    setReportStatus(report.id, 'generating')
    try {
      let data: any = null
      if (report.key === 'user_activity') {
        data = await fetchUserActivity()
      } else if (report.key === 'revenue_summary') {
        data = await fetchRevenueSummary()
      } else if (report.key === 'product_performance') {
        data = await fetchProductPerformance()
      } else if (report.key === 'api_usage') {
        data = await fetchApiUsage()
      } else if (report.key === 'platform_growth') {
        data = await fetchPlatformGrowth()
      } else if (report.key === 'feature_adoption') {
        data = await fetchFeatureAdoption()
      } else {
        // Not implemented server-side yet; return empty dataset
        data = { success: true, data: [] }
      }
      setDatasets(prev => ({ ...prev, [report.key]: data }))
      setReportStatus(report.id, 'ready', 'Just now')
    } catch (e) {
      setReportStatus(report.id, 'outdated')
    }
  }

  // CSV builder (simple)
  const toCSV = (rows: any[], headers?: string[]) => {
    if (!rows || rows.length === 0) return ''
    const cols = headers && headers.length ? headers : Array.from(new Set(rows.flatMap((r: any) => Object.keys(r))))
    const esc = (v: any) => {
      if (v == null) return ''
      const s = String(v)
      if (s.includes('"') || s.includes(',') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"'
      return s
    }
    const lines = [cols.join(',')]
    for (const r of rows) {
      lines.push(cols.map(c => esc(r[c])).join(','))
    }
    return lines.join('\n')
  }

  // Flatten datasets to CSV rows based on report type
  const buildCSVForReport = (report: ReportItem, data: any): { filename: string; csv: string } => {
    const { from, to } = rangeParams()
    const base = `${report.key}_${from}_${to}`

    if (report.key === 'user_activity') {
      const rows: any[] = []
      for (const r of (data.signups_by_day || [])) rows.push({ section: 'signups_by_day', date: r.date, count: r.count })
      for (const r of (data.active_by_day || [])) rows.push({ section: 'active_by_day', date: r.date, count: r.count })
      rows.push({ section: 'suspended_total', date: '', count: data.suspended_count ?? 0 })
      return { filename: `${base}.csv`, csv: toCSV(rows, ['section','date','count']) }
    }

    if (report.key === 'revenue_summary') {
      const rows: any[] = []
      for (const r of (data.revenue_by_day || [])) rows.push({ section: 'revenue_by_day', date: r.date, total_amount: r.total_amount, tx_count: r.tx_count })
      for (const r of (data.revenue_by_plan || [])) rows.push({ section: 'revenue_by_plan', plan: r.plan, total_amount: r.total_amount, tx_count: r.tx_count })
      for (const r of (data.payment_methods || [])) rows.push({ section: 'payment_methods', provider: r.provider, brand: r.brand, count: r.count })
      return { filename: `${base}.csv`, csv: toCSV(rows) }
    }

    if (report.key === 'product_performance') {
      const rows: any[] = []
      for (const r of (data.created_by_day || [])) rows.push({ section: 'created_by_day', date: r.date, count: r.count })
      for (const r of (data.status_breakdown || [])) rows.push({ section: 'status_breakdown', status: r.status, count: r.count })
      for (const r of (data.visibility || [])) rows.push({ section: 'visibility', is_public: r.is_public, count: r.count })
      for (const r of (data.top_categories || [])) rows.push({ section: 'top_categories', category: r.category, count: r.count })
      return { filename: `${base}.csv`, csv: toCSV(rows) }
    }

    if (report.key === 'api_usage') {
      const rows: any[] = []
      for (const r of (data.calls_by_day || [])) rows.push({ section: 'calls_by_day', date: r.date, count: r.count })
      for (const r of (data.calls_by_service || [])) rows.push({ section: 'calls_by_service', service: r.service, count: r.count })
      if (typeof data.error_rate_percent === 'number') rows.push({ section: 'error_rate', percent: data.error_rate_percent })
      return { filename: `${base}.csv`, csv: toCSV(rows) }
    }

    if (report.key === 'platform_growth') {
      const rows: any[] = []
      for (const r of (data.new_users_by_day || [])) rows.push({ section: 'new_users_by_day', date: r.date, count: r.count })
      for (const r of (data.paid_conversions_by_day || [])) rows.push({ section: 'paid_conversions_by_day', date: r.date, count: r.count })
      for (const r of (data.churn_by_day || [])) rows.push({ section: 'churn_by_day', date: r.date, count: r.count })
      return { filename: `${base}.csv`, csv: toCSV(rows) }
    }

    if (report.key === 'feature_adoption') {
      const rows: any[] = []
      for (const r of (data.usage_by_month || [])) rows.push({ month: r.month, products: r.products, qr_codes: r.qr_codes, labels: r.labels })
      return { filename: `${base}.csv`, csv: toCSV(rows) }
    }

    // Default: dump JSON to CSV with a single column
    return { filename: `${base}.csv`, csv: toCSV([{ note: 'No data available' }]) }
  }

  const triggerDownload = (filename: string, content: string, mime = 'text/csv') => {
    const blob = new Blob([content], { type: mime + ';charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleGenerate = async (report: ReportItem) => {
    await generateReport(report)
  }

  const downloadJSON = (report: ReportItem, data: any) => {
    const { from, to } = rangeParams()
    const fname = `${report.key}_${from}_${to}.json`
    triggerDownload(fname, JSON.stringify(data, null, 2), 'application/json')
  }

  const downloadPDF = (report: ReportItem, data: any) => {
    const { from, to } = rangeParams()
    const doc = new jsPDF()
    const title = `${report.name} (${from} to ${to})`
    doc.setFontSize(14)
    doc.text(title, 10, 16)
    doc.setFontSize(10)
    let y = 24

    const addRow = (label: string, value: string) => {
      doc.text(`${label}: ${value}`, 10, y)
      y += 6
      if (y > 280) { doc.addPage(); y = 16 }
    }

    if (report.key === 'user_activity') {
      addRow('Signups entries', String((data.signups_by_day || []).length))
      addRow('Active entries', String((data.active_by_day || []).length))
      addRow('Suspended total', String(data.suspended_count ?? 0))
    } else if (report.key === 'revenue_summary') {
      addRow('Revenue days', String((data.revenue_by_day || []).length))
      addRow('Plans', String((data.revenue_by_plan || []).length))
      addRow('Payment methods', String((data.payment_methods || []).length))
    } else if (report.key === 'product_performance') {
      addRow('Created days', String((data.created_by_day || []).length))
      addRow('Statuses', String((data.status_breakdown || []).length))
      addRow('Categories', String((data.top_categories || []).length))
    } else if (report.key === 'api_usage') {
      addRow('Days', String((data.calls_by_day || []).length))
      addRow('Services', String((data.calls_by_service || []).length))
      addRow('Error rate %', String(data.error_rate_percent ?? 'N/A'))
    } else if (report.key === 'platform_growth') {
      addRow('New users days', String((data.new_users_by_day || []).length))
      addRow('Paid conv days', String((data.paid_conversions_by_day || []).length))
      addRow('Churn days', String((data.churn_by_day || []).length))
    } else if (report.key === 'feature_adoption') {
      addRow('Months', String((data.usage_by_month || []).length))
    }

    const fname = `${report.key}_${from}_${to}.pdf`
    doc.save(fname)
  }

  const handleDownload = async (report: ReportItem, ev?: React.MouseEvent) => {
    // Ensure dataset exists
    let data = datasets[report.key]
    if (!data) {
      await generateReport(report)
      data = datasets[report.key]
    }
    // the generateReport above updates state asynchronously; re-read after slight delay if still missing
    if (!data) {
      await new Promise(res => setTimeout(res, 200))
      data = datasets[report.key]
    }
    const payload = data?.data ? data.data : data

    // If Alt key is pressed, export PDF; if Shift, export JSON; otherwise CSV
    if (ev && ev.altKey) {
      downloadPDF(report, payload)
      return
    }
    if (ev && ev.shiftKey) {
      downloadJSON(report, payload)
      return
    }

    const { filename, csv } = buildCSVForReport(report, payload)
    triggerDownload(filename, csv)
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
                  `${dfFormat(dateRange.from, "MMM dd")} - ${dfFormat(dateRange.to, "MMM dd")}`
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
                        <Button size="sm" variant="outline" className="text-xs h-8" onClick={(e) => handleDownload(report, e)} disabled={report.status === 'generating'} title="Click: CSV | Shift+Click: JSON | Alt+Click: PDF">
                          <Download className="mr-1 h-3 w-3" />
                          Download
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs h-8" onClick={() => handleGenerate(report)} disabled={report.status === 'generating'}>
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
