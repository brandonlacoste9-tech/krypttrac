'use client'

import { ArrowUpRight } from 'lucide-react'
import { getAffiliateUrl, getCoinSymbol, isAffiliateEnabled } from '@/lib/affiliate'

interface TradeButtonProps {
  coinName: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'minimal'
}

export function TradeButton({ coinName, size = 'sm', variant = 'default' }: TradeButtonProps) {
  if (!isAffiliateEnabled()) {
    return null
  }

  const affiliateUrl = getAffiliateUrl(coinName)
  const symbol = getCoinSymbol(coinName)

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  const baseClasses = variant === 'default'
    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all hover:scale-105 shadow-lg'
    : 'bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 rounded px-2 py-0.5 text-xs transition'

  return (
    <a
      href={affiliateUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        // Track affiliate click
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'affiliate_click', {
            coin: coinName,
            symbol: symbol,
          })
        }
      }}
      className={`inline-flex items-center gap-1 ${baseClasses} ${sizeClasses[size]}`}
    >
      <span>Trade {symbol}</span>
      <ArrowUpRight className="w-3 h-3" />
    </a>
  )
}
