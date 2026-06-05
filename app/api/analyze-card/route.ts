import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { auth } from "@/auth"
import { categoryAccentColor, coerceToPreset, PRESET_CATEGORIES } from "@/components/category-badge"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  // Categories are a fixed set — the AI must pick exactly one preset, never invent a label.
  const categoryInstruction = `Pick the single best matching category from this exact list: ${PRESET_CATEGORIES.join(", ")}. Use exactly one of these names verbatim. Never invent a new category — if none clearly fit, use "Other".`

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

  // Coerce whatever the AI returned to a canonical preset (or "Other").
  const tagName = coerceToPreset(parsed.category || "Other")
  const accent  = categoryAccentColor[tagName]

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
