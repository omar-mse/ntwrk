import { auth } from "@/auth"
import { SiteHeader } from "@/components/site-header"

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader userEmail={session?.user?.email ?? undefined} />
      {children}
    </div>
  )
}
