import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Krypttrac - Built for Kings 👑',
  description: 'Track your bag like a king. Real-time data, luxury themes, and that royal energy.',
  icons: {
    icon: '/kk-logo.png',
    apple: '/kk-logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
