'use client'

import { Settings, CreditCard } from 'lucide-react'
import { useState } from 'react'

interface ManageSubscriptionProps {
  customerId?: string
  className?: string
}

export function ManageSubscription({ customerId, className = '' }: ManageSubscriptionProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleManageSubscription = async () => {
    if (!customerId) {
      alert('Customer ID not found. Please contact support.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          returnUrl: window.location.href,
        }),
      })

      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No portal URL returned')
      }
    } catch (error: any) {
      console.error('Failed to open customer portal:', error)
      alert(`Failed to open subscription management: ${error.message}`)
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleManageSubscription}
      disabled={isLoading || !customerId}
      className={`flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <CreditCard className="w-4 h-4" />
      {isLoading ? 'Loading...' : 'Manage Subscription'}
    </button>
  )
}
