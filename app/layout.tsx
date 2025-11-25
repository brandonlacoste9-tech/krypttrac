import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Krypttrac - Built for Kings 👑',
  description: 'Track your bag like a king. Real-time data, luxury themes, and that royal energy.',
  icons: {
    icon: '/kk-logo.png', // Your crown logo
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
