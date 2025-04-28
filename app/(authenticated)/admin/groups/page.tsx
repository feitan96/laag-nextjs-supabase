"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AllGroupsTable } from "@/components/groups/group-table"

export default function GroupManagement() {
  return (
    <div className="container pt-0 pb-0">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Group Management</h1>
        </div>
        <Card>
          <CardContent>
            <AllGroupsTable />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
