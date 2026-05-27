import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { auth } from "@/auth"
import { listCategories } from "@/lib/db/categories"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const PALETTE = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#f59e0b", "#84cc16", "#10b981",
  "#06b6d4", "#3b82f6", "#64748b", "#a16207",
]

function pickColor(name: string): string {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return PALETTE[Math.abs(hash) % PALETTE.length]
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
  const accent   = existing?.accent ?? pickColor(rawCategory)

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
