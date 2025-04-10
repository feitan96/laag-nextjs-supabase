import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function FeedLoading() {
  return (
    <div className="h-screen overflow-hidden">
      <div className="container px-0 md:px-4 py-6 h-full">
        <div className="grid grid-cols-1 md:grid-cols-[300px_640px_300px] gap-6 h-full max-w-[1400px] mx-auto">
          {/* Left Profile Skeleton */}
          <div className="h-full hidden md:block">
            <div className="sticky top-6">
              <Card className="h-full">
                <CardHeader>
                  <Skeleton className="h-6 w-[120px]" />
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                  <Skeleton className="h-24 w-24 rounded-full" />
                  <Skeleton className="h-6 w-[150px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Center Content Skeleton */}
          <div className="space-y-6 w-[640px]">
            <Skeleton className="h-8 w-[200px]" />
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[180px]" />
                      <Skeleton className="h-3 w-[120px]" />
                    </div>
                  </div>
                </div>
                <div className="p-4 pt-0">
                  <Skeleton className="h-6 w-[70%] mb-3" />
                  <Skeleton className="h-4 w-[40%] mb-3" />
                  <Skeleton className="h-20 w-full mb-4" />
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <Skeleton className="h-16 rounded-lg" />
                    <Skeleton className="h-16 rounded-lg" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <Skeleton className="aspect-square rounded-md" />
                    <Skeleton className="aspect-square rounded-md" />
                  </div>
                </div>
                <div className="p-4 pt-0">
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-32 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Right Groups Skeleton */}
          <div className="h-full hidden md:block">
            <div className="sticky top-6">
              <Card className="h-full">
                <div className="p-4 border-b">
                  <Skeleton className="h-6 w-[120px]" />
                  <Skeleton className="h-4 w-[180px] mt-2" />
                </div>
                <div className="p-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border mb-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div>
                          <Skeleton className="h-5 w-[120px]" />
                          <Skeleton className="h-4 w-[100px] mt-1" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
