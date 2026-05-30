"use client"

import {
  motion,
  useMotionValue,
  useMotionTemplate,
  animate,
  useReducedMotion,
} from "framer-motion"
import { ContactCard as ContactCardType } from "@/lib/types"
import { CategoryBadge, getAccentColor } from "./category-badge"
import { cn } from "@/lib/utils"
import { springGentle } from "@/lib/motion"

interface ContactCardProps {
  card: ContactCardType
  className?: string
}

const sharedCardClass = [
  "relative flex flex-col overflow-hidden rounded-2xl p-7",
  "min-h-[260px]",
  "bg-white/80 dark:bg-slate-900/60",
  "ring-1 ring-slate-200/80 dark:ring-slate-700/50",
  "backdrop-blur-md",
  "shadow-[0_2px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none",
].join(" ")

const ringHighlightStyle = {
  padding: 1.5,
  filter: "brightness(1.6) saturate(1.2)",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  maskComposite: "exclude",
} as const

export function ContactCard({ card, className }: ContactCardProps) {
  const reducedMotion = useReducedMotion()

  const rotateX     = useMotionValue(0)
  const tiltY       = useMotionValue(0)
  const glowX       = useMotionValue(50)
  const glowY       = useMotionValue(50)
  const glowOpacity = useMotionValue(0)

  const primaryAccent = card.tags[0]
    ? getAccentColor(card.tags[0].name, card.tags[0].accent)
    : "#cbd5e1"

  const ringHighlight = useMotionTemplate`radial-gradient(180px circle at ${glowX}% ${glowY}%, ${primaryAccent}, transparent 65%)`

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reducedMotion) return
    const rect = e.currentTarget.getBoundingClientRect()
    const nx = (e.clientX - rect.left) / rect.width - 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5
    tiltY.set(nx * 8)
    rotateX.set(-ny * 8)
    glowX.set((nx + 0.5) * 100)
    glowY.set((ny + 0.5) * 100)
  }

  function handlePointerEnter() {
    if (reducedMotion) return
    animate(glowOpacity, 1, { duration: 0.2 })
  }

  function handlePointerLeave() {
    if (reducedMotion) return
    animate(rotateX, 0, springGentle)
    animate(tiltY, 0, springGentle)
    animate(glowX, 50, springGentle)
    animate(glowY, 50, springGentle)
    animate(glowOpacity, 0, { duration: 0.3 })
  }

  const tiltHandlers = {
    onPointerMove: handlePointerMove,
    onPointerEnter: handlePointerEnter,
    onPointerLeave: handlePointerLeave,
  }

  return (
    <div className={cn("relative", className)}>

      <motion.div
        className={sharedCardClass}
        style={{
          rotateX,
          rotateY: tiltY,
          transformPerspective: 1000,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          willChange: "transform",
        }}
        whileHover={reducedMotion ? {} : { translateZ: 8 }}
        transition={{ translateZ: { duration: 0.2 } }}
        {...tiltHandlers}
      >
        {/* Edge ring highlight */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ opacity: glowOpacity, background: ringHighlight, ...ringHighlightStyle }}
        />

        {/* Accent bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
          style={{ background: primaryAccent }}
          aria-hidden="true"
        />

        {/* Tags */}
        <div className="mb-5 flex flex-wrap justify-end gap-1.5">
          {card.tags.map((t) => (
            <CategoryBadge key={t.name} category={t.name} color={t.accent} />
          ))}
        </div>

        {/* Company */}
        <p
          className="mb-2 font-display text-2xl font-light leading-tight tracking-tight text-foreground"
        >
          {card.company}
        </p>

        {/* Person */}
        <p className="text-sm font-semibold text-foreground/80">{card.name}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{card.title}</p>

        {/* Divider + contact info */}
        <div className="mt-auto">
          <div className="my-5 h-px bg-border/60" />
          <p className="truncate text-sm text-muted-foreground">{card.email}</p>
          {card.phone && (
            <p className="mt-1 truncate text-sm text-muted-foreground">{card.phone}</p>
          )}
        </div>
      </motion.div>

    </div>
  )
}
