// ============================================
// Krypto Trac: Subtle Edge Radiance Component
// Top-down lighting with state-based glow
// ============================================

'use client'

import { useEffect, useState } from 'react'

export type RadianceState = 'idle' | 'active' | 'sentinel' | 'critical'

interface EdgeRadianceProps {
  state?: RadianceState
  intensity?: number // 0-100
  className?: string
  children: React.ReactNode
}

export default function EdgeRadiance({
  state = 'idle',
  intensity,
  className = '',
  children,
}: EdgeRadianceProps) {
  const [glowIntensity, setGlowIntensity] = useState(0.1)

  useEffect(() => {
    // Calculate glow intensity based on state
    let targetIntensity = 0.1 // Default idle (10%)

    switch (state) {
      case 'idle':
        targetIntensity = 0.1 // 10% - Neutral, low-saturation gold
        break
      case 'active':
        targetIntensity = 0.6 // 60% - Magnum Gold
        break
      case 'sentinel':
        targetIntensity = 0.4 // 40% - Subtle gold pulse
        break
      case 'critical':
        targetIntensity = 0.8 // 80% - Red pulsing
        break
    }

    // Override with custom intensity if provided
    if (intensity !== undefined) {
      targetIntensity = intensity / 100
    }

    setGlowIntensity(targetIntensity)
  }, [state, intensity])

  // Get color based on state
  const getGlowColor = () => {
    switch (state) {
      case 'idle':
        return 'rgba(168, 139, 61, 0.1)' // Low-saturation gold
      case 'active':
        return 'rgba(244, 192, 37, 0.6)' // Magnum Gold
      case 'sentinel':
        return 'rgba(244, 192, 37, 0.4)' // Gold pulse
      case 'critical':
        return 'rgba(220, 38, 38, 0.8)' // Red pulsing
      default:
        return 'rgba(168, 139, 61, 0.1)'
    }
  }

  // Get animation class based on state
  const getAnimationClass = () => {
    if (state === 'critical') {
      return 'animate-pulse' // Low-frequency pulsing for Sentinel alerts
    }
    if (state === 'sentinel') {
      return 'animate-pulse' // Subtle pulse
    }
    return '' // No animation for idle/active
  }

  return (
    <div className={`relative ${className}`}>
      {/* Top Edge Glow - Brightest at top, fading downward */}
      <div
        className={`
          absolute inset-0 pointer-events-none rounded-lg
          ${getAnimationClass()}
        `}
        style={{
          background: `linear-gradient(
            180deg,
            ${getGlowColor()} 0%,
            ${getGlowColor().replace(/[\d.]+(?=\))/, (match) => String(parseFloat(match) * 0.5))} 50%,
            transparent 100%
          )`,
          opacity: glowIntensity,
          boxShadow: `
            0 -2px 8px ${getGlowColor()},
            0 -1px 4px ${getGlowColor()},
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
          `,
        }}
      />

      {/* Side Edge Glow - Subtle side lighting */}
      <div
        className="absolute inset-0 pointer-events-none rounded-lg"
        style={{
          background: `
            linear-gradient(90deg, ${getGlowColor()} 0%, transparent 5%),
            linear-gradient(270deg, ${getGlowColor()} 0%, transparent 5%)
          `,
          opacity: glowIntensity * 0.5,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
