import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { rowToCard } from "@/lib/supabase/cards"
import { DashboardView } from "@/components/dashboard-view"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: cards }, { data: categories }] = await Promise.all([
    supabase.from("cards").select("*").order("captured_at", { ascending: false }),
    supabase.from("user_categories").select("name, accent").order("created_at", { ascending: true }),
  ])

  return (
    <DashboardView
      initialCards={(cards ?? []).map(rowToCard)}
      initialCustomCategories={categories ?? []}
    />
  )
}
