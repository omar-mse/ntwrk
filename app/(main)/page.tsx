import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { listCards } from "@/lib/db/cards"
import { DashboardView } from "@/components/dashboard-view"

export default async function HomePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const cards = await listCards(session.user.id)

  return <DashboardView initialCards={cards} />
}
