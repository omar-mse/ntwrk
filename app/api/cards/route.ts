import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { createCard } from "@/lib/db/cards"
import { toPresetTags } from "@/components/category-badge"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  // Categories are a fixed set — coerce any incoming tags to presets only.
  const tags = toPresetTags(Array.isArray(body.tags) ? body.tags : undefined)

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

  return NextResponse.json(card)
}
