"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Upload, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

const formSchema = z.object({
  what: z.string().min(1, "What is required"),
  where: z.string().min(1, "Where is required"),
  why: z.string().min(1, "Why is required"),
  estimated_cost: z.string().min(1, "Estimated cost is required"),
  actual_cost: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  when_start: z.date(),
  when_end: z.date(),
  fun_meter: z.string().min(1, "Fun meter is required"),
  images: z.array(z.any()).optional(),
  attendees: z.array(z.string()).min(1, "At least one attendee is required"),
})

type FormValues = z.infer<typeof formSchema>

interface EditLaagDialogProps {
  laag: {
    id: string
    what: string
    where: string
    why: string
    estimated_cost: number
    actual_cost: number | null
    status: string
    when_start: string
    when_end: string
    fun_meter: number
    organizer: {
      id: string
      full_name: string
      avatar_url: string | null
    }
    laagAttendees: {
      id: string
      attendee_id: string
      is_removed: boolean
    }[]
    laagImages: {
      id: string
      laag_id: string
      image: string
      created_at: string
      is_deleted: boolean
    }[]
  }
  members: {
    id: string
    group_member: string
    is_removed: boolean
    profile: {
      id: string
      full_name: string
      avatar_url?: string | null
    }
  }[]
  onLaagUpdated: () => void
}

export function EditLaagDialog({ laag, members, onLaagUpdated }: EditLaagDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState((laag.laagImages || []).filter(img => !img.is_deleted))
  const supabase = createClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      what: laag.what,
      where: laag.where,
      why: laag.why,
      estimated_cost: laag.estimated_cost.toString(),
      actual_cost: laag.actual_cost?.toString() || "",
      status: laag.status,
      when_start: new Date(laag.when_start),
      when_end: new Date(laag.when_end),
      fun_meter: laag.fun_meter.toString(),
      images: [],
      attendees: (laag.laagAttendees || [])
        .filter(attendee => !attendee.is_removed)
        .map(attendee => attendee.attendee_id),
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setUploadedImages(prev => [...prev, ...files])
      
      // Create previews
      files.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeImage = async (index: number, isExisting: boolean = false) => {
    if (isExisting) {
      // Mark existing image as deleted
      const imageToDelete = existingImages[index]
      const { error } = await supabase
        .from("laagImages")
        .update({ is_deleted: true })
        .eq("id", imageToDelete.id)

      if (error) {
        toast.error("Failed to remove image")
        return
      }

      setExistingImages(prev => prev.filter((_, i) => i !== index))
    } else {
      setUploadedImages(prev => prev.filter((_, i) => i !== index))
      setImagePreviews(prev => prev.filter((_, i) => i !== index))
    }
  }

  const onSubmit = async (values: FormValues) => {
    setLoading(true)

    try {
      // Update the laag
      const { error: laagError } = await supabase
        .from("laags")
        .update({
          what: values.what,
          where: values.where,
          why: values.why,
          estimated_cost: parseFloat(values.estimated_cost),
          actual_cost: values.actual_cost ? parseFloat(values.actual_cost) : null,
          status: values.status,
          when_start: values.when_start.toISOString(),
          when_end: values.when_end.toISOString(),
          fun_meter: parseFloat(values.fun_meter),
          updated_at: new Date().toISOString(),
        })
        .eq("id", laag.id)

      if (laagError) throw laagError

      // Get current attendees
      const currentAttendees = laag.laagAttendees.filter(a => !a.is_removed)
      const newAttendees = values.attendees

      // Find attendees to remove
      const attendeesToRemove = currentAttendees.filter(
        attendee => !newAttendees.includes(attendee.attendee_id)
      )

      // Find attendees to add
      const attendeesToAdd = newAttendees.filter(
        attendeeId => !currentAttendees.some(a => a.attendee_id === attendeeId)
      )

      // Update removed attendees
      if (attendeesToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from("laagAttendees")
          .update({ is_removed: true })
          .in(
            "id",
            attendeesToRemove.map(a => a.id)
          )

        if (removeError) throw removeError
      }

      // Add new attendees
      if (attendeesToAdd.length > 0) {
        const { error: addError } = await supabase
          .from("laagAttendees")
          .insert(
            attendeesToAdd.map(attendeeId => ({
              laag_id: laag.id,
              attendee_id: attendeeId,
              is_removed: false
            }))
          )

        if (addError) throw addError
      }

      // Upload new images if any
      if (uploadedImages.length > 0) {
        for (const image of uploadedImages) {
          const fileExt = image.name.split(".").pop()
          const filePath = `${laag.id}/${crypto.randomUUID()}.${fileExt}`

          // Upload to storage bucket
          const { error: uploadError } = await supabase.storage
            .from("laags")
            .upload(filePath, image)

          if (uploadError) throw uploadError

          // Store in laagImages table
          const { error: imageError } = await supabase
            .from("laagImages")
            .insert({
              laag_id: laag.id,
              image: filePath
            })

          if (imageError) throw imageError
        }
      }

      toast.success("Laag updated successfully")
      setOpen(false)
      onLaagUpdated()
    } catch (error) {
      console.error("Error updating laag:", error)
      toast.error("Failed to update laag")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Laag</DialogTitle>
          <DialogDescription>Update your laag details.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="what"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What</FormLabel>
                      <FormControl>
                        <Input placeholder="What are you planning?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="where"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Where</FormLabel>
                      <FormControl>
                        <Input placeholder="Where will it happen?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="why"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Why</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Why are you planning this?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="estimated_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Cost</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="actual_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actual Cost (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Planning, In Progress, Completed" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="when_start"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="when_end"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="fun_meter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fun Meter (1-10)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="10" step="0.1" placeholder="1-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Images</FormLabel>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {existingImages.map((image, index) => (
                    <div key={image.id} className="relative aspect-square">
                      <Image
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/laags/${image.image}`}
                        alt={`Existing image ${index + 1}`}
                        fill
                        className="rounded-lg object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2 h-6 w-6"
                        onClick={() => removeImage(index, true)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  {imagePreviews.map((preview, index) => (
                    <div key={`preview-${index}`} className="relative aspect-square">
                      <Image
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="rounded-lg object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2 h-6 w-6"
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <FormLabel>Attendees</FormLabel>
                <div className="grid grid-cols-2 gap-4">
                  {members.map((member) => (
                    <FormField
                      key={member.profile.id}
                      control={form.control}
                      name="attendees"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(member.profile.id)}
                              onCheckedChange={(checked) => {
                                const currentValue = field.value || []
                                if (checked) {
                                  field.onChange([...currentValue, member.profile.id])
                                } else {
                                  field.onChange(currentValue.filter(id => id !== member.profile.id))
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {member.profile.full_name}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Laag
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 