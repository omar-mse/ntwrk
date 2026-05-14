"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"
type ResolvedTheme = "light" | "dark"

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

const STORAGE_KEY = "cards-theme"

function getResolved(t: Theme): ResolvedTheme {
  if (t === "dark") return "dark"
  if (t === "light") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light")

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    const initial: Theme =
      stored === "light" || stored === "dark" || stored === "system" ? stored : "system"
    const resolved = getResolved(initial)
    setThemeState(initial)
    setResolvedTheme(resolved)
    document.documentElement.classList.toggle("dark", resolved === "dark")
  }, [])

  function setTheme(t: Theme) {
    const resolved = getResolved(t)
    setThemeState(t)
    setResolvedTheme(resolved)
    localStorage.setItem(STORAGE_KEY, t)
    document.documentElement.classList.toggle("dark", resolved === "dark")
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
