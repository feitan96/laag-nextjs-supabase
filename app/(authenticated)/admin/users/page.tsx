"use client"

import { useEffect, useState } from 'react'
import { createClient } from "@/utils/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Trash2, User } from "lucide-react"
import { useAvatar } from "@/hooks/useAvatar"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

function UserAvatar({ avatarUrl, fullName }: { avatarUrl: string | null; fullName: string }) {
  const userAvatarUrl = useAvatar(avatarUrl)
  return (
    <Avatar>
      <AvatarImage src={userAvatarUrl || undefined} />
      <AvatarFallback>{fullName?.charAt(0) || <User />}</AvatarFallback>
    </Avatar>
  )
}

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data: currentUser } = await supabase.auth.getUser()
      
      // Get current user's role from profiles
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.user?.id)
        .single()
  
      if (userProfile?.role !== 'admin') {
        throw new Error('Not authorized. Admin access required.')
      }
  
      const { data, error } = await supabase
        .from('profiles')
        .select()
        .eq('is_deleted', false)
        .order('full_name', { ascending: true })
  
      if (error) throw error
  
      if (data) {
        const { data: authUsers } = await supabase.auth.admin.listUsers()
        const userMap = new Map(authUsers?.users.map(user => [user.id, user.email]))
        
        setUsers(data.map(profile => ({
          ...profile,
          auth_email: userMap.get(profile.id)
        })))
      } else {
        setUsers([])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const { data: currentUser } = await supabase.auth.getUser()
      
      // Get current user's role from profiles
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.user?.id)
        .single()
  
      if (userProfile?.role !== 'admin') {
        throw new Error('Not authorized. Admin access required.')
      }
  
      const { error } = await supabase
        .from('profiles')
        .update({ is_deleted: true })
        .eq('id', userId)
  
      if (error) throw error
  
      toast.success('User deleted successfully')
      fetchUsers() // Refresh the list
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container py-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <UserAvatar avatarUrl={user.avatar_url} fullName={user.full_name} />
                  <div>
                    <h3 className="font-medium">{user.full_name}</h3>
                    <p className="text-sm text-muted-foreground">{user.auth_email}</p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will soft delete the user. The user will no longer be able to access the system.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}