// components/new-group-form.tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createClient } from "@/utils/supabase/client"
import { useAuth } from "@/app/context/auth-context"

// Define the form schema using Zod
const formSchema = z.object({
  group_name: z.string().min(1, "Group name is required"),
  group_picture: z.instanceof(File).optional(),
  members: z.array(z.string()).min(1, "At least one member is required"),
})

interface NewGroupFormProps {
  users: { id: string; full_name: string }[]
  onSuccess: () => void
}

export function NewGroupForm({ users, onSuccess }: NewGroupFormProps) {
  const supabase = createClient()
  const { user } = useAuth()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      group_name: "",
      members: [],
    },
  })

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const { group_name, group_picture, members } = data
  
      // Upload group picture if provided
      let groupPictureUrl = null
      if (group_picture) {
        const fileExt = group_picture.name.split(".").pop()
        const filePath = `${user?.id}-${Math.random()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from("group")
          .upload(filePath, group_picture)
  
        if (uploadError) {
          console.error("Error uploading group picture:", uploadError)
          throw uploadError
        }
        groupPictureUrl = filePath
      }
  
      // Insert group into the `groups` table
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .insert({
          group_name,
          group_picture: groupPictureUrl,
          no_members: members.length + 1, // Owner + selected members
          owner: user?.id,
        })
        .select()
        .single()
  
      if (groupError) {
        console.error("Error inserting group:", groupError)
        throw groupError
      }
  
      // Insert members into the `groupMembers` table
      const { error: membersError } = await supabase
        .from("groupMembers")
        .insert(members.map((memberId) => ({
          group_id: groupData.id,
          group_member: memberId,
        })))
  
      if (membersError) {
        console.error("Error inserting group members:", membersError)
        throw membersError
      }
  
      toast.success("Group created successfully")
      onSuccess()
      form.reset()
    } catch (error) {
      console.error("Error creating group:", error)
      toast.error("Failed to create group")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-lg">
        <FormField
          control={form.control}
          name="group_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter group name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="group_picture"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Picture</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => field.onChange(e.target.files?.[0])}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="members"
          render={() => (
            <FormItem>
              <FormLabel>Select Members</FormLabel>
              <div className="space-y-2">
                {users.map((user) => (
                  <FormField
                    key={user.id}
                    control={form.control}
                    name="members"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(user.id)}
                            onCheckedChange={(checked) => {
                              const newValue = checked
                                ? [...(field.value || []), user.id]
                                : field.value?.filter((id) => id !== user.id)
                              field.onChange(newValue)
                            }}
                          />
                        </FormControl>
                        <FormLabel>{user.full_name}</FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Create Group</Button>
      </form>
    </Form>
  )
}