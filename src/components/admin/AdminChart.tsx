import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

interface AdminChartProps {
  data: Array<{
    month: string
    revenue: number
    users: number
  }>
}

export function AdminChart({ data }: AdminChartProps) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            className="text-muted-foreground"
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            className="text-muted-foreground"
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px"
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="users" 
            stroke="hsl(var(--muted-foreground))" 
            strokeWidth={2}
            dot={{ fill: "hsl(var(--muted-foreground))", strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}