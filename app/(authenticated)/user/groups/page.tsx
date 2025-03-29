import { SidebarTrigger } from "@/components/ui/sidebar"
import { GroupTable } from "../../../../components/groups/group-table"

export default function GroupsPage() {
  return (
    <>
      <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
        <SidebarTrigger className="h-8 w-8" />
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-xl font-semibold">Groups</h1>
        </div>
      </header>
      <main className="flex-1 p-6">
        <div className="rounded-lg border bg-card">
          <GroupTable />
        </div>
      </main>
    </>
  )
}

