'use client'

import { Trophy, Crown, Star, Zap, TrendingUp, DollarSign, Target, Award } from 'lucide-react'

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  unlocked: boolean
  progress?: number
  maxProgress?: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
}

const achievements: Achievement[] = [
  {
    id: 'first-trade',
    title: 'First Steps',
    description: 'Make your first trade',
    icon: <Star className="w-6 h-6" />,
    unlocked: true,
    tier: 'bronze',
  },
  {
    id: 'portfolio-10k',
    title: 'Rising King',
    description: 'Reach $10,000 portfolio value',
    icon: <DollarSign className="w-6 h-6" />,
    unlocked: true,
    tier: 'silver',
  },
  {
    id: 'portfolio-100k',
    title: 'Crypto Royalty',
    description: 'Reach $100,000 portfolio value',
    icon: <Crown className="w-6 h-6" />,
    unlocked: false,
    progress: 127543,
    maxProgress: 100000,
    tier: 'gold',
  },
  {
    id: 'streak-7',
    title: 'Consistent King',
    description: 'Check in 7 days in a row',
    icon: <Zap className="w-6 h-6" />,
    unlocked: false,
    progress: 3,
    maxProgress: 7,
    tier: 'silver',
  },
  {
    id: 'top-gainer',
    title: 'Moon Master',
    description: 'Hold a coin that gains 50% in 24h',
    icon: <TrendingUp className="w-6 h-6" />,
    unlocked: false,
    tier: 'gold',
  },
  {
    id: 'watchlist-10',
    title: 'Watchful Eye',
    description: 'Add 10 coins to watchlist',
    icon: <Target className="w-6 h-6" />,
    unlocked: false,
    progress: 5,
    maxProgress: 10,
    tier: 'bronze',
  },
]

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'platinum': return 'from-purple-600 to-pink-600'
    case 'gold': return 'from-yellow-600 to-yellow-500'
    case 'silver': return 'from-gray-400 to-gray-300'
    case 'bronze': return 'from-orange-600 to-orange-500'
    default: return 'from-gray-600 to-gray-500'
  }
}

export function Achievements() {
  const unlockedCount = achievements.filter(a => a.unlocked).length
  const totalCount = achievements.length

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-2">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Achievements</h3>
              <p className="text-gray-400 text-sm">
                {unlockedCount} of {totalCount} unlocked
              </p>
            </div>
          </div>
          <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {Math.round((unlockedCount / totalCount) * 100)}%
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement) => {
          const progressPercent = achievement.progress && achievement.maxProgress
            ? Math.min((achievement.progress / achievement.maxProgress) * 100, 100)
            : achievement.unlocked ? 100 : 0

          return (
            <div
              key={achievement.id}
              className={`p-4 rounded-xl border transition ${
                achievement.unlocked
                  ? `bg-gradient-to-br ${getTierColor(achievement.tier)}/20 border-${achievement.tier === 'platinum' ? 'purple' : achievement.tier === 'gold' ? 'yellow' : achievement.tier === 'silver' ? 'gray' : 'orange'}-500/50`
                  : 'bg-slate-900/50 border-slate-700 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2 rounded-lg ${
                  achievement.unlocked
                    ? `bg-gradient-to-br ${getTierColor(achievement.tier)}`
                    : 'bg-slate-700'
                }`}>
                  <div className={achievement.unlocked ? 'text-white' : 'text-gray-500'}>
                    {achievement.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold text-sm ${achievement.unlocked ? 'text-white' : 'text-gray-400'}`}>
                    {achievement.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {achievement.description}
                  </p>
                </div>
              </div>

              {achievement.progress !== undefined && achievement.maxProgress && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-gray-400">
                      {achievement.progress} / {achievement.maxProgress}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${getTierColor(achievement.tier)} transition-all`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {achievement.unlocked && (
                <div className="mt-3 flex items-center gap-1 text-xs">
                  <Award className="w-3 h-3 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">Unlocked!</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
