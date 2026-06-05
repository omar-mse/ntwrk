import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { listCategories } from "@/lib/db/categories"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const categories = await listCategories(session.user.id)
  return NextResponse.json(categories)
}

// Categories are a fixed preset set — creating custom categories is no longer allowed.
export async function POST() {
  return NextResponse.json(
    { error: "Custom categories are not allowed; choose from the preset categories." },
    { status: 403 }
  )
}
