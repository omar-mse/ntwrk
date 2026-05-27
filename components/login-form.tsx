"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { signIn } from "next-auth/react"

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M15.68 8.18c0-.57-.05-1.11-.14-1.64H8v3.1h4.3a3.68 3.68 0 0 1-1.6 2.41v2h2.58c1.51-1.39 2.4-3.44 2.4-5.87z" fill="#4285F4"/>
    <path d="M8 16c2.16 0 3.97-.72 5.29-1.94l-2.58-2a4.8 4.8 0 0 1-7.16-2.52H.96v2.06A8 8 0 0 0 8 16z" fill="#34A853"/>
    <path d="M3.55 9.54A4.82 4.82 0 0 1 3.3 8c0-.53.09-1.05.25-1.54V4.4H.96A8.01 8.01 0 0 0 0 8c0 1.29.31 2.5.96 3.6l2.59-2.06z" fill="#FBBC05"/>
    <path d="M8 3.18c1.22 0 2.31.42 3.17 1.24l2.37-2.37A7.93 7.93 0 0 0 8 0 8 8 0 0 0 .96 4.4l2.59 2.06A4.77 4.77 0 0 1 8 3.18z" fill="#EA4335"/>
  </svg>
)

export function LoginForm() {
  const router = useRouter()

  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (mode === "signin") {
      const result = await signIn("credentials", { email, password, redirect: false })
      if (result?.error) {
        setError("Invalid email or password.")
      } else {
        router.push("/")
        router.refresh()
      }
    } else {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (res.status === 409) {
        setError("An account with that email already exists.")
      } else if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? "Could not create account.")
      } else {
        const result = await signIn("credentials", { email, password, redirect: false })
        if (result?.error) {
          setError("Account created — please sign in.")
        } else {
          router.push("/")
          router.refresh()
        }
      }
    }

    setLoading(false)
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    await signIn("google", { callbackUrl: "/" })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <button
        onClick={handleGoogle}
        disabled={googleLoading}
        className="flex h-9 w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
      >
        <GoogleIcon />
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </button>

      <div className="relative my-4 flex items-center">
        <div className="flex-1 border-t border-border" />
        <span className="absolute left-1/2 -translate-x-1/2 bg-card px-2 text-xs text-muted-foreground">or</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-1 focus:ring-ring/60"
          placeholder="Email"
        />

        <input
          id="password"
          type="password"
          required
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-1 focus:ring-ring/60"
          placeholder="Password"
        />

        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-destructive"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={loading}
          className="h-9 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {mode === "signin" ? (
          <>
            No account?{" "}
            <button
              onClick={() => { setMode("signup"); setError(null) }}
              className="text-foreground underline-offset-2 hover:underline"
            >
              Create one
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              onClick={() => { setMode("signin"); setError(null) }}
              className="text-foreground underline-offset-2 hover:underline"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  )
}
