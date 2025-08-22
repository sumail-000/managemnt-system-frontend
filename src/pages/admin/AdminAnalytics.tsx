import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users as UsersIcon,
  Package as PackageIcon,
  DollarSign,
  Activity as ActivityIcon,
  Calendar as CalendarIcon,
  Download
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"

import { AdminChart } from "@/components/admin/AdminChart"
import { AdminStatsCard } from "@/components/admin/AdminStatsCard"
import jsPDF from 'jspdf'
import api from "@/services/api"

// Types for backend analytics response
interface AnalyticsPoint {
  date: string
  label: string
  value: number
}

type Trend = 'up' | 'down' | 'neutral'

function computeGrowth(current: number, previous: number): { change: string; trend: Trend } {
  if (current === previous) {
    return { change: '0.0%', trend: 'neutral' }
  }
  if (previous === 0) {
    if (current === 0) return { change: '0.0%', trend: 'neutral' }
    return { change: '+100.0%', trend: 'up' }
  }
  const delta = ((current - previous) / Math.abs(previous)) * 100
  const trend: Trend = delta > 0 ? 'up' : 'down'
  const change = `${delta >= 0 ? '+' : ''}${Math.abs(delta).toFixed(1)}%`
  return { change, trend }
}

function sumSeries(data: AnalyticsPoint[]): number {
  return data.reduce((acc, p) => acc + (Number(p.value) || 0), 0)
}

function formatCurrency(v: number): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(v)
  } catch {
    return `$${v.toFixed(2)}`
  }
}

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function AdminAnalytics() {
  // Range/period state
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined })
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const useCustomRange = !!(dateRange.from && dateRange.to)

  // Series state
  const [revenueSeries, setRevenueSeries] = useState<AnalyticsPoint[]>([])
  const [usersSeries, setUsersSeries] = useState<AnalyticsPoint[]>([])
  const [productsSeries, setProductsSeries] = useState<AnalyticsPoint[]>([])
  const [apiSeries, setApiSeries] = useState<AnalyticsPoint[]>([])

  // Prev series for growth comparisons
  const [prevRevenueSeries, setPrevRevenueSeries] = useState<AnalyticsPoint[]>([])
  const [prevUsersSeries, setPrevUsersSeries] = useState<AnalyticsPoint[]>([])
  const [prevProductsSeries, setPrevProductsSeries] = useState<AnalyticsPoint[]>([])
  const [prevApiSeries, setPrevApiSeries] = useState<AnalyticsPoint[]>([])

  const [loading, setLoading] = useState(false)

  // Additional analytics state
  const [planDistribution, setPlanDistribution] = useState<Array<{ plan: string; count: number; percentage: number; revenue: number }>>([])
  const [userGrowth, setUserGrowth] = useState<Array<{ period: string; new: number; churned: number; net: number }>>([])
  const [apiUsageByPlan, setApiUsageByPlan] = useState<Array<{ plan: string; count: number; percentage: number }>>([])
  const [systemHealth, setSystemHealth] = useState<{ api_response_time: { value: string; status: string }; server_uptime: { value: string; status: string }; database_status: { value: string; status: string }; error_rate: { value: string; status: string } } | null>(null)

  // Build combined dataset for the chart (Revenue vs Users)
  const chartData = useMemo(() => {
    const map: Record<string, { month: string; revenue: number; users: number }> = {}
    revenueSeries.forEach(p => {
      map[p.date] = map[p.date] || { month: p.label, revenue: 0, users: 0 }
      map[p.date].revenue = p.value
    })
    usersSeries.forEach(p => {
      map[p.date] = map[p.date] || { month: p.label, revenue: 0, users: 0 }
      map[p.date].users = p.value
    })
    return Object.keys(map)
      .sort()
      .map(k => map[k])
  }, [revenueSeries, usersSeries])

  const fetchSeries = async (metric: 'revenue' | 'users' | 'products' | 'api_calls', start?: string, end?: string, usePeriod?: string) => {
    const params: any = { metric }
    if (start && end) {
      params.start_date = start
      params.end_date = end
    } else if (usePeriod) {
      params.period = usePeriod
    } else {
      params.period = '30d'
    }
    const resp: any = await api.get('/admin/dashboard/analytics', { params })
    if (!resp?.success) return [] as AnalyticsPoint[]
    return (resp.data || []) as AnalyticsPoint[]
  }

  const computePrevWindow = (from: Date, to: Date) => {
    const msInDay = 24 * 60 * 60 * 1000
    const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / msInDay) + 1)
    const prevEnd = new Date(from.getTime() - msInDay)
    const prevStart = new Date(prevEnd.getTime() - (days - 1) * msInDay)
    return { prevStart, prevEnd, days }
  }

  const fetchAncillaryAnalytics = async (start?: string, end?: string) => {
    const params: any = {}
    const growthParams: any = {}
    if (start && end) {
      params.start_date = start
      params.end_date = end
      growthParams.start_date = start
      growthParams.end_date = end
    }
    // Subscription distribution, growth, api usage by plan, health
    const [subResp, growthResp, apiPlanResp, healthResp, featureResp]: any = await Promise.all([
      api.get('/admin/dashboard/subscription-distribution', { params }),
      api.get('/admin/dashboard/user-growth', { params: growthParams }),
      api.get('/admin/dashboard/api-usage-by-plan', { params }),
      api.get('/admin/dashboard/system-health'),
      api.get('/admin/dashboard/feature-usage', { params })
    ])
    if (subResp?.success) setPlanDistribution(subResp.data || [])
    if (growthResp?.success) setUserGrowth(growthResp.data || [])
    if (apiPlanResp?.success) setApiUsageByPlan(apiPlanResp.data || [])
    if (healthResp?.success) setSystemHealth(healthResp.data || null)
    if (featureResp?.success) setFeatureUsage(featureResp.data || [])
  }

  const refreshData = async () => {
    setLoading(true)
    try {
      if (useCustomRange) {
        const start = toISODate(dateRange.from!)
        const end = toISODate(dateRange.to!)

        // Fetch current window series
        const [rev, usr, prod, apiu] = await Promise.all([
          fetchSeries('revenue', start, end),
          fetchSeries('users', start, end),
          fetchSeries('products', start, end),
          fetchSeries('api_calls', start, end),
        ])
        setRevenueSeries(rev); setUsersSeries(usr); setProductsSeries(prod); setApiSeries(apiu)

        // Ancillary analytics for same window
        await fetchAncillaryAnalytics(start, end)

        // Fetch previous window series of equal length
        const { prevStart, prevEnd } = computePrevWindow(dateRange.from!, dateRange.to!)
        const prevStartStr = toISODate(prevStart)
        const prevEndStr = toISODate(prevEnd)
        const [prevRev, prevUsr, prevProd, prevApiu] = await Promise.all([
          fetchSeries('revenue', prevStartStr, prevEndStr),
          fetchSeries('users', prevStartStr, prevEndStr),
          fetchSeries('products', prevStartStr, prevEndStr),
          fetchSeries('api_calls', prevStartStr, prevEndStr),
        ])
        setPrevRevenueSeries(prevRev); setPrevUsersSeries(prevUsr); setPrevProductsSeries(prevProd); setPrevApiSeries(prevApiu)
      } else {
        // Period based
        const p = period
        const [rev, usr, prod, apiu] = await Promise.all([
          fetchSeries('revenue', undefined, undefined, p),
          fetchSeries('users', undefined, undefined, p),
          fetchSeries('products', undefined, undefined, p),
          fetchSeries('api_calls', undefined, undefined, p),
        ])
        setRevenueSeries(rev); setUsersSeries(usr); setProductsSeries(prod); setApiSeries(apiu)

        // Derive date range from series to query range-based ancillary endpoints
        if (rev.length > 0) {
          const firstDate = new Date(rev[0].date)
          const lastDate = new Date(rev[rev.length - 1].date)
          const startStr = toISODate(firstDate)
          const endStr = toISODate(lastDate)
          await fetchAncillaryAnalytics(startStr, endStr)

          const { prevStart, prevEnd } = computePrevWindow(firstDate, lastDate)
          const prevStartStr = toISODate(prevStart)
          const prevEndStr = toISODate(prevEnd)
          const [prevRev, prevUsr, prevProd, prevApiu] = await Promise.all([
            fetchSeries('revenue', prevStartStr, prevEndStr),
            fetchSeries('users', prevStartStr, prevEndStr),
            fetchSeries('products', prevStartStr, prevEndStr),
            fetchSeries('api_calls', prevStartStr, prevEndStr),
          ])
          setPrevRevenueSeries(prevRev); setPrevUsersSeries(prevUsr); setPrevProductsSeries(prevProd); setPrevApiSeries(prevApiu)
        } else {
          setPrevRevenueSeries([]); setPrevUsersSeries([]); setPrevProductsSeries([]); setPrevApiSeries([])
          await fetchAncillaryAnalytics()
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to load analytics data', e)
      setRevenueSeries([]); setUsersSeries([]); setProductsSeries([]); setApiSeries([])
      setPrevRevenueSeries([]); setPrevUsersSeries([]); setPrevProductsSeries([]); setPrevApiSeries([])
      setPlanDistribution([]); setUserGrowth([]); setApiUsageByPlan([]); setSystemHealth(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useCustomRange, period, dateRange.from, dateRange.to])

  // Compute KPI card values and growth
  const revenueCurrent = sumSeries(revenueSeries)
  const revenuePrev = sumSeries(prevRevenueSeries)
  const revenueGrowth = computeGrowth(revenueCurrent, revenuePrev)

  const usersCurrent = sumSeries(usersSeries)
  const usersPrev = sumSeries(prevUsersSeries)
  const usersGrowth = computeGrowth(usersCurrent, usersPrev)

  const productsCurrent = sumSeries(productsSeries)
  const productsPrev = sumSeries(prevProductsSeries)
  const productsGrowth = computeGrowth(productsCurrent, productsPrev)

  const apiCurrent = sumSeries(apiSeries)
  const apiPrev = sumSeries(prevApiSeries)
  const apiGrowth = computeGrowth(apiCurrent, apiPrev)

  const periodLabel = 'vs previous period'

  // Feature usage fetched from backend; falls back to empty list
  const [featureUsage, setFeatureUsage] = useState<Array<{ feature: string; usage: number; trend: string }>>([])
  const defaultFeatures = [
    'Product Creation',
    'Label Generator',
    'QR Code Generator',
    'Nutrition Analysis',
    'Recipe Search',
    'Category Management'
  ]
  const displayedFeatureUsage = useMemo(() => defaultFeatures.map(name => {
    const f = featureUsage.find(item => item.feature === name)
    return {
      feature: name,
      usage: typeof f?.usage === 'number' ? f.usage : 0,
      trend: typeof f?.trend === 'string' && f.trend.length > 0 ? f.trend : '0.0%'
    }
  }), [featureUsage])

  const badgeClass = (status?: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const exportReport = async () => {
    try {
      const usingCustom = !!(dateRange.from && dateRange.to)
      const startDate = usingCustom ? dateRange.from! : (revenueSeries[0] ? new Date(revenueSeries[0].date) : new Date())
      const endDate = usingCustom ? dateRange.to! : (revenueSeries[revenueSeries.length - 1] ? new Date(revenueSeries[revenueSeries.length - 1].date) : new Date())
      const rangeLabel = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`

      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const marginX = 15
      const marginY = 15
      const contentWidth = pageWidth - marginX * 2
      let cursorY = marginY

      const setFont = (size = 10, style: 'normal' | 'bold' = 'normal') => {
        doc.setFont('helvetica', style === 'bold' ? 'bold' : 'normal')
        doc.setFontSize(size)
      }
      const hr = (y: number) => doc.line(marginX, y, pageWidth - marginX, y)
      const addFooter = () => {
        setFont(9, 'normal')
        doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - marginX, pageHeight - 7, { align: 'right' })
      }
      const addHeader = () => {
        setFont(16, 'bold')
        doc.text('Analytics Report', marginX, cursorY)
        setFont(10, 'normal')
        doc.text(rangeLabel, marginX, cursorY + 6)
        doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - marginX, cursorY + 6, { align: 'right' })
        cursorY += 12
        hr(cursorY)
        cursorY += 6
      }
      const ensureSpace = (needed: number) => {
        if (cursorY + needed > pageHeight - marginY) {
          addFooter()
          doc.addPage()
          cursorY = marginY
        }
      }

      const drawKPIBlock = () => {
        const blockH = 24
        const gap = 4
        const cols = 4
        const boxW = (contentWidth - gap * (cols - 1)) / cols
        const kpis = [
          { title: 'MRR', value: formatCurrency(revenueCurrent), change: revenueGrowth.change, up: revenueGrowth.trend === 'up' },
          { title: 'Active Users', value: usersCurrent.toLocaleString(), change: usersGrowth.change, up: usersGrowth.trend === 'up' },
          { title: 'Products Created', value: productsCurrent.toLocaleString(), change: productsGrowth.change, up: productsGrowth.trend === 'up' },
          { title: 'API Calls', value: apiCurrent.toLocaleString(), change: apiGrowth.change, up: apiGrowth.trend === 'up' },
        ]
        ensureSpace(blockH + 8)
        setFont(12, 'bold'); doc.text('Executive Summary', marginX, cursorY)
        cursorY += 6
        for (let i = 0; i < kpis.length; i++) {
          const x = marginX + i * (boxW + gap)
          doc.setDrawColor(229, 231, 235)
          doc.setLineWidth(0.2)
          doc.rect(x, cursorY, boxW, blockH)
          setFont(9, 'normal'); doc.text(kpis[i].title, x + 3, cursorY + 6)
          setFont(12, 'bold'); doc.text(kpis[i].value, x + 3, cursorY + 12)
          setFont(9, 'normal');
          doc.setTextColor(kpis[i].up ? 22 : 220, kpis[i].up ? 163 : 38, kpis[i].up ? 74 : 38)
          doc.text(kpis[i].change, x + 3, cursorY + 18)
          doc.setTextColor(0, 0, 0)
        }
        cursorY += blockH + 6
      }

      type Col = { header: string, width: number, align?: 'left' | 'right' | 'center' }
      const drawTable = (title: string, columns: Col[], rows: (string | number)[][]) => {
        const rowH = 6
        const headerH = 7
        const titleH = 6
        ensureSpace(titleH + headerH + rowH)
        setFont(12, 'bold'); doc.text(title, marginX, cursorY)
        cursorY += 5
        // Header
        doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.2)
        let x = marginX
        setFont(9, 'bold')
        columns.forEach(col => {
          doc.rect(x, cursorY, col.width, headerH)
          doc.text(col.header, x + 2, cursorY + 4)
          x += col.width
        })
        cursorY += headerH
        // Rows
        setFont(9, 'normal')
        rows.forEach(r => {
          ensureSpace(rowH)
          let cx = marginX
          for (let i = 0; i < columns.length; i++) {
            doc.rect(cx, cursorY, columns[i].width, rowH)
            const txt = String(r[i] ?? '')
            let tx = cx + 2
            if (columns[i].align === 'right') tx = cx + columns[i].width - 2
            if (columns[i].align === 'center') tx = cx + columns[i].width / 2
            const opts: any = {}
            if (columns[i].align === 'right') opts.align = 'right'
            if (columns[i].align === 'center') opts.align = 'center'
            doc.text(txt, tx, cursorY + 4, opts)
            cx += columns[i].width
          }
          cursorY += rowH
        })
        cursorY += 4
      }

      // Compose PDF
      addHeader()
      drawKPIBlock()

      // Feature Usage
      const fuCols: Col[] = [
        { header: 'Feature', width: contentWidth * 0.5 },
        { header: 'Usage %', width: contentWidth * 0.25, align: 'right' },
        { header: 'Trend', width: contentWidth * 0.25, align: 'right' },
      ]
      const fuRows = displayedFeatureUsage.map(f => [f.feature, `${f.usage}%`, f.trend])
      drawTable('Feature Usage', fuCols, fuRows)

      // Subscription Distribution
      const sdCols: Col[] = [
        { header: 'Plan', width: contentWidth * 0.35 },
        { header: 'Users', width: contentWidth * 0.2, align: 'right' },
        { header: '% Share', width: contentWidth * 0.2, align: 'right' },
        { header: 'Revenue', width: contentWidth * 0.25, align: 'right' },
      ]
      const sdRows = planDistribution.map(p => [p.plan, p.count.toLocaleString(), `${p.percentage}%`, formatCurrency(p.revenue)])
      drawTable('Subscription Distribution', sdCols, sdRows)

      // API Usage by Plan
      const apCols: Col[] = [
        { header: 'Plan', width: contentWidth * 0.5 },
        { header: 'Calls', width: contentWidth * 0.25, align: 'right' },
        { header: 'Share', width: contentWidth * 0.25, align: 'right' },
      ]
      const apRows = apiUsageByPlan.map(r => [r.plan, r.count.toLocaleString(), `${r.percentage}%`])
      drawTable('API Usage by Plan', apCols, apRows)

      // User Growth
      const ugCols: Col[] = [
        { header: 'Period', width: contentWidth * 0.4 },
        { header: 'New', width: contentWidth * 0.2, align: 'right' },
        { header: 'Churned', width: contentWidth * 0.2, align: 'right' },
        { header: 'Net', width: contentWidth * 0.2, align: 'right' },
      ]
      const ugRows = userGrowth.map(p => [p.period, `+${p.new.toLocaleString()}`, `-${p.churned.toLocaleString()}`, `${p.net >= 0 ? '+' : ''}${p.net.toLocaleString()}`])
      drawTable('User Growth', ugCols, ugRows)

      // System Health
      const shCols: Col[] = [
        { header: 'Metric', width: contentWidth * 0.6 },
        { header: 'Value', width: contentWidth * 0.4 },
      ]
      const sh = systemHealth
      const shRows = [
        ['API Response Time', sh?.api_response_time?.value ?? '—'],
        ['Uptime (30d)', sh?.server_uptime?.value ?? '—'],
        ['Error Rate', sh?.error_rate?.value ?? '—'],
        ['Database', sh?.database_status?.value ?? '—'],
      ]
      drawTable('System Health', shCols, shRows)

      // Footer and save
      addFooter()
      const filename = `analytics_report_${startDate.toISOString().slice(0,10)}_${endDate.toISOString().slice(0,10)}.pdf`
      doc.save(filename)
    } catch (e) {
      console.error('Export report failed', e)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into platform performance and user behavior
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Custom Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from && dateRange.to
                  ? `${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}`
                  : 'Custom Range'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 space-y-3">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={(range: any) => setDateRange(range || { from: undefined, to: undefined })}
                  numberOfMonths={2}
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Button variant={period === '7d' ? 'default' : 'outline'} size="sm" onClick={() => { setPeriod('7d'); setDateRange({ from: undefined, to: undefined }) }}>7d</Button>
                    <Button variant={period === '30d' ? 'default' : 'outline'} size="sm" onClick={() => { setPeriod('30d'); setDateRange({ from: undefined, to: undefined }) }}>30d</Button>
                    <Button variant={period === '90d' ? 'default' : 'outline'} size="sm" onClick={() => { setPeriod('90d'); setDateRange({ from: undefined, to: undefined }) }}>90d</Button>
                    <Button variant={period === '1y' ? 'default' : 'outline'} size="sm" onClick={() => { setPeriod('1y'); setDateRange({ from: undefined, to: undefined }) }}>1y</Button>
                  </div>
                  <Button size="sm" onClick={() => refreshData()}>Apply</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button size="sm" onClick={exportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(revenueCurrent)}
          change={revenueGrowth.change}
          trend={revenueGrowth.trend}
          icon={DollarSign}
          color="purple"
          period={periodLabel}
        />
        <AdminStatsCard
          title="Active Users"
          value={usersCurrent.toLocaleString()}
          change={usersGrowth.change}
          trend={usersGrowth.trend}
          icon={UsersIcon}
          color="blue"
          period={periodLabel}
        />
        <AdminStatsCard
          title="Products Created"
          value={productsCurrent.toLocaleString()}
          change={productsGrowth.change}
          trend={productsGrowth.trend}
          icon={PackageIcon}
          color="green"
          period={periodLabel}
        />
        <AdminStatsCard
          title="API Calls (30d)"
          value={apiCurrent.toLocaleString()}
          change={apiGrowth.change}
          trend={apiGrowth.trend}
          icon={ActivityIcon}
          color="orange"
          period={periodLabel}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue & User Growth Chart */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Revenue & User Growth Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminChart data={chartData} />
          </CardContent>
        </Card>

        {/* Subscription Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {planDistribution.map((plan) => (
                <div key={plan.plan} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{plan.plan}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{plan.count.toLocaleString()} users</Badge>
                      <span className="text-sm text-muted-foreground">
                        {plan.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2"
                        style={{ width: `${Math.min(100, Math.max(0, plan.percentage))}%` }}
                      />
                    </div>
                    <span className="ml-2 text-muted-foreground">
                      {formatCurrency(plan.revenue)}
                    </span>
                  </div>
                </div>
              ))}
              {planDistribution.length === 0 && (
                <div className="text-sm text-muted-foreground">No data in selected range</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Growth Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userGrowth.map((p) => (
                <div key={p.period} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <div className="font-medium">{p.period}</div>
                    <div className="text-sm text-muted-foreground">
                      +{p.new.toLocaleString()} new, -{p.churned.toLocaleString()} churned
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${p.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {p.net >= 0 ? '+' : ''}{p.net.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">net growth</div>
                  </div>
                </div>
              ))}
              {userGrowth.length === 0 && (
                <div className="text-sm text-muted-foreground">No data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Feature Usage */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Feature Usage Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {displayedFeatureUsage.map((feature) => (
                <div key={feature.feature} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-1">
                    <div className="font-medium">{feature.feature}</div>
                    <div className="text-2xl font-bold">{feature.usage}%</div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={feature.trend.startsWith('+') ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {feature.trend}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">vs last month</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* API Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle>API Usage by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {apiUsageByPlan.map((row) => (
                <div key={row.plan} className="flex items-center justify-between">
                  <span className="text-sm">{row.plan}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div className="bg-blue-500 rounded-full h-2" style={{ width: `${Math.min(100, Math.max(0, row.percentage))}%` }} />
                    </div>
                    <span className="text-sm text-muted-foreground">{row.count.toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {apiUsageByPlan.length === 0 && (
                <div className="text-sm text-muted-foreground">No API usage in selected range</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Response Time</span>
                <Badge className={badgeClass(systemHealth?.api_response_time?.status)}>
                  {systemHealth?.api_response_time?.value ?? '—'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Uptime (30 days)</span>
                <Badge className={badgeClass(systemHealth?.server_uptime?.status)}>
                  {systemHealth?.server_uptime?.value ?? '—'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Error Rate</span>
                <Badge className={badgeClass(systemHealth?.error_rate?.status)}>
                  {systemHealth?.error_rate?.value ?? '—'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Performance</span>
                <Badge className={badgeClass(systemHealth?.database_status?.status)}>
                  {systemHealth?.database_status?.value ?? '—'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
