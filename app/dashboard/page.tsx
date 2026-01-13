import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { DashboardClient } from './DashboardClient'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      <DashboardClient />
      <Footer />
    </div>
  )
}
