import type { ContactCard } from "@/lib/types"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToCard(row: any): ContactCard {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    company: row.company,
    email: row.email,
    phone: row.phone,
    website: row.website,
    category: row.category,
    aiDescription: row.ai_description,
    userNotes: row.user_notes,
    accent: row.accent ?? undefined,
    capturedAt: row.captured_at,
  }
}
