import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { listCategories, upsertCategory } from "@/lib/db/categories"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const categories = await listCategories(session.user.id)
  return NextResponse.json(categories)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, accent } = await request.json()
  if (!name?.trim() || !accent) {
    return NextResponse.json({ error: "name and accent are required" }, { status: 400 })
  }

  const category = await upsertCategory(session.user.id, name.trim(), accent)
  return NextResponse.json(category)
}
