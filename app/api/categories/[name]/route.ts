import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { deleteCategory } from "@/lib/db/categories"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await deleteCategory(session.user.id, decodeURIComponent(name))
  return new NextResponse(null, { status: 204 })
}
