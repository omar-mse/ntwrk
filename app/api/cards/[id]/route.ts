import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { updateCard, deleteCard } from "@/lib/db/cards"
import { toPresetTags } from "@/components/category-badge"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const result = await updateCard(session.user.id, id, {
    userNotes: body.userNotes,
    // Categories are a fixed set — coerce any incoming tags to presets only.
    tags: body.tags !== undefined ? toPresetTags(body.tags) : undefined,
  })

  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(result)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const deleted = await deleteCard(session.user.id, id)
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return new NextResponse(null, { status: 204 })
}
