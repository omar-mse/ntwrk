import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { rowToCard } from "@/lib/supabase/cards"
import { DashboardView } from "@/components/dashboard-view"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data } = await supabase
    .from("cards")
    .select("*")
    .order("captured_at", { ascending: false })

  return <DashboardView initialCards={(data ?? []).map(rowToCard)} />
}
