import './globals.css'
import type { Metadata } from 'next'
import { HapticProvider } from '@/components/HapticProvider'

export const metadata: Metadata = {
  title: 'Krypto Kings - Built for Kings 👑',
  description: 'Track your crypto portfolio like royalty. Real-time data, luxury themes, and premium features for crypto kings.',
  icons: {
    icon: '/kk-logo.png',
    apple: '/kk-logo.png',
  },
  openGraph: {
    title: 'Krypto Kings - Built for Kings 👑',
    description: 'Track your crypto portfolio like royalty',
    url: 'https://kryptokings.app',
    siteName: 'Krypto Kings',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <HapticProvider>
          {children}
        </HapticProvider>
      </body>
    </html>
  )
}
