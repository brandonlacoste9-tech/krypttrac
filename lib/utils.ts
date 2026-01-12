import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value: number, decimals: number = 2): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(decimals)}T`
  if (value >= 1e9) return `${(value / 1e9).toFixed(decimals)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(decimals)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(decimals)}K`
  return value.toFixed(decimals)
}

export function formatPercentage(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value)
}

export function getChangeColor(change: number): string {
  if (change > 0) return 'text-green-400'
  if (change < 0) return 'text-red-400'
  return 'text-gray-400'
}

export function getChangeBgColor(change: number): string {
  if (change > 0) return 'bg-green-500/10 border-green-500/30'
  if (change < 0) return 'bg-red-500/10 border-red-500/30'
  return 'bg-gray-500/10 border-gray-500/30'
}
