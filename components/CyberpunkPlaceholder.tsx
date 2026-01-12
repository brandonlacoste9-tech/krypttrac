'use client'

/**
 * Cyberpunk/Neon placeholder image component
 * Used when news images fail to load
 */
export function CyberpunkPlaceholder({ coinName }: { coinName?: string }) {
  const symbol = coinName ? coinName.charAt(0).toUpperCase() : 'K'
  
  return (
    <div className="w-full h-full bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 flex items-center justify-center relative overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }} />
      </div>
      
      {/* Neon glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-500/20 animate-pulse" />
      
      {/* Symbol */}
      <div className="relative z-10">
        <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">
          {symbol}
        </div>
      </div>
      
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-purple-400 opacity-50" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-pink-400 opacity-50" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-purple-400 opacity-50" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-pink-400 opacity-50" />
    </div>
  )
}
