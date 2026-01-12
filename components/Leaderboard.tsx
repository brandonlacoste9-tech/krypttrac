'use client'

import { Crown, Trophy, TrendingUp, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface LeaderboardEntry {
  rank: number
  username: string
  tier: 'silver' | 'gold' | 'platinum'
  portfolioValue: number
  change24h: number
  avatar?: string
}

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, username: 'CryptoWhale', tier: 'platinum', portfolioValue: 2450000, change24h: 12.5 },
  { rank: 2, username: 'DiamondHands', tier: 'platinum', portfolioValue: 1890000, change24h: 8.3 },
  { rank: 3, username: 'MoonKing', tier: 'gold', portfolioValue: 1560000, change24h: 15.2 },
  { rank: 4, username: 'HodlMaster', tier: 'gold', portfolioValue: 1240000, change24h: 6.7 },
  { rank: 5, username: 'AlphaTrader', tier: 'silver', portfolioValue: 980000, change24h: 9.1 },
  { rank: 6, username: 'BullRun', tier: 'silver', portfolioValue: 875000, change24h: 11.4 },
  { rank: 7, username: 'KingOfCrypto', tier: 'gold', portfolioValue: 765000, change24h: 7.8 },
  { rank: 8, username: 'CryptoElite', tier: 'silver', portfolioValue: 654000, change24h: 5.2 },
]

export function Leaderboard() {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />
    if (rank === 2) return <Trophy className="w-6 h-6 text-gray-300" />
    if (rank === 3) return <Trophy className="w-6 h-6 text-orange-400" />
    return <span className="text-gray-400 font-bold">#{rank}</span>
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'from-purple-600 to-pink-600'
      case 'gold': return 'from-yellow-600 to-yellow-500'
      case 'silver': return 'from-gray-400 to-gray-300'
      default: return 'from-gray-600 to-gray-500'
    }
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-2">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Kings Leaderboard</h3>
              <p className="text-gray-400 text-sm">Top performers this week</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-purple-400">
            <Users className="w-5 h-5" />
            <span className="text-sm font-semibold">{mockLeaderboard.length} Kings</span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-slate-800">
        {mockLeaderboard.map((entry) => (
          <div
            key={entry.rank}
            className="p-4 hover:bg-slate-800/50 transition flex items-center gap-4"
          >
            <div className="flex-shrink-0 w-10 flex items-center justify-center">
              {getRankIcon(entry.rank)}
            </div>
            
            <div className="flex-1 flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getTierColor(entry.tier)} flex items-center justify-center text-white font-bold text-sm`}>
                {entry.username[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{entry.username}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r ${getTierColor(entry.tier)} text-white`}>
                    {entry.tier.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-gray-400">
                    {formatCurrency(entry.portfolioValue)}
                  </span>
                  <div className="flex items-center gap-1 text-green-400">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs font-semibold">+{entry.change24h}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-slate-900/50 border-t border-slate-800 text-center">
        <button className="text-sm text-purple-400 hover:text-purple-300 transition">
          View Full Leaderboard →
        </button>
      </div>
    </div>
  )
}
