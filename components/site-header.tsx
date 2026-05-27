"use client"

import { Search, LogOut } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { Button } from "@/components/ui/button"
import { useSearch } from "./search-provider"
import { signOut } from "next-auth/react"

interface SiteHeaderProps {
  userEmail?: string
}

export function SiteHeader({ userEmail }: SiteHeaderProps) {
  const { query, setQuery } = useSearch()
  async function handleSignOut() {
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/40 dark:border-white/5 bg-white/70 dark:bg-slate-950/60 backdrop-blur-2xl">
      <div className="mx-auto grid h-14 max-w-screen-2xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-8 lg:px-12 xl:px-16">
        {/* Wordmark — left */}
        <a
          href="/"
          className="flex shrink-0 items-center select-none"
          aria-label="Cards home"
        >
          <span
            className="text-2xl font-normal tracking-wide text-foreground"
            style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
          >
            ntwrk
          </span>
        </a>

        {/* Search — center */}
        <div className="hidden md:block">
          <div className="relative w-64">
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
        <div className="md:hidden" />

        {/* Right controls */}
        <div className="flex items-center justify-end gap-2">
          <ThemeToggle />
          {userEmail && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="size-8 rounded-full"
            >
              <LogOut className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
