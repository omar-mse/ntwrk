import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { createCard, rowToCard } from "@/lib/db/cards"
import { upsertCategoriesIgnoreDuplicates } from "@/lib/db/categories"
import { categoryAccentColor } from "@/components/category-badge"
import type { CustomCategory } from "@/lib/types"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const tags: CustomCategory[] =
    Array.isArray(body.tags) && body.tags.length > 0
      ? body.tags
      : [{ name: "Other", accent: categoryAccentColor.Other }]

  const card = await createCard(session.user.id, {
    name: body.name || "Unknown",
    title: body.title || "",
    company: body.company || "",
    email: body.email || "",
    phone: body.phone || "",
    website: body.website || "",
    aiDescription: body.aiDescription || "",
    userNotes: "",
    tags,
  })

  await upsertCategoriesIgnoreDuplicates(session.user.id, tags)

  return NextResponse.json(card)
}
