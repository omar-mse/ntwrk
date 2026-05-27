import { prisma } from "@/lib/prisma"
import type { ContactCard, CustomCategory } from "@/lib/types"
import type { Card } from "@prisma/client"

export function rowToCard(row: Card): ContactCard {
  let tags: CustomCategory[] = []
  try {
    tags = JSON.parse(row.tags)
  } catch {
    tags = []
  }
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    company: row.company,
    email: row.email,
    phone: row.phone,
    website: row.website,
    tags,
    aiDescription: row.aiDescription,
    userNotes: row.userNotes,
    capturedAt: row.capturedAt.toISOString(),
  }
}

export async function listCards(userId: string): Promise<ContactCard[]> {
  const rows = await prisma.card.findMany({
    where: { userId },
    orderBy: { capturedAt: "desc" },
  })
  return rows.map(rowToCard)
}

export async function createCard(
  userId: string,
  data: Omit<ContactCard, "id" | "capturedAt">
): Promise<ContactCard> {
  const row = await prisma.card.create({
    data: {
      userId,
      name: data.name,
      title: data.title,
      company: data.company,
      email: data.email,
      phone: data.phone,
      website: data.website,
      aiDescription: data.aiDescription,
      userNotes: data.userNotes,
      tags: JSON.stringify(data.tags),
    },
  })
  return rowToCard(row)
}

export async function updateCard(
  userId: string,
  id: string,
  data: { userNotes?: string; tags?: CustomCategory[] }
): Promise<{ userNotes: string; tags: CustomCategory[] } | null> {
  const updateData: Record<string, unknown> = {}
  if (data.userNotes !== undefined) updateData.userNotes = data.userNotes
  if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags)

  const { count } = await prisma.card.updateMany({
    where: { id, userId },
    data: updateData,
  })
  if (count === 0) return null

  const row = await prisma.card.findUnique({ where: { id } })
  if (!row) return null

  let tags: CustomCategory[] = []
  try { tags = JSON.parse(row.tags) } catch { tags = [] }
  return { userNotes: row.userNotes, tags }
}

export async function deleteCard(userId: string, id: string): Promise<boolean> {
  const { count } = await prisma.card.deleteMany({ where: { id, userId } })
  return count > 0
}
