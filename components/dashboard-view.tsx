"use client"

import { useState, useMemo } from "react"
import type { ContactCard } from "@/lib/types"
import { CardGrid } from "./card-grid"
import { useSearch } from "./search-provider"

interface DashboardViewProps {
  initialCards: ContactCard[]
}

export function DashboardView({ initialCards }: DashboardViewProps) {
  const [cards, setCards] = useState<ContactCard[]>(initialCards)
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(initialCards.map((c) => [c.id, c.userNotes]))
  )
  const { query } = useSearch()

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return cards
    return cards.filter((c) =>
      [c.name, c.title, c.company, c.email, c.phone, c.website, c.category, c.aiDescription, notes[c.id] ?? ""]
        .some((field) => field.toLowerCase().includes(q))
    )
  }, [query, cards, notes])

  function handleUpload(newCard: ContactCard) {
    setCards((prev) => [newCard, ...prev])
    setNotes((prev) => ({ ...prev, [newCard.id]: "" }))
  }

  async function handleNotesChange(id: string, value: string) {
    setNotes((prev) => ({ ...prev, [id]: value }))
    await fetch(`/api/cards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userNotes: value }),
    })
  }

  async function handleDelete(id: string) {
    setCards((prev) => prev.filter((c) => c.id !== id))
    setNotes((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    await fetch(`/api/cards/${id}`, { method: "DELETE" })
  }

  async function handleCategoryChange(id: string, category: string, accent: string) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, category, accent } : c)))
    await fetch(`/api/cards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, accent }),
    })
  }

  return (
    <main className="mx-auto w-full max-w-screen-2xl px-4 py-8 sm:px-8 lg:px-12 xl:px-16">
      <div className="mb-8">
        <h1
          className="font-display text-3xl tracking-tight text-foreground sm:text-4xl"
          style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
        >
          Your Cards
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {query.trim()
            ? `${filteredCards.length} of ${cards.length} ${cards.length === 1 ? "contact" : "contacts"} match "${query.trim()}"`
            : `${cards.length} ${cards.length === 1 ? "contact" : "contacts"} · scan a card to add more`}
        </p>
      </div>

      {query.trim() && filteredCards.length === 0 && (
        <p className="mb-6 text-sm text-muted-foreground">
          No matches for &ldquo;{query.trim()}&rdquo;
        </p>
      )}

      <CardGrid
        cards={filteredCards}
        notes={notes}
        onUpload={handleUpload}
        onNotesChange={handleNotesChange}
        onDelete={handleDelete}
        onCategoryChange={(id, cat, accent) => handleCategoryChange(id, cat, accent)}
      />
    </main>
  )
}
