import { cn } from "@/lib/utils"
import type { CustomCategory } from "@/lib/types"

export const PRESET_CATEGORIES = [
  "Tech", "Design", "Finance", "Marketing",
  "Legal", "Healthcare", "Real Estate", "Education",
  "Consulting", "Sales", "Media", "Hospitality",
  "Manufacturing", "Retail", "Insurance",
  "Nonprofit / Gov", "Food & Beverage",
  "Other",
] as const
export type PresetCategory = (typeof PRESET_CATEGORIES)[number]

export const categoryAccentColor: Record<PresetCategory, string> = {
  Tech: "#6366f1",
  Design: "#f59e0b",
  Finance: "#10b981",
  Marketing: "#ec4899",
  Legal: "#7c3aed",
  Healthcare: "#ef4444",
  "Real Estate": "#0ea5e9",
  Education: "#eab308",
  Consulting: "#14b8a6",
  Sales: "#f97316",
  Media: "#a855f7",
  Hospitality: "#d946ef",
  Manufacturing: "#78716c",
  Retail: "#84cc16",
  Insurance: "#1d4ed8",
  "Nonprofit / Gov": "#4d7c0f",
  "Food & Beverage": "#b91c1c",
  Other: "#94a3b8",
}


export function getAccentColor(category: string, cardAccent?: string | null): string {
  return (categoryAccentColor as Record<string, string>)[category] ?? cardAccent ?? "#94a3b8"
}

// Categories are a fixed set. Any name that isn't a preset (case-insensitive)
// collapses to "Other" — this is the single rule both the UI and the server enforce.
export function coerceToPreset(name: string): PresetCategory {
  const match = PRESET_CATEGORIES.find((c) => c.toLowerCase() === name?.trim().toLowerCase())
  return match ?? "Other"
}

// Coerce an arbitrary tag list to preset-only: canonical names, preset accents,
// de-duplicated, never empty (falls back to "Other").
export function toPresetTags(tags: CustomCategory[] | undefined): CustomCategory[] {
  const out: CustomCategory[] = []
  const seen = new Set<PresetCategory>()
  for (const t of tags ?? []) {
    const name = coerceToPreset(t?.name ?? "")
    if (seen.has(name)) continue
    seen.add(name)
    out.push({ name, accent: categoryAccentColor[name] })
  }
  return out.length > 0 ? out : [{ name: "Other", accent: categoryAccentColor.Other }]
}

interface CategoryBadgeProps {
  category: string
  color?: string
  className?: string
}

export function CategoryBadge({ category, color, className }: CategoryBadgeProps) {
  const bg = color ?? (categoryAccentColor as Record<string, string>)[category] ?? "#94a3b8"
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase",
        className
      )}
      style={{ background: `${bg}22`, color: bg }}
    >
      {category}
    </span>
  )
}
