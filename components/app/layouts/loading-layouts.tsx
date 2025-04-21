import { Skeleton } from "@/components/ui/skeleton"

export function AdminLoadingLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar Skeleton */}
      <div className="w-64 border-r p-4 space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
      
      {/* Main Content Skeleton */}
      <div className="flex-1 p-8 space-y-6">
        <Skeleton className="h-10 w-[250px]" />
        <div className="grid grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function UserLoadingLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Nav Skeleton */}
      <div className="border-b">
        <div className="flex h-16 items-center px-4 gap-6 max-w-7xl mx-auto">
          <Skeleton className="h-8 w-8" />
          <div className="flex-1 flex justify-between">
            <div className="flex gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-24" />
              ))}
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="flex flex-1 justify-center">
        <div className="w-full max-w-7xl p-6 space-y-6">
          <Skeleton className="h-10 w-[200px]" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}