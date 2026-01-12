import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { WatchlistClient } from './WatchlistClient'

export default function WatchlistPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      <WatchlistClient />
      <Footer />
    </div>
  )
}
