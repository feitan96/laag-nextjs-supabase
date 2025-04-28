"use client"

import { useRole } from "@/hooks/useRole"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Group, Map, BarChart3 } from "lucide-react"
import { toast } from "sonner"
import { NotificationHistory } from "@/components/admin/notification-history"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

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

    fetchStats()
  }, [timePeriod, supabase])

  // Transform data for shadcn chart
  const chartData = stats.groupLaags.map((group) => ({
    name: group.group_name,
    planning: group.planning_count,
    completed: group.completed_count,
    cancelled: group.cancelled_count,
  }))

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

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Admin Dashboard</h1>
        <Select value={timePeriod} onValueChange={(value: TimePeriod) => setTimePeriod(value)}>
          <SelectTrigger className="w-[180px] border-secondary/20 bg-secondary/10">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">This Day</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Users Card */}
        <Card className="overflow-hidden border-secondary/20 bg-card shadow-md">
          <CardHeader className="bg-secondary/10 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">New Users</CardTitle>
              <div className="rounded-full bg-background/50 p-2 shadow-sm">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </div>
            <CardDescription>Total new registrations</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="h-[52px] w-[80px] animate-pulse rounded-md bg-secondary/20"></div>
            ) : (
              <div className="text-3xl font-bold text-foreground">{stats.users}</div>
            )}
          </CardContent>
        </Card>

        {/* Groups Card */}
        <Card className="overflow-hidden border-secondary/20 bg-card shadow-md">
          <CardHeader className="bg-secondary/10 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">New Groups</CardTitle>
              <div className="rounded-full bg-background/50 p-2 shadow-sm">
                <Group className="h-4 w-4 text-primary" />
              </div>
            </div>
            <CardDescription>Total new groups created</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="h-[52px] w-[80px] animate-pulse rounded-md bg-secondary/20"></div>
            ) : (
              <div className="text-3xl font-bold text-foreground">{stats.groups}</div>
            )}
          </CardContent>
        </Card>

        {/* Laags Card */}
        <Card className="overflow-hidden border-secondary/20 bg-card shadow-md">
          <CardHeader className="bg-secondary/10 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">New Laags</CardTitle>
              <div className="rounded-full bg-background/50 p-2 shadow-sm">
                <Map className="h-4 w-4 text-primary" />
              </div>
            </div>
            <CardDescription>Total new activities</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-2">
                <div className="h-8 w-16 animate-pulse rounded-md bg-secondary/20"></div>
                <div className="space-y-1">
                  <div className="h-3 w-24 animate-pulse rounded-md bg-secondary/20"></div>
                  <div className="h-3 w-24 animate-pulse rounded-md bg-secondary/20"></div>
                  <div className="h-3 w-24 animate-pulse rounded-md bg-secondary/20"></div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-3xl font-bold text-foreground">
                  {Object.values(stats.laags).reduce((a, b) => a + b, 0)}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-md bg-chart-1/10 px-2 py-1">
                    <span className="font-medium text-chart-1">Planning:</span> {stats.laags.Planning}
                  </div>
                  <div className="rounded-md bg-chart-2/10 px-2 py-1">
                    <span className="font-medium text-chart-2">Completed:</span> {stats.laags.Completed}
                  </div>
                  <div className="rounded-md bg-destructive/10 px-2 py-1">
                    <span className="font-medium text-destructive">Cancelled:</span> {stats.laags.Cancelled}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden border-secondary/20 bg-card shadow-md">
          <CardHeader className="bg-secondary/10 pb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle>Laags by Group</CardTitle>
            </div>
            <CardDescription>Distribution of activities across groups</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="h-[400px]">
                <ChartContainer
                  config={{
                    planning: {
                      label: "Planning",
                      color: "hsl(var(--chart-1))",
                    },
                    completed: {
                      label: "Completed",
                      color: "hsl(var(--chart-2))",
                    },
                    cancelled: {
                      label: "Cancelled",
                      color: "hsl(var(--destructive))",
                    },
                  }}
                  className="h-full w-full"
                >
                  <BarChart
                    accessibilityLayer
                    data={chartData}
                    margin={{ top: 30, right: 30, bottom: 60, left: 40 }}
                    layout="vertical"
                  >
                    <XAxis
                      type="number"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      tickLine={{ stroke: "hsl(var(--border))" }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Bar dataKey="planning" stackId="stack" fill="var(--color-planning)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="completed" stackId="stack" fill="var(--color-completed)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="cancelled" stackId="stack" fill="var(--color-cancelled)" radius={[0, 0, 0, 0]} />
                    <ChartTooltip content={<ChartTooltipContent className="bg-background/95 backdrop-blur-sm" />} />
                  </BarChart>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>
        <NotificationHistory />
      </div>
    </div>
  )
}

export default Dashboard
