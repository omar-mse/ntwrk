"use client"

import { useState } from "react"
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useTransform,
  animate,
  useReducedMotion,
} from "framer-motion"
import { QRCodeSVG } from "qrcode.react"
import { QrCode, RotateCcw } from "lucide-react"
import { ContactCard as ContactCardType } from "@/lib/types"
import { CategoryBadge, getAccentColor } from "./category-badge"
import { cn } from "@/lib/utils"
import { springGentle } from "@/lib/motion"

interface ContactCardProps {
  card: ContactCardType
  className?: string
}

function buildVCard(card: ContactCardType): string {
  const parts = card.name.trim().split(/\s+/)
  const lastName  = parts.length > 1 ? parts[parts.length - 1] : ""
  const firstName = parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0]
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${lastName};${firstName};;;`,
    `FN:${card.name}`,
    card.company && `ORG:${card.company}`,
    card.title   && `TITLE:${card.title}`,
    card.email   && `EMAIL;TYPE=WORK:${card.email}`,
    card.phone   && `TEL;TYPE=WORK:${card.phone}`,
    card.website && `URL:${card.website}`,
    "END:VCARD",
  ].filter(Boolean).join("\r\n")
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

const flipEase = [0.4, 0, 0.2, 1] as const

export function ContactCard({ card, className }: ContactCardProps) {
  const reducedMotion = useReducedMotion()
  const [flipped, setFlipped] = useState(false)

  const rotateX     = useMotionValue(0)
  const tiltY       = useMotionValue(0)
  const glowX       = useMotionValue(50)
  const glowY       = useMotionValue(50)
  const glowOpacity = useMotionValue(0)

  const frontFlipY = useMotionValue(0)
  const backFlipY  = useMotionValue(180)

  // Both faces use the same tilt formula — back face rotates 180→360 (full cycle), so
  // at 360° it's in its natural orientation, not mirrored.
  const frontRotateY = useTransform([tiltY, frontFlipY] as const, ([t, f]) => (t as number) + (f as number))
  const backRotateY  = useTransform([tiltY, backFlipY]  as const, ([t, f]) => (t as number) + (f as number))

  const primaryAccent = card.tags[0]
    ? getAccentColor(card.tags[0].name, card.tags[0].accent)
    : "#cbd5e1"

  const ringHighlight = useMotionTemplate`radial-gradient(180px circle at ${glowX}% ${glowY}%, ${primaryAccent}, transparent 65%)`

  function handleFlip(e: React.MouseEvent) {
    e.stopPropagation()
    const next = !flipped
    setFlipped(next)
    // Reset tilt on both flip directions
    animate(tiltY, 0, { duration: 0.15 })
    animate(rotateX, 0, { duration: 0.15 })
    animate(glowOpacity, 0, { duration: 0.1 })
    if (next) {
      animate(frontFlipY, 180, { duration: 0.4, ease: flipEase })
      animate(backFlipY,  360, { duration: 0.4, ease: flipEase })
    } else {
      animate(frontFlipY, 0,   { duration: 0.4, ease: flipEase })
      animate(backFlipY,  180, { duration: 0.4, ease: flipEase })
    }
  }

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

      {/* ── Front face ── */}
      <motion.div
        className={cn(sharedCardClass, flipped && "pointer-events-none")}
        style={{
          rotateX,
          rotateY: frontRotateY,
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

        {/* Flip button */}
        <button
          onClick={handleFlip}
          aria-label="Show QR code"
          className="absolute bottom-3 right-3 flex size-7 items-center justify-center rounded-full text-muted-foreground/30 transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-800/40 hover:text-muted-foreground/70"
        >
          <QrCode className="size-3.5" strokeWidth={1.75} />
        </button>
      </motion.div>

      {/* ── Back face ── */}
      <motion.div
        className={cn(sharedCardClass, "absolute inset-0 items-center justify-center gap-4", !flipped && "pointer-events-none")}
        style={{
          rotateX,
          rotateY: backRotateY,
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

        {/* QR code */}
        <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200/60">
          <QRCodeSVG
            value={buildVCard(card)}
            size={148}
            fgColor="#0f172a"
            bgColor="#ffffff"
            level="M"
          />
        </div>

        {/* Name + company */}
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground/80">{card.name}</p>
          {card.company && (
            <p className="mt-0.5 text-xs text-muted-foreground">{card.company}</p>
          )}
          <p className="mt-2 text-[10px] text-muted-foreground/50 uppercase tracking-widest">
            Scan to save contact
          </p>
        </div>

        {/* Flip back button */}
        <button
          onClick={handleFlip}
          aria-label="Flip back"
          className="absolute bottom-3 right-3 flex size-7 items-center justify-center rounded-full text-muted-foreground/30 transition-colors hover:bg-slate-100/60 dark:hover:bg-slate-800/40 hover:text-muted-foreground/70"
        >
          <RotateCcw className="size-3.5" strokeWidth={1.75} />
        </button>
      </motion.div>

    </div>
  )
}
