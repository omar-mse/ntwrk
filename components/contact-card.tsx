"use client"

import { ContactCard as ContactCardType } from "@/lib/types"
import { CategoryBadge, getAccentColor } from "./category-badge"
import { cn } from "@/lib/utils"

interface ContactCardProps {
  card: ContactCardType
  className?: string
}

export function ContactCard({ card, className }: ContactCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-7",
        "bg-white/80 dark:bg-slate-900/60",
        "ring-1 ring-slate-200/80 dark:ring-slate-700/50",
        "backdrop-blur-md",
        "shadow-[0_2px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none",
        className
      )}
    >
      {/* Accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
        style={{ background: getAccentColor(card.category, card.accent) }}
        aria-hidden="true"
      />

      {/* Category badge */}
      <div className="mb-5 flex justify-end">
        <CategoryBadge category={card.category} color={card.accent ?? undefined} />
      </div>

      {/* Company */}
      <p
        className="mb-2 font-display text-2xl font-normal italic leading-tight tracking-wide text-foreground"
        style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
      >
        {card.company}
      </p>

      {/* Person */}
      <p className="text-sm font-semibold text-foreground/80">{card.name}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{card.title}</p>

      {/* Divider */}
      <div className="my-5 h-px bg-border/60" />

      {/* Email */}
      <p className="truncate text-sm text-muted-foreground">{card.email}</p>
    </div>
  )
}
