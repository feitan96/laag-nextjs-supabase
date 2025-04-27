"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, PieChart, Pie, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { createClient } from "@/utils/supabase/client"
import { LaagLeaderboard } from "@/components/laags/laag-leaderboard"

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--muted))"
]

const GroupAnalytics = ({ groupId }: { groupId: string }) => {
  const [timePeriod, setTimePeriod] = useState("all-time")
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
          supabase.rpc('get_group_activity_counts', {
            p_group_id: groupId,
            p_period: timePeriod
          }),
          supabase.rpc('get_group_spending_trends', {
            p_group_id: groupId,
            p_period: timePeriod
          }),
          supabase.rpc('get_group_laag_types', {
            p_group_id: groupId
          }),
          supabase.rpc('get_group_laag_status', {
            p_group_id: groupId
          })
        ])

        if (activityResponse.error) throw activityResponse.error
        if (spendingResponse.error) throw spendingResponse.error
        if (typeResponse.error) throw typeResponse.error
        if (statusResponse.error) throw statusResponse.error

        const transformedActivityData = activityResponse.data.map(item => ({
          time: item.time_period,
          activities: parseInt(item.activity_count)
        }))

        const transformedSpendingData = spendingResponse.data.map(item => ({
          time: item.time_period,
          actual: parseFloat(item.actual_spending)
        }))

        const transformedTypeData = typeResponse.data.map(item => ({
          name: item.laag_type.charAt(0).toUpperCase() + item.laag_type.slice(1),
          value: parseInt(item.count)
        }))

        const transformedStatusData = statusResponse.data.map(item => ({
          name: item.status,
          value: parseInt(item.count)
        }))

        setStatusData(transformedStatusData)
        setTypeData(transformedTypeData)
        setChartData(transformedActivityData)
        setSpendingData(transformedSpendingData)
      } catch (error) {
        const errorMessage = error.message || 'An error occurred while fetching analytics'
        console.error('Error fetching analytics:', errorMessage)
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
        <p className="text-muted-foreground">Loading analytics...</p>
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

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="space-y-6 max-w-[640px] mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Group Analytics</h2>
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

      <Card>
        <CardHeader>
          <CardTitle>Activity Overview</CardTitle>
          <CardDescription>
            Group activity trends over {timePeriod === "all-time" ? "all time" : `this ${timePeriod}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              activities: {
                label: "Activities",
                color: "hsl(var(--primary))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="activities"
                  stroke="var(--color-activities)"
                  fill="var(--color-activities)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spending Overview</CardTitle>
          <CardDescription>
            Group spending trends over {timePeriod === "all-time" ? "all time" : `this ${timePeriod}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              actual: {
                label: "Actual Cost",
                color: "hsl(var(--destructive))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendingData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="var(--color-actual)"
                  fill="var(--color-actual)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Add this after the Spending Overview card */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Types Distribution</CardTitle>
          <CardDescription>
            Distribution of different types of activities in the group
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1">
                              <div 
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: payload[0].payload.fill }}
                              />
                              <span className="font-medium">{payload[0].name}</span>
                            </div>
                            <div className="text-right font-medium">
                              {payload[0].value}
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {typeData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-muted-foreground">
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add this after the Activity Types Distribution card */}
      <Card>
        <CardHeader>
          <CardTitle>Laag Status Distribution</CardTitle>
          <CardDescription>
            Distribution of laags by their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1">
                              <div 
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: payload[0].payload.fill }}
                              />
                              <span className="font-medium">{payload[0].name}</span>
                            </div>
                            <div className="text-right font-medium">
                              {payload[0].value}
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {statusData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-muted-foreground">
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <LaagLeaderboard className="max-w-full" />
    </div>
  )
}

export default GroupAnalytics
