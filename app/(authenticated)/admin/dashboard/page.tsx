'use client'

import { useRole } from '@/hooks/useRole'
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Group, Map } from 'lucide-react'
import { toast } from "sonner"

type TimePeriod = 'day' | 'week' | 'month' | 'year'

interface Stats {
  users: number
  groups: number
  laags: {
    Planned: number
    Completed: number
    Cancelled: number
  }
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
    }
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

        setStats({
          users: Number(userData) || 0,
          groups: Number(groupData) || 0,
          laags: laagCounts
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
        toast.error('Failed to fetch dashboard statistics. Please ensure the database functions are properly set up.')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [timePeriod, supabase])

  if (roleLoading) {
    return (
      <div className="container py-6">
        <div className="h-[400px] flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (role !== 'admin') {
    redirect('/user/feed')
  }

  return (
    <div className="container py-6">
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
    </div>
  )
}

export default Dashboard