"use client"

import { Search, LogOut } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { useSearch } from "./search-provider"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface SiteHeaderProps {
  userEmail?: string
}

export function SiteHeader({ userEmail }: SiteHeaderProps) {
  const { query, setQuery } = useSearch()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/40 dark:border-white/5 bg-white/70 dark:bg-slate-950/60 backdrop-blur-2xl">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-4 px-4 sm:px-8 lg:px-12 xl:px-16">
        {/* Wordmark */}
        <a
          href="/"
          className="flex shrink-0 items-center gap-2 select-none"
          aria-label="Cards home"
        >
          <span
            className="text-2xl font-normal tracking-wide text-foreground"
            style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
          >
            ntwrk
          </span>
        </a>

        {/* Search — hidden on mobile */}
        <div className="hidden flex-1 justify-center md:flex">
          <div className="relative w-full max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 w-full rounded-full bg-muted/60 pl-8 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none ring-0 transition-all focus:bg-muted focus:ring-1 focus:ring-ring/40"
              aria-label="Search contacts"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {userEmail && (
            <>
              <span className="hidden text-xs text-muted-foreground sm:block">{userEmail}</span>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Sign out"
              >
                <LogOut className="size-3.5" strokeWidth={1.5} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
