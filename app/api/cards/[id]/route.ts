import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const data: Record<string, string> = {}
  if (body.userNotes !== undefined) data.userNotes = body.userNotes
  if (body.category !== undefined) data.category = body.category
  if (body.accent !== undefined) data.accent = body.accent

  const card = await prisma.businessCard.update({ where: { id }, data })

  return NextResponse.json({ userNotes: card.userNotes, category: card.category })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.businessCard.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
