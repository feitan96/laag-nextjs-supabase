"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Trash2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAvatar } from "@/hooks/useAvatar"
import { format } from "date-fns"
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UserType {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  created_at: string
  role: string
  is_deleted: boolean
}

function UsersTable({ users, onDelete }: { users: UserType[]; onDelete: (id: string) => void }) {
  // Create a component for the user row to properly use hooks
  const UserRow = ({ user }: { user: UserType }) => {
    const userAvatarUrl = useAvatar(user.avatar_url || null)

    return (
      <div className="grid grid-cols-4 gap-4 p-4 items-center hover:bg-muted/50 transition-colors">
        <div>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userAvatarUrl || undefined} />
              <AvatarFallback>{user.full_name?.charAt(0) || <User className="h-4 w-4" />}</AvatarFallback>
            </Avatar>
            <span className="font-medium truncate">{user.full_name}</span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground truncate">{user.email}</div>
        <div className="text-sm text-muted-foreground">{format(new Date(user.created_at), "MMM d, yyyy")}</div>
        <div className="flex justify-end gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete User</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this user? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(user.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <div className="p-4 bg-muted/50">
        <div className="grid grid-cols-4 gap-4 font-medium text-sm">
          <div>User</div>
          <div>Email</div>
          <div>Joined Date</div>
          <div className="text-right">Actions</div>
        </div>
      </div>
      <div className="divide-y">
        {users.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No users found matching your criteria</div>
        ) : (
          users.map((user) => <UserRow key={user.id} user={user} />)
        )}
      </div>
    </div>
  )
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(7)

  const fetchUsers = async () => {
    try {
      const { data: currentUser } = await supabase.auth.getUser()

      // Get current user's role from profiles
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUser.user?.id)
        .single()

      if (userProfile?.role !== "admin") {
        throw new Error("Not authorized. Admin access required.")
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_deleted", false)
        .neq("role", "admin")
        .order("full_name", { ascending: true })

      if (error) throw error

      if (data) {
        setUsers(data as UserType[])
      } else {
        setUsers([])
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDeleteUser = async (userId: string) => {
    try {
      const { data: currentUser } = await supabase.auth.getUser()

      // Get current user's role from profiles
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUser.user?.id)
        .single()

      if (userProfile?.role !== "admin") {
        throw new Error("Not authorized. Admin access required.")
      }

      const { error } = await supabase.from("profiles").update({ is_deleted: true }).eq("id", userId)

      if (error) throw error

      toast.success("User deleted successfully")
      fetchUsers() // Refresh the list
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Failed to delete user")
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="container pt-0 pb-0">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">User Management</h1>
            <div className="relative w-64 h-10 bg-muted rounded-md" />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-6 w-24 bg-muted rounded" />
                <div className="flex items-center gap-2">
                  <div className="h-5 w-10 bg-muted rounded" />
                  <div className="h-8 w-[70px] bg-muted rounded" />
                  <div className="h-5 w-16 bg-muted rounded" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="p-4 bg-muted/50">
                  <div className="grid grid-cols-4 gap-4 font-medium text-sm">
                    <div>User</div>
                    <div>Email</div>
                    <div>Joined Date</div>
                    <div className="text-right">Actions</div>
                  </div>
                </div>
                <div className="divide-y">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 p-4 items-center">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted" />
                          <div className="h-5 w-32 bg-muted rounded" />
                        </div>
                      </div>
                      <div className="h-5 w-40 bg-muted rounded" />
                      <div className="h-5 w-24 bg-muted rounded" />
                      <div className="flex justify-end gap-2">
                        <div className="h-8 w-8 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container pt-0 pb-0">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">User Management</h1>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>All Users</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number.parseInt(value))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder="7" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">per page</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">No users found</div>
            ) : (
              <>
                <UsersTable
                  users={filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                  onDelete={handleDeleteUser}
                />

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min(filteredUsers.length, (currentPage - 1) * itemsPerPage + 1)} to{" "}
                    {Math.min(filteredUsers.length, currentPage * itemsPerPage)} of {filteredUsers.length} users
                  </div>

                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {Array.from({ length: Math.min(5, Math.ceil(filteredUsers.length / itemsPerPage)) }, (_, i) => {
                        const pageNumber = i + 1
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNumber)}
                              isActive={currentPage === pageNumber}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      })}

                      {Math.ceil(filteredUsers.length / itemsPerPage) > 5 && (
                        <>
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => setCurrentPage(Math.ceil(filteredUsers.length / itemsPerPage))}
                              isActive={currentPage === Math.ceil(filteredUsers.length / itemsPerPage)}
                            >
                              {Math.ceil(filteredUsers.length / itemsPerPage)}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage((p) => Math.min(Math.ceil(filteredUsers.length / itemsPerPage), p + 1))
                          }
                          className={
                            currentPage === Math.ceil(filteredUsers.length / itemsPerPage)
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
