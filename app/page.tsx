import { prisma } from "@/lib/prisma"
import { DashboardView } from "@/components/dashboard-view"
import type { ContactCard } from "@/lib/types"

export default async function HomePage() {
  const rows = await prisma.businessCard.findMany({
    orderBy: { capturedAt: "desc" },
  })

  const initialCards: ContactCard[] = rows.map((card) => ({
    id: card.id,
    name: card.name,
    title: card.title,
    company: card.company,
    email: card.email,
    phone: card.phone,
    website: card.website,
    category: card.category as ContactCard["category"],
    aiDescription: card.aiDescription,
    userNotes: card.userNotes,
    capturedAt: card.capturedAt.toISOString(),
    accent: card.accent ?? undefined,
  }))

  return <DashboardView initialCards={initialCards} />
}
