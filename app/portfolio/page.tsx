import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { PortfolioClient } from './PortfolioClient'

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      <PortfolioClient />
      <Footer />
    </div>
  )
}
