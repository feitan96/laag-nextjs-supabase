"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AllGroupsTable } from "@/components/groups/group-table"

export default function GroupManagement() {
  return (
    <div className="container py-6">
      <Card>
        <CardHeader>
          <CardTitle>All Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <AllGroupsTable />
        </CardContent>
      </Card>
    </div>
  )
}