'use client'

import { Shield, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface FortKnoxBadgeProps {
  variant?: 'default' | 'small' | 'large'
  showText?: boolean
  className?: string
}

export function FortKnoxBadge({
  variant = 'default',
  showText = true,
  className = '',
}: FortKnoxBadgeProps) {
  const sizes = {
    small: 'w-4 h-4',
    default: 'w-5 h-5',
    large: 'w-6 h-6',
  }

  const textSizes = {
    small: 'text-xs',
    default: 'text-sm',
    large: 'text-base',
  }

  return (
    <Link
      href="/security"
      className={`inline-flex items-center gap-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-500/30 rounded-lg px-3 py-1.5 transition-all group ${className}`}
    >
      <div className="relative">
        <Shield className={`${sizes[variant]} text-purple-400 group-hover:text-purple-300 transition-colors`} />
        <Sparkles className={`${sizes[variant]} text-yellow-400 absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity`} />
      </div>
      {showText && (
        <span className={`font-semibold ${textSizes[variant]} text-purple-300 group-hover:text-purple-200 transition-colors`}>
          Fort Knox Verified
        </span>
      )}
    </Link>
  )
}
