"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { createClient } from "@/utils/supabase/client"
import { LaagLeaderboard } from "@/components/laags/laag-leaderboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar } from "recharts"
import { Activity, TrendingUp, Users, Calendar } from "lucide-react"

// Enhanced color palette for dark mode with better contrast
const CHART_COLORS = {
  primary: "#6366f1", // Indigo that pops in dark mode
  secondary: "#ec4899", // Pink
  tertiary: "#22c55e", // Green
  quaternary: "#f59e0b", // Amber
  quinary: "#06b6d4", // Cyan
}

// Pie chart colors with good contrast for dark mode
const PIE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.tertiary,
  CHART_COLORS.quaternary,
  CHART_COLORS.quinary,
  "#8b5cf6", // Purple
  "#ef4444", // Red
  "#3b82f6", // Blue
]

const GroupAnalytics = ({ groupId }: { groupId: string }) => {
  const [timePeriod, setTimePeriod] = useState("all-time")
  const [activeTab, setActiveTab] = useState("overview")
  const [chartData, setChartData] = useState([])
  const [spendingData, setSpendingData] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeData, setTypeData] = useState([])
  const [statusData, setStatusData] = useState([])
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null) // Reset error state before fetching
        const [activityResponse, spendingResponse, typeResponse, statusResponse] = await Promise.all([
          supabase.rpc("get_group_activity_counts", {
            p_group_id: groupId,
            p_period: timePeriod,
          }),
          supabase.rpc("get_group_spending_trends", {
            p_group_id: groupId,
            p_period: timePeriod,
          }),
          supabase.rpc("get_group_laag_types", {
            p_group_id: groupId,
          }),
          supabase.rpc("get_group_laag_status", {
            p_group_id: groupId,
          }),
        ])

        if (activityResponse.error) throw activityResponse.error
        if (spendingResponse.error) throw spendingResponse.error
        if (typeResponse.error) throw typeResponse.error
        if (statusResponse.error) throw statusResponse.error

        const transformedActivityData = activityResponse.data.map((item) => ({
          time: item.time_period,
          activities: Number.parseInt(item.activity_count),
        }))

        const transformedSpendingData = spendingResponse.data.map((item) => ({
          time: item.time_period,
          actual: Number.parseFloat(item.actual_spending),
        }))

        const transformedTypeData = typeResponse.data.map((item) => ({
          name: item.laag_type.charAt(0).toUpperCase() + item.laag_type.slice(1),
          value: Number.parseInt(item.count),
        }))

        const transformedStatusData = statusResponse.data.map((item) => ({
          name: item.status,
          value: Number.parseInt(item.count),
        }))

        setStatusData(transformedStatusData)
        setTypeData(transformedTypeData)
        setChartData(transformedActivityData)
        setSpendingData(transformedSpendingData)
      } catch (error) {
        const errorMessage = error.message || "An error occurred while fetching analytics"
        console.error("Error fetching analytics:", errorMessage)
        setError(errorMessage)
        setChartData([])
        setSpendingData([])
        setTypeData([])
        setStatusData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [groupId, timePeriod, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  // Custom label for the donut chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return percent > 0.05 ? (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontWeight="bold"
        fontSize="12"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null
  }

  // Custom tooltip for pie charts
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
              <span className="font-medium">{payload[0].name}</span>
            </div>
            <div className="text-right font-medium">
              {payload[0].value} ({(payload[0].percent * 100).toFixed(0)}%)
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6 max-w-[1024px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          Group Analytics
        </h2>
        <Select value={timePeriod} onValueChange={setTimePeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-time">All Time</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="today">Today</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Distribution</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Leaderboard</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Spending Overview Card - Moved to top */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-secondary/5 pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-secondary" />
                Spending Overview
              </CardTitle>
              <CardDescription>
                Group spending trends over {timePeriod === "all-time" ? "all time" : `this ${timePeriod}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ChartContainer
                config={{
                  actual: {
                    label: "Actual Cost",
                    color: CHART_COLORS.secondary,
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={spendingData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="time"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke={CHART_COLORS.secondary}
                      fill="url(#colorSpending)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Activity Overview Card */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-primary/5 pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Activity Overview
              </CardTitle>
              <CardDescription>
                Group activity trends over {timePeriod === "all-time" ? "all time" : `this ${timePeriod}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ChartContainer
                config={{
                  activities: {
                    label: "Activities",
                    color: CHART_COLORS.primary,
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorActivities" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="time"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="activities"
                      stroke={CHART_COLORS.primary}
                      fill="url(#colorActivities)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Combined Overview Card */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-tertiary/5 pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-tertiary" />
                Combined Overview
              </CardTitle>
              <CardDescription>
                Activity and spending comparison over {timePeriod === "all-time" ? "all time" : `this ${timePeriod}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ChartContainer
                config={{
                  activities: {
                    label: "Activities",
                    color: CHART_COLORS.primary,
                  },
                  spending: {
                    label: "Spending",
                    color: CHART_COLORS.secondary,
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData.map((item, index) => ({
                      ...item,
                      spending: spendingData[index]?.actual || 0,
                    }))}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="time"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      yAxisId="left"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      yAxisId="right"
                      orientation="right"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-1">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: CHART_COLORS.primary }}
                                  />
                                  <span className="font-medium">Activities</span>
                                </div>
                                <div className="text-right font-medium">{payload[0]?.value}</div>
                                <div className="flex items-center gap-1">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: CHART_COLORS.secondary }}
                                  />
                                  <span className="font-medium">Spending</span>
                                </div>
                                <div className="text-right font-medium">${payload[1]?.value?.toFixed(2)}</div>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend />
                    <Bar dataKey="activities" fill={CHART_COLORS.primary} yAxisId="left" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spending" fill={CHART_COLORS.secondary} yAxisId="right" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-quaternary/5 pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-quaternary" />
                  Activity Types
                </CardTitle>
                <CardDescription>Distribution of different types of activities in the group</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        innerRadius={60}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {typeData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                            stroke="rgba(0,0,0,0.3)"
                            strokeWidth={1}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {typeData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="text-sm">
                        {entry.name} <span className="text-muted-foreground">({entry.value})</span>
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-quinary/5 pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-quinary" />
                  Laag Status
                </CardTitle>
                <CardDescription>Distribution of laags by their current status</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        innerRadius={60}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {statusData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[(index + 3) % PIE_COLORS.length]}
                            stroke="rgba(0,0,0,0.3)"
                            strokeWidth={1}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {statusData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[(index + 3) % PIE_COLORS.length] }}
                      />
                      <span className="text-sm">
                        {entry.name} <span className="text-muted-foreground">({entry.value})</span>
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard">
          <LaagLeaderboard className="max-w-full" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default GroupAnalytics
