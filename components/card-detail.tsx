"use client"

import { useState, useRef, useEffect } from "react"
import { Mail, Phone, Globe, X, Copy, Check, Trash2, Pencil } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { ContactCard, CustomCategory } from "@/lib/types"
import {
  CategoryBadge,
  PRESET_CATEGORIES,
  categoryAccentColor,
  getAccentColor,
} from "./category-badge"
import { cn } from "@/lib/utils"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

function buildVCard(card: ContactCard): string {
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

interface CardDetailProps {
  card: ContactCard
  notes: string
  onNotesChange: (value: string) => void
  onClose: () => void
  onDelete: () => void
  onTagsChange: (tags: CustomCategory[]) => void
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

function SortableTagChip({ id, category, accent }: { id: string; category: string; accent: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
      }}
      {...attributes}
      {...listeners}
    >
      <CategoryBadge category={category} color={accent} />
    </div>
  )
}

export function CardDetail({ card, notes, onNotesChange, onClose, onDelete, onTagsChange }: CardDetailProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = card.tags.findIndex((t) => t.name === active.id)
    const newIndex = card.tags.findIndex((t) => t.name === over.id)
    onTagsChange(arrayMove(card.tags, oldIndex, newIndex))
  }

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const categoryRef = useRef<HTMLDivElement>(null)

  function isSelected(name: string) {
    return card.tags.some((t) => t.name === name)
  }

  function toggleTag(name: string, accent: string) {
    const next = isSelected(name)
      ? card.tags.filter((t) => t.name !== name)
      : [...card.tags, { name, accent }]
    onTagsChange(next)
  }

  useEffect(() => {
    if (!categoryOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setCategoryOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [categoryOpen])

  const primaryAccent = card.tags[0] ? getAccentColor(card.tags[0].name, card.tags[0].accent) : "#94a3b8"

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
        style={{ background: primaryAccent }}
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
          {/* Tags row with picker */}
          <div className="mb-3" ref={categoryRef}>
            <div className="relative inline-flex flex-wrap items-center gap-1.5">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={card.tags.map((t) => t.name)} strategy={rectSortingStrategy}>
                  {card.tags.map((t) => (
                    <SortableTagChip key={t.name} id={t.name} category={t.name} accent={t.accent} />
                  ))}
                </SortableContext>
              </DndContext>
              <button
                onClick={() => setCategoryOpen((v) => !v)}
                aria-label="Edit tags"
                className="flex items-center gap-0.5 rounded-full p-1 text-muted-foreground/50 outline-none transition-colors hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <Pencil className="size-2.5" />
              </button>

              {categoryOpen && (
                <div className="absolute left-0 top-full mt-1.5 z-20 min-w-[160px] max-h-64 overflow-y-auto rounded-2xl bg-white dark:bg-slate-800 p-1.5 shadow-xl ring-1 ring-slate-200/80 dark:ring-slate-700/50 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {/* Fixed preset list — Other always last */}
                  {PRESET_CATEGORIES.map((cat) => (
                    <button
                      key={`preset-${cat}`}
                      type="button"
                      onClick={() => toggleTag(cat, (categoryAccentColor as Record<string, string>)[cat])}
                      className={cn(
                        "flex w-full items-center rounded-xl px-2 py-1.5 transition-colors hover:bg-muted/60",
                        isSelected(cat) && "bg-muted/40"
                      )}
                    >
                      <span className="flex flex-1 items-center transition-all duration-150 hover:scale-110 origin-left">
                        <CategoryBadge category={cat} />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <h2
            className="font-display text-3xl font-light leading-tight tracking-tight text-foreground"
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

        {/* QR code — scan to save contact */}
        <div className="mb-4 flex flex-col items-center gap-1.5 text-foreground">
          <div className="rounded-xl bg-white p-2.5">
            <QRCodeSVG
              value={buildVCard(card)}
              size={104}
              fgColor="#0f172a"
              bgColor="#ffffff"
              level="M"
            />
          </div>
          <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground/50 [text-indent:0.1em]">Scan to save contact</p>
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
