"use client"

import { useState } from "react"
import { X, CheckCircle2, Loader2 } from "lucide-react"
import { ContactCard } from "@/lib/types"
import { cn } from "@/lib/utils"
import { CategoryBadge } from "./category-badge"

interface CardPreviewProps {
  card: ContactCard
  onConfirm: (card: ContactCard) => void
  onCancel: () => void
  saving?: boolean
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-xl px-3 py-2 text-sm",
          "bg-muted/40 text-foreground placeholder:text-muted-foreground/60",
          "outline-none ring-1 ring-transparent transition-all",
          "focus:bg-muted/60 focus:ring-ring/30"
        )}
      />
    </div>
  )
}

export function CardPreview({ card, onConfirm, onCancel, saving = false }: CardPreviewProps) {
  const [draft, setDraft] = useState<ContactCard>(card)

  function set<K extends keyof ContactCard>(key: K, value: ContactCard[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

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
      {/* Accent stripe */}
      <div
        className="absolute inset-x-0 top-0 h-1 rounded-t-3xl"
        style={{ background: "linear-gradient(90deg, hsl(var(--primary) / 0.7), hsl(var(--primary) / 0.4))" }}
        aria-hidden="true"
      />

      {/* Close */}
      <div className="absolute right-4 top-4 z-10">
        <button
          onClick={onCancel}
          aria-label="Cancel preview"
          className="flex size-7 items-center justify-center rounded-full bg-muted/80 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" strokeWidth={2.5} />
        </button>
      </div>

      <div className="p-7 pt-8">
        <p className="mb-5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Review &amp; edit before adding
        </p>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" value={draft.name} onChange={(v) => set("name", v)} />
            <Field label="Company" value={draft.company} onChange={(v) => set("company", v)} />
          </div>
          <Field label="Title" value={draft.title} onChange={(v) => set("title", v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email" value={draft.email} onChange={(v) => set("email", v)} type="email" />
            <Field label="Phone" value={draft.phone} onChange={(v) => set("phone", v)} type="tel" />
          </div>
          <Field label="Website" value={draft.website} onChange={(v) => set("website", v)} />
        </div>

        {/* AI-assigned tags — read-only */}
        {draft.tags.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Tags
            </p>
            <div className="flex flex-wrap gap-2">
              {draft.tags.map((t) => (
                <CategoryBadge key={t.name} category={t.name} color={t.accent} />
              ))}
            </div>
          </div>
        )}

        {draft.aiDescription && (
          <div className="mt-4 rounded-2xl bg-muted/50 px-4 py-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              AI Summary
            </p>
            <p className="text-sm italic leading-relaxed text-muted-foreground">{draft.aiDescription}</p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={saving}
            className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(draft)}
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/80 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={2} />
            ) : (
              <CheckCircle2 className="size-4" strokeWidth={2} />
            )}
            {saving ? "Saving…" : "Add Card"}
          </button>
        </div>
      </div>
    </div>
  )
}
