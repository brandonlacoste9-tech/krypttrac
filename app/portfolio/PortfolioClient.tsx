'use client'

import { useState } from 'react'
import { Wallet, TrendingUp, TrendingDown, Plus, PieChart, BarChart3 } from 'lucide-react'
import { PriceChart } from '@/components/PriceChart'
import { useAppStore } from '@/lib/store'
import { formatCurrency, formatPercentage, getChangeColor } from '@/lib/utils'

interface Holding {
  coinId: string
  symbol: string
  name: string
  image: string
  amount: number
  avgPrice: number
  currentPrice: number
  value: number
  change24h: number
  profit: number
  profitPercent: number
}

export function PortfolioClient() {
  const { connectedWallet } = useAppStore()
  const [holdings, setHoldings] = useState<Holding[]>([
    {
      coinId: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
      amount: 0.5,
      avgPrice: 42000,
      currentPrice: 43567.89,
      value: 21783.95,
      change24h: 5.23,
      profit: 783.95,
      profitPercent: 3.73,
    },
    {
      coinId: 'ethereum',
      symbol: 'ETH',
      name: 'Ethereum',
      image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
      amount: 10,
      avgPrice: 2800,
      currentPrice: 2845.32,
      value: 28453.20,
      change24h: 3.45,
      profit: 453.20,
      profitPercent: 1.62,
    },
  ])

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0)
  const totalCost = holdings.reduce((sum, h) => sum + (h.amount * h.avgPrice), 0)
  const totalProfit = totalValue - totalCost
  const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0

  const chartData = holdings.map((h, i) => [
    Date.now() - (holdings.length - i) * 86400000,
    h.currentPrice,
  ]) as Array<[number, number]>

  if (!connectedWallet) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-8">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-12 text-center max-w-2xl mx-auto">
          <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">
            Connect your wallet to automatically track your portfolio, or manually add your holdings.
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-semibold transition-all hover:scale-105">
            Connect Wallet
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">My Portfolio</h1>
          <p className="text-gray-400 mt-2">Track your crypto holdings</p>
        </div>
        <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-semibold transition-all hover:scale-105 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Holding
        </button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
          <div className="text-gray-400 text-sm mb-2">Total Value</div>
          <div className="text-3xl font-bold text-white">{formatCurrency(totalValue)}</div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
          <div className="text-gray-400 text-sm mb-2">Total Profit/Loss</div>
          <div className={`text-3xl font-bold ${getChangeColor(totalProfitPercent)}`}>
            {formatCurrency(totalProfit)} ({formatPercentage(totalProfitPercent)})
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
          <div className="text-gray-400 text-sm mb-2">Total Cost</div>
          <div className="text-3xl font-bold text-white">{formatCurrency(totalCost)}</div>
        </div>
      </div>

      {/* Portfolio Chart */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Portfolio Performance</h3>
        <PriceChart data={chartData} height={300} />
      </div>

      {/* Holdings Table */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-2xl font-bold text-white">Holdings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="px-6 py-4 text-gray-400 font-semibold text-sm">Asset</th>
                <th className="px-6 py-4 text-gray-400 font-semibold text-sm">Amount</th>
                <th className="px-6 py-4 text-gray-400 font-semibold text-sm">Avg Price</th>
                <th className="px-6 py-4 text-gray-400 font-semibold text-sm">Current Price</th>
                <th className="px-6 py-4 text-gray-400 font-semibold text-sm">Value</th>
                <th className="px-6 py-4 text-gray-400 font-semibold text-sm">P/L</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding) => (
                <tr key={holding.coinId} className="border-b border-slate-800 hover:bg-slate-800/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={holding.image} alt={holding.name} className="w-8 h-8 rounded-full" />
                      <div>
                        <div className="font-bold text-white text-sm">{holding.name}</div>
                        <div className="text-xs text-gray-400 uppercase">{holding.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white font-semibold">{holding.amount}</td>
                  <td className="px-6 py-4 text-gray-300">{formatCurrency(holding.avgPrice)}</td>
                  <td className="px-6 py-4 text-white font-semibold">
                    {formatCurrency(holding.currentPrice)}
                  </td>
                  <td className="px-6 py-4 text-white font-semibold">
                    {formatCurrency(holding.value)}
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-1 ${getChangeColor(holding.profitPercent)}`}>
                      {holding.profit >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span className="font-semibold">
                        {formatCurrency(holding.profit)} ({formatPercentage(holding.profitPercent)})
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
