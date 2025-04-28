'use client'

import { useRole } from '@/hooks/useRole'
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Group, Map } from 'lucide-react'
import { toast } from "sonner"
import { ResponsiveBar } from '@nivo/bar'
import { NotificationHistory } from '@/components/admin/notification-history'

type TimePeriod = 'day' | 'week' | 'month' | 'year'

interface GroupLaagStats {
  group_name: string
  planned_count: number
  completed_count: number
  cancelled_count: number
}

interface Stats {
  users: number
  groups: number
  laags: {
    Planned: number
    Completed: number
    Cancelled: number
  }
  groupLaags: GroupLaagStats[]
}

const Dashboard = () => {
  const { role, loading: roleLoading } = useRole()
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month')
  const [stats, setStats] = useState<Stats>({
    users: 0,
    groups: 0,
    laags: {
      Planned: 0,
      Completed: 0,
      Cancelled: 0
    },
    groupLaags: []
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        
        // Fetch user counts
        const { data: userData, error: userError } = await supabase
          .rpc('get_user_counts', { time_period: timePeriod })
        if (userError) {
          console.error('User count error:', userError)
          throw userError
        }

        // Fetch group counts
        const { data: groupData, error: groupError } = await supabase
          .rpc('get_group_counts', { time_period: timePeriod })
        if (groupError) {
          console.error('Group count error:', groupError)
          throw groupError
        }

        // Fetch laag counts
        const { data: laagData, error: laagError } = await supabase
          .rpc('get_laag_counts', { time_period: timePeriod })
        if (laagError) {
          console.error('Laag count error:', laagError)
          throw laagError
        }

        // Transform laag data into the required format
        const laagCounts = {
          Planned: 0,
          Completed: 0,
          Cancelled: 0
        }
        
        if (Array.isArray(laagData)) {
          laagData.forEach((item: { status: keyof typeof laagCounts; count: number }) => {
            if (item.status in laagCounts) {
              laagCounts[item.status] = Number(item.count)
            }
          })
        }

        // Fetch group laag stats
        const { data: groupLaagData, error: groupLaagError } = await supabase
          .rpc('get_group_laag_stats', { time_period: timePeriod })
        if (groupLaagError) {
          console.error('Group laag stats error:', groupLaagError)
          throw groupLaagError
        }

        setStats({
          users: Number(userData) || 0,
          groups: Number(groupData) || 0,
          laags: laagCounts,
          groupLaags: groupLaagData || []
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
        toast.error('Failed to fetch dashboard statistics.')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [timePeriod, supabase])

  return (
    <><div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Select value={timePeriod} onValueChange={(value: TimePeriod) => setTimePeriod(value)}>
          <SelectTrigger className="w-[180px]">
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

      <div className="grid gap-4 md:grid-cols-3">
        {/* Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.users}</div>
          </CardContent>
        </Card>

        {/* Groups Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Groups</CardTitle>
            <Group className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.groups}</div>
          </CardContent>
        </Card>

        {/* Laags Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Laags</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold">
                {loading ? '...' : Object.values(stats.laags).reduce((a, b) => a + b, 0)}
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Planned: {loading ? '...' : stats.laags.Planned}</div>
                <div>Completed: {loading ? '...' : stats.laags.Completed}</div>
                <div>Cancelled: {loading ? '...' : stats.laags.Cancelled}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div><div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Laags by Group</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="h-[400px]">
                <ResponsiveBar
                  data={stats.groupLaags}
                  keys={['planned_count', 'completed_count', 'cancelled_count']}
                  indexBy="group_name"
                  margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                  padding={0.3}
                  valueScale={{ type: 'linear' }}
                  indexScale={{ type: 'band', round: true }}
                  colors={['#3b82f6', '#22c55e', '#ef4444']}
                  borderColor={{
                    from: 'color',
                    modifiers: [['darker', 1.6]]
                  }}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                    legend: 'Groups',
                    legendPosition: 'middle',
                    legendOffset: 40
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'Count',
                    legendPosition: 'middle',
                    legendOffset: -40
                  }}
                  labelSkipWidth={12}
                  labelSkipHeight={12}
                  legends={[
                    {
                      dataFrom: 'keys',
                      anchor: 'bottom-right',
                      direction: 'column',
                      justify: false,
                      translateX: 120,
                      translateY: 0,
                      itemsSpacing: 2,
                      itemWidth: 100,
                      itemHeight: 20,
                      itemDirection: 'left-to-right',
                      itemOpacity: 0.85,
                      symbolSize: 20,
                      data: [
                        { id: 'planned_count', label: 'Planned' },
                        { id: 'completed_count', label: 'Completed' },
                        { id: 'cancelled_count', label: 'Cancelled' }
                      ]
                    }
                  ]} />
              </div>
            )}
          </CardContent>
        </Card>
        <NotificationHistory />
      </div></>
  )
}

export default Dashboard