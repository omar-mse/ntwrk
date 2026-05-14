import { DashboardView } from "@/components/dashboard-view"
import { mockCards } from "@/lib/mock-data"

export default function HomePage() {
  return <DashboardView initialCards={mockCards} />
}
