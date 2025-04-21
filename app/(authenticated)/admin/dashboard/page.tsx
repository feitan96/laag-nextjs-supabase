'use client'

import { useRole } from '@/hooks/useRole'
import { redirect } from 'next/navigation'

const Dashboard = () => {
  const { role, loading } = useRole()

  if (loading) {
    return <div>Loading...</div>
  }

  if (role !== 'admin') {
    redirect('/user/feed')
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      {/* Your dashboard content */}
    </div>
  )
}

export default Dashboard