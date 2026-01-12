'use client'

import { ReactNode } from 'react'
import { Lock, Sparkles } from 'lucide-react'
import { useSubscriptionStore } from '@/lib/subscriptionStore'
import { UpgradeModal } from './UpgradeModal'
import { useState } from 'react'
import { FeatureType } from '@/lib/stripeConstants'

interface FeatureGateProps {
  feature: FeatureType
  children: ReactNode
  fallback?: ReactNode
  showUpgrade?: boolean
  blurIntensity?: 'light' | 'medium' | 'heavy'
  className?: string
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgrade = true,
  blurIntensity = 'medium',
  className = '',
}: FeatureGateProps) {
  const hasFeature = useSubscriptionStore((state) => state.hasFeature(feature))
  const [showModal, setShowModal] = useState(false)

  // If user has access, render children normally
  if (hasFeature) {
    return <>{children}</>
  }

  // Blur intensity classes
  const blurClasses = {
    light: 'backdrop-blur-sm',
    medium: 'backdrop-blur-md',
    heavy: 'backdrop-blur-lg',
  }

  // Render with glassmorphism blur overlay
  return (
    <>
      <div className={`relative ${className}`}>
        {/* Blurred content */}
        <div className={blurClasses[blurIntensity]} style={{ filter: 'blur(8px)' }}>
          {children}
        </div>

        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-slate-900/60 backdrop-blur-xl rounded-xl flex items-center justify-center border border-purple-500/30">
          <div className="text-center p-6 space-y-4 max-w-md">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">
              Premium Feature Locked
            </h3>
            
            <p className="text-gray-300 text-sm mb-6">
              Unlock this feature to access premium content and tools.
            </p>

            {showUpgrade && (
              <button
                onClick={() => setShowModal(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-purple-500/50"
              >
                <Sparkles className="w-4 h-4 inline-block mr-2" />
                Unlock Feature
              </button>
            )}

            {fallback && (
              <div className="mt-4">
                {fallback}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showModal && (
        <UpgradeModal
          feature={feature}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
