import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Category } from "@/lib/types"

export async function GET() {
  const cards = await prisma.businessCard.findMany({
    orderBy: { capturedAt: "desc" },
  })

  return NextResponse.json(
    cards.map((card) => ({
      id: card.id,
      name: card.name,
      title: card.title,
      company: card.company,
      email: card.email,
      phone: card.phone,
      website: card.website,
      category: card.category as Category,
      aiDescription: card.aiDescription,
      userNotes: card.userNotes,
      imagePath: card.imagePath,
      accent: card.accent,
      capturedAt: card.capturedAt.toISOString(),
    }))
  )
}
