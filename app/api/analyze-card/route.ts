import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { auth } from "@/auth"
import { listCategories } from "@/lib/db/categories"
import { categoryAccentColor } from "@/components/category-badge"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Distinct from the preset category colours in `categoryAccentColor` so a custom
// tag can never share a hue with a preset (e.g. Healthcare's red).
const PALETTE = [
  "#3b82f6", "#06b6d4", "#8b5cf6", "#f43f5e",
  "#22c55e", "#a16207", "#0891b2", "#2563eb",
  "#7e22ce", "#be185d", "#c2410c", "#15803d",
]

// Pick a palette colour the user isn't already using; fall back to a hash slot
// once every colour is taken.
function pickColor(name: string, used: Set<string> = new Set()): string {
  const available = PALETTE.filter((c) => !used.has(c.toLowerCase()))
  const pool = available.length > 0 ? available : PALETTE
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return pool[Math.abs(hash) % pool.length]
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  const userCats = await listCategories(session.user.id)

  const categoryInstruction = userCats.length > 0
    ? `Choose the most relevant category from the user's existing tags: ${userCats.map((c) => c.name).join(", ")}. If none of these fit, suggest a concise new category name (1–2 words, title case).`
    : `Pick the single best matching category from this list: Tech, Design, Finance, Marketing, Legal, Healthcare, Real Estate, Education, Consulting, Sales, Media, Hospitality, Manufacturing, Retail, Other. Only invent a new 1–2 word title-case label if none of these fit.`

  const prompt = `You are an expert OCR and business analyst. Examine this business card image and return ONLY a JSON object — no markdown, no code fences — with exactly these fields:
{
  "name": string,
  "title": string,
  "company": string,
  "email": string,
  "phone": string,
  "website": string,
  "category": string,
  "aiDescription": string
}
For the "category" field: ${categoryInstruction}
The aiDescription should be 1–2 sentences summarising what the company likely does based on its name and branding.`

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
  let result
  try {
    result = await model.generateContent([
      prompt,
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
    name: string; title: string; company: string
    email: string; phone: string; website: string
    category: string; aiDescription: string
  }

  try {
    parsed = JSON.parse(cleaned)
  } catch {
    console.error("[analyze-card] JSON parse failed. Raw:", text)
    return NextResponse.json({ error: "Failed to parse AI response", raw: text }, { status: 500 })
  }

  const rawCategory = (parsed.category || "Other").trim()

  // If the AI picked an existing category (case-insensitive), use its exact name + stored accent.
  // Otherwise it's a new tag — assign a deterministic color from the palette.
  const existing = userCats.find((c) => c.name.toLowerCase() === rawCategory.toLowerCase())
  const tagName  = existing?.name  ?? rawCategory
  const usedColors = new Set<string>([
    ...userCats.map((c) => c.accent.toLowerCase()),
    ...Object.values(categoryAccentColor).map((c) => c.toLowerCase()),
  ])
  const accent   = existing?.accent ?? pickColor(rawCategory, usedColors)

  return NextResponse.json({
    id: "",
    name: parsed.name || "Unknown",
    title: parsed.title || "",
    company: parsed.company || "",
    email: parsed.email || "",
    phone: (parsed.phone || "").split(/[,\/\n|;]/)[0].trim(),
    website: parsed.website || "",
    tags: [{ name: tagName, accent }],
    aiDescription: parsed.aiDescription || "",
    userNotes: "",
    capturedAt: "",
  })
}
