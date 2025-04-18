"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OAuthButton } from "./oauth-button"

export function AuthForm() {
  const [isPending, setIsPending] = useState(false)

  const handleGoogleSignIn = async () => {
    try {
      setIsPending(true)
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("Error signing in with Google:", error.message)
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <OAuthButton 
          provider="google" 
          onClick={handleGoogleSignIn} 
          className="w-full" 
          disabled={isPending}
        />
      </CardContent>
    </Card>
  )
}

