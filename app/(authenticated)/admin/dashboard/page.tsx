"use client"

import { useRole } from "@/hooks/useRole"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Group, Map, BarChart3, ArrowUpRight } from "lucide-react"
import { toast } from "sonner"
import { NotificationHistory } from "@/components/admin/notification-history"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

type TimePeriod = "day" | "week" | "month" | "year"

interface GroupLaagStats {
  group_name: string
  planning_count: number
  completed_count: number
  cancelled_count: number
}

interface Stats {
  users: number
  groups: number
  laags: {
    Planning: number
    Completed: number
    Cancelled: number
  }
  groupLaags: GroupLaagStats[]
}

const Dashboard = () => {
  const { role, loading: roleLoading } = useRole()
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month")
  const [stats, setStats] = useState<Stats>({
    users: 0,
    groups: 0,
    laags: {
      Planning: 0,
      Completed: 0,
      Cancelled: 0,
    },
    groupLaags: [],
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)

        // Fetch user counts
        const { data: userData, error: userError } = await supabase.rpc("get_user_counts", { time_period: timePeriod })
        if (userError) {
          console.error("User count error:", userError)
          throw userError
        }

        // Fetch group counts
        const { data: groupData, error: groupError } = await supabase.rpc("get_group_counts", {
          time_period: timePeriod,
        })
        if (groupError) {
          console.error("Group count error:", groupError)
          throw groupError
        }

        // Fetch laag counts
        const { data: laagData, error: laagError } = await supabase.rpc("get_laag_counts", { time_period: timePeriod })
        if (laagError) {
          console.error("Laag count error:", laagError)
          throw laagError
        }

        // Transform laag data into the required format
        const laagCounts = {
          Planning: 0,
          Completed: 0,
          Cancelled: 0,
        }

        if (Array.isArray(laagData)) {
          laagData.forEach((item: { status: keyof typeof laagCounts; count: number }) => {
            if (item.status === "Planning") {
              laagCounts["Planning"] = Number(item.count)
            } else {
              laagCounts[item.status] = Number(item.count)
            }
          })
        }

        // Fetch group laag stats
        const { data: groupLaagData, error: groupLaagError } = await supabase.rpc("get_group_laag_stats", {
          time_period: timePeriod,
        })
        if (groupLaagError) {
          console.error("Group laag stats error:", groupLaagError)
          throw groupLaagError
        }
        console.log("Group Laag Data:", groupLaagData)

        setStats({
          users: Number(userData) || 0,
          groups: Number(groupData) || 0,
          laags: laagCounts,
          groupLaags: groupLaagData || [],
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
        toast.error("Failed to fetch dashboard statistics.")
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchStats()

    // Set up real-time subscription
    const laagSubscription = supabase
      .channel('laags-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'laags'
        },
        () => {
          // Refetch stats when laags table changes
          fetchStats()
        }
      )
      .subscribe()

    // Cleanup subscription
    return () => {
      laagSubscription.unsubscribe()
    }
  }, [timePeriod, supabase])

  // Transform data for shadcn chart
  const chartData = stats.groupLaags.map((group: any) => ({
    name: group.group_name,
    planning: group.planned_count || group.planning_count || 0, 
    completed: group.completed_count,
    cancelled: group.cancelled_count,
  }))

  // Chart configuration using the existing chart colors
  const chartConfig = {
    planning: {
      label: "Planning",
      color: "var(--color-chart-1)",
    },
    completed: {
      label: "Completed",
      color: "var(--color-chart-2)",
    },
    cancelled: {
      label: "Cancelled",
      color: "var(--color-destructive)",
    },
  } satisfies ChartConfig

  // Add role check at the beginning of the component
  if (roleLoading) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (role !== "admin") {
    return null // or redirect to another page
  }

  const getTimePeriodLabel = () => {
    switch (timePeriod) {
      case "day":
        return "Today"
      case "week":
        return "This Week"
      case "month":
        return "This Month"
      case "year":
        return "This Year"
      default:
        return "This Month"
    }
  }

  return (
    <div className="container">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of platform activity and statistics</p>
        </div>
        <Select value={timePeriod} onValueChange={(value: TimePeriod) => setTimePeriod(value)}>
          <SelectTrigger className="w-[180px] bg-card border-border">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Users Card */}
        <Card className="overflow-hidden border-border bg-card shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">New Users</CardTitle>
              <div className="rounded-full bg-chart-1/10 p-2">
                <Users className="h-4 w-4 text-chart-1" />
              </div>
            </div>
            <CardDescription>Total new registrations</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold">{stats.users}</div>
                <div className="flex items-center text-xs text-chart-2 mb-1">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  <span>12%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Groups Card */}
        <Card className="overflow-hidden border-border bg-card shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">New Groups</CardTitle>
              <div className="rounded-full bg-chart-4/10 p-2">
                <Group className="h-4 w-4 text-chart-4" />
              </div>
            </div>
            <CardDescription>Total new groups created</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <Skeleton className="h-12 w-24" />
            ) : (
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold">{stats.groups}</div>
                <div className="flex items-center text-xs text-chart-2 mb-1">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  <span>8%</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Laags Card */}
        <Card className="overflow-hidden border-border bg-card shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">New Laags</CardTitle>
              <div className="rounded-full bg-chart-5/10 p-2">
                <Map className="h-4 w-4 text-chart-5" />
              </div>
            </div>
            <CardDescription>Total new activities</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-end gap-2">
                  <div className="text-3xl font-bold">{Object.values(stats.laags).reduce((a, b) => a + b, 0)}</div>
                  <div className="flex items-center text-xs text-chart-2 mb-1">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    <span>15%</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-md bg-chart-1/10 px-2 py-1.5 flex flex-col">
                    <span className="font-medium text-chart-1">Planning</span>
                    <span className="text-sm mt-0.5">{stats.laags.Planning}</span>
                  </div>
                  <div className="rounded-md bg-chart-2/10 px-2 py-1.5 flex flex-col">
                    <span className="font-medium text-chart-2">Completed</span>
                    <span className="text-sm mt-0.5">{stats.laags.Completed}</span>
                  </div>
                  <div className="rounded-md bg-destructive/10 px-2 py-1.5 flex flex-col">
                    <span className="font-medium text-destructive">Cancelled</span>
                    <span className="text-sm mt-0.5">{stats.laags.Cancelled}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden border-border bg-card shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle>Laags by Group</CardTitle>
            </div>
            <CardDescription>Distribution of activities across groups {getTimePeriodLabel()}</CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            {loading ? (
              <div className="h-[350px] flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="h-[350px] px-2">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={{ stroke: "var(--color-border)" }}
                        tick={{ fill: "var(--color-muted-foreground)" }}
                        tickFormatter={(value) => (value.length > 15 ? `${value.substring(0, 15)}...` : value)}
                      />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--color-muted-foreground)" }} />
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="planning" stackId="a" fill="var(--color-chart-1)" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="completed" stackId="a" fill="var(--color-chart-2)" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="cancelled" stackId="a" fill="var(--color-destructive)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            )}
          </CardContent>
          {/* <CardFooter className="flex-col items-start gap-2 text-sm border-t border-border pt-4 mt-2">
            <div className="flex gap-2 font-medium leading-none">
              <TrendingUp className="h-4 w-4 text-chart-2" />
              Activity increased by 18% {getTimePeriodLabel().toLowerCase()}
            </div>
            <div className="leading-none text-muted-foreground">
              Most active group:{" "}
              {chartData.length > 0
                ? chartData.reduce((prev, current) => {
                    const prevTotal = prev.planning + prev.completed + prev.cancelled
                    const currentTotal = current.planning + current.completed + current.cancelled
                    return prevTotal > currentTotal ? prev : current
                  }).name
                : "None"}
            </div>
          </CardFooter> */}
        </Card>
        <NotificationHistory />
      </div>
    </div>
  )
}

export default Dashboard
