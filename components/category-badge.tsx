import { cn } from "@/lib/utils"

export const PRESET_CATEGORIES = ["Tech", "Design", "Finance", "Marketing", "Other"] as const
export type PresetCategory = (typeof PRESET_CATEGORIES)[number]

export const categoryAccentColor: Record<PresetCategory, string> = {
  Tech: "#6366f1",
  Design: "#f59e0b",
  Finance: "#10b981",
  Marketing: "#ec4899",
  Other: "#94a3b8",
}

const categoryConfig: Record<PresetCategory, { label: string; className: string }> = {
  Tech: {
    label: "Tech",
    className: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300",
  },
  Design: {
    label: "Design",
    className: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300",
  },
  Finance: {
    label: "Finance",
    className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
  },
  Marketing: {
    label: "Marketing",
    className: "bg-pink-50 text-pink-600 dark:bg-pink-950/60 dark:text-pink-300",
  },
  Other: {
    label: "Other",
    className: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  },
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
  const preset = categoryConfig[category as PresetCategory]
  if (preset) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase",
          preset.className,
          className
        )}
      >
        {preset.label}
      </span>
    )
  }
  // Custom tag — use the stored accent color as background tint
  const bg = color ?? "#94a3b8"
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
