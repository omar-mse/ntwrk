import { createClient } from "@/lib/supabase/server"
import { SiteHeader } from "@/components/site-header"

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader userEmail={user?.email} />
      {children}
    </div>
  )
}
