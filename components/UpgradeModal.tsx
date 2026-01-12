'use client'

import { X, Sparkles, Zap, TrendingUp, Eye, Rocket } from 'lucide-react'
import { useState } from 'react'
import { FeatureType, getFeaturePrice, FEATURE_NAMES, FEATURE_DESCRIPTIONS, getPriceId } from '@/lib/stripeConstants'
import { createCheckoutSession } from '@/lib/stripe'
import { useSubscriptionStore } from '@/lib/subscriptionStore'
import { getUserId, getUserEmail } from '@/lib/auth'

interface UpgradeModalProps {
  feature: FeatureType
  onClose: () => void
  trial?: number
}

export function UpgradeModal({ feature, onClose, trial = 7 }: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const refreshProfile = useSubscriptionStore((state) => state.refreshProfile)

  const price = getFeaturePrice(feature)
  const featureName = FEATURE_NAMES[feature]
  const description = FEATURE_DESCRIPTIONS[feature]

  // Get feature icon
  const getFeatureIcon = () => {
    switch (feature) {
      case 'core':
        return <Zap className="w-8 h-8" />
      case 'defi':
        return <TrendingUp className="w-8 h-8" />
      case 'whale':
        return <Eye className="w-8 h-8" />
      case 'magnum':
        return <Rocket className="w-8 h-8" />
      default:
        return <Sparkles className="w-8 h-8" />
    }
  }

  // Get feature highlights
  const getFeatureHighlights = () => {
    switch (feature) {
      case 'core':
        return [
          'Full access to all tracking features',
          'Real-time price alerts',
          'Portfolio management',
          'News feed with AI sentiment',
        ]
      case 'defi':
        return [
          'High-yield staking with Magnum Opus',
          'DeFi execution via Colony OS',
          'Automated strategy recommendations',
          '700%+ APY opportunities',
        ]
      case 'whale':
        return [
          'Real-time whale transaction alerts',
          'Transaction hash details',
          'Amount visibility',
          'Predictive price impact analysis',
        ]
      case 'magnum':
        return [
          'Powered by Magnum Opus',
          '700%+ APY staking opportunities',
          'Automated yield optimization',
          'Colony OS wallet integration',
        ]
      default:
        return []
    }
  }

  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      // Get user ID from auth utility
      const userId = await getUserId()
      const email = await getUserEmail()

      if (!userId) {
        alert('Please log in to subscribe')
        setIsLoading(false)
        return
      }

      const priceId = getPriceId(feature)
      
      const session = await createCheckoutSession({
        priceId,
        feature,
        trial,
        userId,
        email,
      })

      // Redirect to Stripe Checkout
      if (session.url) {
        window.location.href = session.url
      }
    } catch (error: any) {
      console.error('Failed to create checkout session:', error)
      alert(`Failed to start checkout: ${error.message}`)
      setIsLoading(false)
    }
  }

  const highlights = getFeatureHighlights()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-purple-500/30 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 border-b border-purple-500/20">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white">
              {getFeatureIcon()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Unlock {featureName}
              </h2>
              <p className="text-gray-400 text-sm">{description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Pricing */}
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">${price}</span>
              <span className="text-gray-400">/month</span>
            </div>
            {trial > 0 && (
              <div className="mt-2 text-sm text-purple-300">
                Start with a {trial}-day free trial
              </div>
            )}
          </div>

          {/* Features List */}
          {highlights.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-white">What's included:</h3>
              <ul className="space-y-2">
                {highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                    <span className="text-gray-300 text-sm">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Special highlight for Magnum/DeFi */}
          {(feature === 'magnum' || feature === 'defi') && (
            <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-xl p-4 border border-yellow-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <span className="font-semibold text-yellow-400">High-Yield Opportunity</span>
              </div>
              <p className="text-sm text-yellow-200">
                Unlock access to Magnum Opus staking strategies with up to 700%+ APY. 
                The monthly subscription pays for itself in days with active staking.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-purple-500/20 space-y-3">
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-purple-500/50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {trial > 0 ? `Start ${trial}-Day Trial` : 'Subscribe Now'}
              </>
            )}
          </button>
          
          <p className="text-xs text-center text-gray-500">
            Cancel anytime. Secure payment via Stripe.
          </p>
        </div>
      </div>
    </div>
  )
}
