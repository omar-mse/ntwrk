import { cn } from "@/lib/utils"

export const PRESET_CATEGORIES = [
  "Tech", "Design", "Finance", "Marketing",
  "Legal", "Healthcare", "Real Estate", "Education",
  "Consulting", "Sales", "Media", "Hospitality",
  "Manufacturing", "Retail",
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
  Other: "#94a3b8",
}


export function getAccentColor(category: string, cardAccent?: string | null): string {
  return (categoryAccentColor as Record<string, string>)[category] ?? cardAccent ?? "#94a3b8"
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
