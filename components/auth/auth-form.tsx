"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createClient } from "@/utils/supabase/client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { OAuthButton } from "./oauth-button"
import { authSchema, type AuthFormValues } from "./auth-schema"

interface AuthFormProps {
  mode: "signin" | "signup"
  onToggleMode: () => void
  signinAction: (formData: FormData) => Promise<void>
  signupAction: (formData: FormData) => Promise<void>
}

export function AuthForm({ mode, onToggleMode, signinAction, signupAction }: AuthFormProps) {
  const [isPending, setIsPending] = useState(false)

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const isSignUp = mode === "signup"
  const title = isSignUp ? "Create an account" : "Welcome back"
  const description = isSignUp
    ? "Enter your details to create your account"
    : "Enter your credentials to sign in to your account"
  const submitText = isSignUp ? "Sign Up" : "Sign In"
  const toggleText = isSignUp ? "Already have an account?" : "Don't have an account?"
  const toggleActionText = isSignUp ? "Sign In" : "Sign Up"

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
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form className="space-y-4" action={isSignUp ? signupAction : signinAction}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="••••••••"
                      type="password"
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {submitText}
            </Button>
          </form>
        </Form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <OAuthButton provider="google" onClick={handleGoogleSignIn} className="w-full" />
      </CardContent>
      <CardFooter>
        <div className="text-sm text-center w-full">
          {toggleText}{" "}
          <Button variant="link" className="p-0 h-auto font-normal" onClick={onToggleMode} disabled={isPending}>
            {toggleActionText}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

