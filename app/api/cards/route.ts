import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { rowToCard } from "@/lib/supabase/cards"
import { categoryAccentColor } from "@/components/category-badge"
import type { CustomCategory } from "@/lib/types"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const tags: CustomCategory[] =
    Array.isArray(body.tags) && body.tags.length > 0
      ? body.tags
      : [{ name: "Other", accent: categoryAccentColor.Other }]

  const { data: row, error } = await supabase
    .from("cards")
    .insert({
      user_id: user.id,
      name: body.name || "Unknown",
      title: body.title || "",
      company: body.company || "",
      email: body.email || "",
      phone: body.phone || "",
      website: body.website || "",
      tags,
      ai_description: body.aiDescription || "",
      user_notes: "",
    })
    .select()
    .single()

  if (error) {
    console.error("[cards] DB insert error:", error.message)
    return NextResponse.json({ error: "Failed to save card", detail: error.message }, { status: 500 })
  }

  // Upsert all AI-assigned tags into user_categories so they appear in future pickers
  await supabase.from("user_categories").upsert(
    tags.map((t) => ({ user_id: user.id, name: t.name, accent: t.accent })),
    { onConflict: "user_id,name", ignoreDuplicates: true }
  )

  return NextResponse.json(rowToCard(row))
}
