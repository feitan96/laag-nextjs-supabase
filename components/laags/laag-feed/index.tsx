"use client"

import { useEffect, useState } from "react"
import { useLaags } from "@/hooks/useLaags"
import { LaagCard } from "./laag-card"
import { LaagFeedProps } from "@/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Search } from "lucide-react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"

type SortOption = "created_at-desc" | "created_at-asc" | "actual_cost-desc" | "actual_cost-asc"
type StatusFilter = "Planning" | "Completed" | "Cancelled" | "All"
type PrivacyFilter = "public" | "group-only" | "All"

export function LaagFeed({ groupId, laags: initialLaags, members: initialMembers }: LaagFeedProps) {
  // Use the hook only if groupId is provided
  const hookResult = useLaags(groupId)
  
  // Use either the hook results or the provided props
  const laags = groupId ? hookResult.laags : initialLaags
  const members = groupId ? hookResult.members : initialMembers
  const loading = groupId ? hookResult.loading : false
  const error = groupId ? hookResult.error : null
  const refetch = groupId ? hookResult.refetch : () => {}
  const [sortBy, setSortBy] = useState<SortOption>("created_at-desc")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All")
  const [privacyFilter, setPrivacyFilter] = useState<PrivacyFilter>("All")
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get("q")?.toLowerCase()

  useEffect(() => {
    refetch()
  }, [groupId, refetch])

  // Only show status and privacy filters for group feeds
  const showAllFilters = !!groupId

  const filteredLaags = laags
    ?.filter(laag => {
      // Apply search filter
      if (searchQuery) {
        const searchMatch = 
          laag.what.toLowerCase().includes(searchQuery) ||
          laag.where.toLowerCase().includes(searchQuery) ||
          laag.why?.toLowerCase().includes(searchQuery)
        if (!searchMatch) return false
      }
      // Only apply these filters in group context
      if (showAllFilters) {
        if (statusFilter !== "All" && laag.status !== statusFilter) return false
        if (privacyFilter !== "All" && laag.privacy !== privacyFilter) return false
      }
      return true
    })
    .sort((a, b) => {
      // Apply sorting
      switch (sortBy) {
        case "created_at-desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "created_at-asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "actual_cost-desc":
          return (b.actual_cost || 0) - (a.actual_cost || 0)
        case "actual_cost-asc":
          return (a.actual_cost || 0) - (b.actual_cost || 0)
        default:
          return 0
      }
    })

  const clearFilters = () => {
    setStatusFilter("All")
    setPrivacyFilter("All")
    // Note: We don't clear the search query here as it's managed by the nav-global component
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-48 bg-muted rounded-lg" />
            <div className="mt-4 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Error loading laags. Please try again later.</p>
      </div>
    )
  }

  if (!laags || laags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8">
        <div className="relative w-48 h-48 mb-4">
                    <Image
                      src="/no-group-laag.svg" // Make sure to add this SVG to your public folder
                      alt="No users available"
                      fill
                      className="object-contain"
                    />
                  </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No laags found. Be the first to create one!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at-desc">Newest first</SelectItem>
              <SelectItem value="created_at-asc">Oldest first</SelectItem>
              <SelectItem value="actual_cost-desc">Highest cost first</SelectItem>
              <SelectItem value="actual_cost-asc">Lowest cost first</SelectItem>
            </SelectContent>
          </Select>

          {showAllFilters && (
            <>
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All statuses</SelectItem>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={privacyFilter} onValueChange={(value: PrivacyFilter) => setPrivacyFilter(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by privacy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All privacy</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="group-only">Group only</SelectItem>
                </SelectContent>
              </Select>

              {(statusFilter !== "All" || privacyFilter !== "All") && (
                <Button variant="ghost" onClick={clearFilters} className="h-8 px-2">
                  <X className="h-4 w-4 mr-1" />
                  Clear filters
                </Button>
              )}
            </>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredLaags?.length} of {laags.length} laags
        </div>
      </div>

      {filteredLaags && filteredLaags.length > 0 ? (
        <div className="space-y-4">
          {filteredLaags.map((laag) => (
            <LaagCard key={laag.id} laag={laag} members={members} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="relative w-64 h-64">
            <Image
              src="/no-group-laag.svg" // Replace with your actual image path
              alt="No laags found"
              fill
              className="object-contain"
            />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">No laags match your filters</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or create a new laag
            </p>
          </div>
          <Button
            variant="outline"
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  )
}