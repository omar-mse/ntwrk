import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@/lib/supabase/server"
import { rowToCard } from "@/lib/supabase/cards"
import type { Category } from "@/lib/types"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const PROMPT = `You are an expert OCR and business analyst. Examine this business card image and return ONLY a JSON object — no markdown, no code fences — with exactly these fields:
{
  "name": string,
  "title": string,
  "company": string,
  "email": string,
  "phone": string,
  "website": string,
  "category": "Tech" | "Design" | "Finance" | "Legal" | "Marketing" | "Other",
  "aiDescription": string
}
The aiDescription should be 1–2 sentences summarising what the company likely does based on its name and branding.`

const CATEGORY_ACCENTS: Record<string, string> = {
  Tech: "#3b82f6",
  Design: "#f59e0b",
  Finance: "#10b981",
  Legal: "#8b5cf6",
  Marketing: "#ec4899",
  Other: "#64748b",
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
  let result
  try {
    result = await model.generateContent([
      PROMPT,
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp" | "image/heic" | "image/heif",
        },
      },
    ])
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[analyze-card] Gemini error:", message)
    return NextResponse.json({ error: "Gemini request failed", detail: message }, { status: 502 })
  }

  const text = result.response.text().trim()
  const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim()

  let parsed: {
    name: string
    title: string
    company: string
    email: string
    phone: string
    website: string
    category: string
    aiDescription: string
  }

  try {
    parsed = JSON.parse(cleaned)
  } catch {
    console.error("[analyze-card] JSON parse failed. Raw:", text)
    return NextResponse.json({ error: "Failed to parse AI response", raw: text }, { status: 500 })
  }

  const category = (parsed.category in CATEGORY_ACCENTS ? parsed.category : "Other") as Category

  const { data: row, error } = await supabase
    .from("cards")
    .insert({
      user_id: user.id,
      name: parsed.name || "Unknown",
      title: parsed.title || "",
      company: parsed.company || "",
      email: parsed.email || "",
      phone: parsed.phone || "",
      website: parsed.website || "",
      category,
      ai_description: parsed.aiDescription || "",
      user_notes: "",
      accent: CATEGORY_ACCENTS[category],
    })
    .select()
    .single()

  if (error) {
    console.error("[analyze-card] DB insert error:", error.message)
    return NextResponse.json({ error: "Failed to save card", detail: error.message }, { status: 500 })
  }

  return NextResponse.json(rowToCard(row))
}
