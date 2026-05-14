"use client"

import { useState, useRef, useEffect } from "react"
import { Mail, Phone, Globe, X, Copy, Check, Trash2, Pencil, Plus } from "lucide-react"
import { ContactCard } from "@/lib/types"
import {
  CategoryBadge,
  PRESET_CATEGORIES,
  categoryAccentColor,
  getAccentColor,
} from "./category-badge"
import { cn } from "@/lib/utils"

const SWATCH_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#f59e0b", "#84cc16", "#10b981",
  "#06b6d4", "#3b82f6", "#64748b", "#a16207",
]

interface CardDetailProps {
  card: ContactCard
  notes: string
  onNotesChange: (value: string) => void
  onClose: () => void
  onDelete: () => void
  onCategoryChange: (category: string, accent: string) => void
}

function CopyRow({
  icon: Icon,
  value,
  href,
}: {
  icon: React.ElementType
  value: string
  href: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/60">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" strokeWidth={1.5} />
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel="noopener noreferrer"
        className="flex-1 truncate text-sm text-foreground/80 hover:text-foreground transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {value}
      </a>
      <button
        onClick={(e) => { e.stopPropagation(); handleCopy() }}
        aria-label={`Copy ${value}`}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
      >
        {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  )
}

export function CardDetail({ card, notes, onNotesChange, onClose, onDelete, onCategoryChange }: CardDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [creatingTag, setCreatingTag] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState(SWATCH_COLORS[0])
  const categoryRef = useRef<HTMLDivElement>(null)
  const newTagInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!categoryOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setCategoryOpen(false)
        setCreatingTag(false)
        setNewTagName("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [categoryOpen])

  useEffect(() => {
    if (creatingTag) newTagInputRef.current?.focus()
  }, [creatingTag])

  function handlePickPreset(cat: string) {
    onCategoryChange(cat, (categoryAccentColor as Record<string, string>)[cat])
    setCategoryOpen(false)
    setCreatingTag(false)
  }

  function handleSaveCustomTag() {
    const name = newTagName.trim()
    if (!name) return
    onCategoryChange(name, newTagColor)
    setCategoryOpen(false)
    setCreatingTag(false)
    setNewTagName("")
    setNewTagColor(SWATCH_COLORS[0])
  }

  const accentColor = getAccentColor(card.category, card.accent)

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-3xl",
        "bg-white dark:bg-slate-900",
        "ring-1 ring-slate-200/80 dark:ring-slate-700/50",
        "shadow-2xl shadow-slate-900/10 dark:shadow-slate-950/40"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Accent gradient header */}
      <div
        className="absolute inset-x-0 top-0 h-1 rounded-t-3xl"
        style={{ background: accentColor }}
        aria-hidden="true"
      />

      {/* Top-right action buttons */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5">
        {confirmDelete ? (
          <>
            <span className="text-xs font-medium text-red-500 mr-1">Delete this card?</span>
            <button
              onClick={onDelete}
              className="flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-red-600"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
            >
              No
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete card"
            className="flex size-7 items-center justify-center rounded-full bg-muted/80 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          >
            <Trash2 className="size-3.5" strokeWidth={2} />
          </button>
        )}
        <button
          onClick={onClose}
          aria-label="Close"
          className="flex size-7 items-center justify-center rounded-full bg-muted/80 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" strokeWidth={2.5} />
        </button>
      </div>

      {/* Content */}
      <div className="p-7 pt-8">
        {/* Header */}
        <div className="mb-5">
          {/* Editable category badge */}
          <div className="mb-3" ref={categoryRef}>
            <div className="relative inline-block">
              <button
                onClick={() => { setCategoryOpen((v) => !v); setCreatingTag(false) }}
                aria-label="Change category"
                className="group flex items-center gap-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <CategoryBadge category={card.category} color={card.accent ?? undefined} />
                <Pencil className="size-2.5 text-muted-foreground/50 transition-opacity opacity-0 group-hover:opacity-100" />
              </button>

              {categoryOpen && (
                <div className="absolute left-0 top-full mt-1.5 z-20 min-w-[160px] rounded-2xl bg-white dark:bg-slate-800 p-1.5 shadow-xl ring-1 ring-slate-200/80 dark:ring-slate-700/50">
                  {!creatingTag ? (
                    <>
                      {/* Preset list */}
                      {PRESET_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => handlePickPreset(cat)}
                          className={cn(
                            "flex w-full items-center rounded-xl px-2 py-1.5 transition-colors hover:bg-muted/60",
                            cat === card.category && "bg-muted/40"
                          )}
                        >
                          <CategoryBadge category={cat} />
                        </button>
                      ))}
                      <div className="my-1 h-px bg-border/60" />
                      {/* New tag button */}
                      <button
                        onClick={() => setCreatingTag(true)}
                        className="flex w-full items-center gap-1.5 rounded-xl px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                      >
                        <Plus className="size-3" />
                        New tag…
                      </button>
                    </>
                  ) : (
                    /* New tag form */
                    <div className="p-1">
                      <input
                        ref={newTagInputRef}
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveCustomTag()
                          if (e.key === "Escape") { setCreatingTag(false); setNewTagName("") }
                        }}
                        placeholder="Tag name"
                        maxLength={24}
                        className={cn(
                          "mb-2.5 w-full rounded-lg px-2.5 py-1.5 text-xs",
                          "bg-muted/40 text-foreground placeholder:text-muted-foreground/60",
                          "outline-none ring-1 ring-transparent focus:ring-ring/30"
                        )}
                      />
                      {/* Color swatches */}
                      <div className="mb-2.5 grid grid-cols-6 gap-1">
                        {SWATCH_COLORS.map((c) => (
                          <button
                            key={c}
                            onClick={() => setNewTagColor(c)}
                            className={cn(
                              "size-5 rounded-full transition-transform hover:scale-110",
                              newTagColor === c && "ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-800 ring-current"
                            )}
                            style={{ background: c, color: c }}
                            aria-label={c}
                          />
                        ))}
                      </div>
                      {/* Preview + actions */}
                      <div className="flex items-center justify-between gap-2">
                        {newTagName.trim() ? (
                          <CategoryBadge category={newTagName.trim()} color={newTagColor} />
                        ) : (
                          <span className="text-[10px] text-muted-foreground/50">preview</span>
                        )}
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setCreatingTag(false); setNewTagName("") }}
                            className="rounded-lg px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted/60"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveCustomTag}
                            disabled={!newTagName.trim()}
                            className="rounded-lg bg-foreground px-2 py-1 text-[10px] font-medium text-background disabled:opacity-40"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <h2
            className="font-display text-3xl leading-tight tracking-wide text-foreground"
            style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
          >
            {card.company}
          </h2>
          <p className="mt-1 text-lg font-medium text-foreground/80">{card.name}</p>
          <p className="text-base text-muted-foreground">{card.title}</p>
        </div>

        {/* Divider */}
        <div className="mb-4 h-px bg-border/60" />

        {/* Contact rows */}
        <div className="-mx-3 mb-5 space-y-0.5">
          <CopyRow icon={Mail} value={card.email} href={`mailto:${card.email}`} />
          <CopyRow icon={Phone} value={card.phone} href={`tel:${card.phone.replace(/\D/g, "")}`} />
          <CopyRow
            icon={Globe}
            value={card.website}
            href={`https://${card.website.replace(/^https?:\/\//, "")}`}
          />
        </div>

        {/* AI Description */}
        {card.aiDescription && (
          <div className="mb-5 rounded-2xl bg-muted/50 px-4 py-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              About
            </p>
            <p className="text-sm italic leading-relaxed text-muted-foreground">
              {card.aiDescription}
            </p>
          </div>
        )}

        {/* Notes */}
        <div>
          <label
            htmlFor={`notes-${card.id}`}
            className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60"
          >
            Notes
          </label>
          <textarea
            id={`notes-${card.id}`}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Add a note…"
            rows={3}
            className={cn(
              "w-full resize-none rounded-xl px-3 py-2.5 text-sm",
              "bg-muted/40 text-foreground placeholder:text-muted-foreground/60",
              "outline-none ring-1 ring-transparent transition-all",
              "focus:bg-muted/60 focus:ring-ring/30"
            )}
          />
        </div>
      </div>
    </div>
  )
}
