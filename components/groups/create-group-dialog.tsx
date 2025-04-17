"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { v4 as uuidv4 } from "uuid"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, ChevronsUpDown, Loader2, Plus, Upload, User, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useAvatar } from "@/hooks/useAvatar"

// Define the form schema with Zod
const formSchema = z.object({
  group_name: z
    .string()
    .min(2, { message: "Group name must be at least 2 characters" })
    .max(50, { message: "Group name must be less than 50 characters" }),
  group_picture: z.any().optional(),
  members: z.array(z.string()).min(0),
})

type FormValues = z.infer<typeof formSchema>

interface Profile {
  id: string
  full_name: string
  avatar_url?: string | null
}

function MemberAvatar({ avatarUrl, fullName }: { avatarUrl: string | null, fullName: string }) {
  const memberAvatarUrl = useAvatar(avatarUrl)
  return (
    <Avatar className="h-8 w-8">
      <AvatarImage src={memberAvatarUrl || undefined} />
      <AvatarFallback>
        {fullName.charAt(0)}
      </AvatarFallback>
    </Avatar>
  )
}

export function NewGroupDialog({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [commandOpen, setCommandOpen] = useState(false)

  const supabase = createClient()

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      group_name: "",
      members: [],
    },
  })

  // Fetch profiles and current user
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          console.error("No authenticated user found")
          return
        }

        // Get current user's profile
        const { data: currentUserData, error: currentUserError } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("id", user.id)
          .single()

        if (currentUserError) {
          throw currentUserError
        }

        setCurrentUser(currentUserData)

        // Get all other profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .neq("id", user.id) // Exclude current user

        if (profilesError) {
          throw profilesError
        }

        setProfiles(profilesData || [])
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load user data")
      }
    }

    if (open) {
      fetchData()
    }
  }, [supabase, open])

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setUploadedImage(file)

      // Create a preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    if (!currentUser) {
      toast.error("You must be logged in to create a group")
      return
    }

    setLoading(true)

    // Inside onSubmit function
    try {
      const groupId = uuidv4()
      let groupPicturePath = null
    
      // Upload image if provided
      if (uploadedImage) {
        const fileExt = uploadedImage.name.split(".").pop()
        const filePath = `${groupId}.${fileExt}`
    
        const { error: uploadError } = await supabase.storage.from("group").upload(filePath, uploadedImage)
    
        if (uploadError) {
          throw uploadError
        }
    
        groupPicturePath = filePath
      }
    
      // Create the group first
      const { error: groupError } = await supabase.from("groups").insert({
        id: groupId,
        group_name: values.group_name,
        group_picture: groupPicturePath,
        no_members: values.members.length + 1, // +1 for the owner
        owner: currentUser.id,
      })
    
      if (groupError) {
        throw groupError
      }
    
      // Then add the owner as a group member
      const { error: ownerMemberError } = await supabase.from("groupMembers").insert({
        id: uuidv4(),
        group_id: groupId,
        group_member: currentUser.id,
        is_removed: false,
      })
    
      if (ownerMemberError) {
        throw ownerMemberError
      }
    
      // Finally add other group members if any
      if (values.members.length > 0) {
        const groupMembers = values.members.map((memberId) => ({
          id: uuidv4(),
          group_id: groupId,
          group_member: memberId,
          is_removed: false,
        }))
    
        const { error: membersError } = await supabase.from("groupMembers").insert(groupMembers)
    
        if (membersError) {
          throw membersError
        }
      }

      toast.success("Group created successfully")

      // Reset form and close dialog
      form.reset()
      setUploadedImage(null)
      setImagePreview(null)
      setOpen(false)

      // Refresh the page to show the new group
      window.location.reload()
    } catch (error) {
      console.error("Error creating group:", error)
      toast.error("Failed to create group")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className={className}>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>Create a new group and add members to collaborate with.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Group Picture Upload */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50 transition-all hover:border-gray-400">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Group preview"
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Users className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <label
                  htmlFor="group-picture-upload"
                  className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black bg-opacity-50 opacity-0 transition-opacity hover:opacity-100"
                >
                  <Upload className="h-8 w-8 text-white" />
                </label>
                <input
                  id="group-picture-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>
              <p className="text-xs text-muted-foreground">Upload group picture (optional)</p>
            </div>

            {/* Group Name */}
            <FormField
              control={form.control}
              name="group_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter group name" {...field} />
                  </FormControl>
                  <FormDescription>This is the name that will be displayed to all members.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Group Members */}
            <FormField
              control={form.control}
              name="members"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Members</FormLabel>
                  <FormDescription>Select members to add to this group.</FormDescription>
                  <div className="mt-2">
                    <Popover open={commandOpen} onOpenChange={setCommandOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={commandOpen}
                          className="w-full justify-between"
                        >
                          {field.value.length > 0
                            ? `${field.value.length} member${field.value.length > 1 ? "s" : ""} selected`
                            : "Select members"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Search members..." />
                          <CommandList>
                            <CommandEmpty>No members found.</CommandEmpty>
                            <CommandGroup>
                              <ScrollArea className="h-[200px]">
                                {profiles.map((profile) => {
                                  const isSelected = field.value.includes(profile.id)
                                  return (
                                    <CommandItem
                                      key={profile.id}
                                      value={profile.id}
                                      onSelect={() => {
                                        const updatedValue = isSelected
                                          ? field.value.filter((id) => id !== profile.id)
                                          : [...field.value, profile.id]
                                        field.onChange(updatedValue)
                                      }}
                                    >
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={isSelected}
                                          className={cn("mr-2", isSelected ? "opacity-100" : "opacity-40")}
                                        />
                                        <MemberAvatar
                                          avatarUrl={profile.avatar_url || null}
                                          fullName={profile.full_name}
                                        />
                                        <span>{profile.full_name}</span>
                                        {isSelected && <Check className="ml-auto h-4 w-4" />}
                                      </div>
                                    </CommandItem>
                                  )
                                })}
                              </ScrollArea>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Group
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

