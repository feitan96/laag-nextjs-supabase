// components/app/profile-card.tsx
"use client"

import { useAuth } from "@/app/context/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAvatar } from "@/hooks/useAvatar"

export function ProfileCard() {
  const { user, profile } = useAuth()
  const avatarUrl = useAvatar(profile?.avatar_url || null)

  if (!user || !profile) {
    return null
  }

  return (
    <Card className="h-full overflow-hidden">
      {/* <CardHeader>
        <CardTitle>My Profile</CardTitle>
      </CardHeader> */}
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback>
              {profile.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h3 className="text-lg font-semibold">{profile.full_name || "User"}</h3>
            <p className="text-sm text-muted-foreground">
              @{profile.username || user.email?.split('@')[0]}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}