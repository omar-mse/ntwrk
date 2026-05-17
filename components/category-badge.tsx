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
  Legal: {
    label: "Legal",
    className: "bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300",
  },
  Healthcare: {
    label: "Healthcare",
    className: "bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-300",
  },
  "Real Estate": {
    label: "Real Estate",
    className: "bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300",
  },
  Education: {
    label: "Education",
    className: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/60 dark:text-yellow-300",
  },
  Consulting: {
    label: "Consulting",
    className: "bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-300",
  },
  Sales: {
    label: "Sales",
    className: "bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-300",
  },
  Media: {
    label: "Media",
    className: "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300",
  },
  Hospitality: {
    label: "Hospitality",
    className: "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/60 dark:text-fuchsia-300",
  },
  Manufacturing: {
    label: "Manufacturing",
    className: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
  },
  Retail: {
    label: "Retail",
    className: "bg-lime-50 text-lime-600 dark:bg-lime-950/60 dark:text-lime-300",
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
