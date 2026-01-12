import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { NewsPageClient } from './NewsPageClient'

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      <NewsPageClient />
      <Footer />
    </div>
  )
}
