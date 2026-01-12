'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Add, SwapHoriz, ArrowUpward, Warning, GridView, PieChart, SmartToy, AccountBalanceWallet, Settings } from 'lucide-react'
import { useSubscriptionStore } from '@/lib/subscriptionStore'

interface SentinelDashboardProps {
  totalAssets?: number
  dailyYield?: number
  riskLevel?: 'low' | 'medium' | 'high'
  className?: string
}

export function SentinelDashboard({
  totalAssets = 1245390.00,
  dailyYield = 1294.20,
  riskLevel = 'low',
  className = '',
}: SentinelDashboardProps) {
  const [changePercent] = useState(5.4)
  const [sentinelLogs, setSentinelLogs] = useState([
    { time: '10:42:05', type: 'scanning', message: 'SCANNING NETWORK...', detail: 'Analyzing 4,203 nodes for arbitrage opportunities.', color: 'primary' },
    { time: '10:41:52', type: 'whale', message: 'WHALE ALERT: BTC MOVE', detail: 'Wallet 0x7a... moved 500 BTC to Cold Storage.', color: 'gold' },
    { time: '10:40:15', type: 'optimization', message: 'GAS OPTIMIZATION', detail: 'Route updated. Savings: ~$42.30', color: 'gray' },
  ])

  const hasDeFi = useSubscriptionStore((state) => state.hasDeFi())

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className={`min-h-screen bg-[#1a1814] relative overflow-hidden ${className}`}>
      {/* Leather Texture Background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'url(https://lh3.googleusercontent.com/aida-public/AB6AXuBGWKOupOFeFYdeVzG58be4VhHhxqut5HqF5cf_vSOZ2nXeIxW3AnuqF1vueEm6ZhBtBFsulLTnKzQaa14uF33QpJBFhMQLlSNEWgCYjDq7aORnV4lr9eQcrrgLua2hPCsL5bcKe5b4P1hskYlzKN75zNoNNntCBA5N1ujlu7aUrLjmWYeXcok_0aA4UaYB_J4i0qtnGo9WuLwV0r8cMw4WHSg_59bYSTMkAMTFdyKj1pEmZbO-lZq1w_ZjsdJzL079iGs5O3TOLCdc)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Subtle Sheen Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none z-10" />
      
      <div className="relative z-20 max-w-md mx-auto min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="flex items-center justify-between p-6 pb-2">
          <div className="flex flex-col">
            <span className="text-[10px] tracking-[0.2em] text-[#8c7e63] font-bold uppercase mb-1">
              Krypto Trac
            </span>
            <h1 className="text-2xl font-black tracking-tight leading-none uppercase" style={{
              background: 'linear-gradient(to bottom, #ffeab3 0%, #f4c025 50%, #b88a00 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
            }}>
              Sentinel AI
            </h1>
          </div>
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-[#24201b] border border-[#3a3328] shadow-[1px_1px_0px_rgba(255,255,255,0.05),_-1px_-1px_0px_rgba(0,0,0,0.8)] active:scale-95 transition-transform group">
            <TrendingUp className="w-5 h-5 text-[#f4c025] group-hover:text-white transition-colors" />
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 py-4 space-y-6 overflow-y-auto pb-24">
          {/* Leather Card Slot 1: Total Assets */}
          <div className="relative group">
            <div className="bg-gradient-to-b from-[#2a2520] to-[#1c1915] rounded-xl p-5 shadow-xl border-t border-[#3a3328] relative overflow-hidden">
              {/* Stitching */}
              <div className="absolute inset-2 border-2 border-dashed border-[#3a3328]/50 rounded-lg pointer-events-none" />
              
              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xs font-bold tracking-[0.15em] uppercase opacity-90" style={{
                    color: '#d4af37',
                    textShadow: '0 -1px 0 rgba(0, 0, 0, 0.5), 0 1px 1px rgba(255, 255, 255, 0.2)',
                  }}>
                    Total Net Worth
                  </h2>
                  <div className="flex items-center gap-1 bg-[#12100d] px-2 py-1 rounded border border-[#3a3328]">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-green-500 text-xs font-bold">+{changePercent}%</span>
                  </div>
                </div>
                
                <div className="py-2 text-center bg-[#151310] rounded-lg shadow-[inset_2px_2px_5px_rgba(0,0,0,0.7),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] border-b border-white/5">
                  <p className="text-[#f4c025] text-4xl font-bold tracking-tight py-2 drop-shadow-md">
                    {formatCurrency(totalAssets)}
                    <span className="text-xl text-[#f4c025]/60">.00</span>
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mt-1">
                  {/* Deposit */}
                  <button className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-white/5 active:bg-black/20 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f4c025] to-[#a88b3d] flex items-center justify-center shadow-lg border border-[#ffeab3]/20">
                      <Add className="w-5 h-5 text-[#1a1814] font-bold" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-[#8c7e63] font-bold">Deposit</span>
                  </button>
                  
                  {/* Swap */}
                  <button className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-white/5 active:bg-black/20 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[#24201b] border border-[#a88b3d] flex items-center justify-center shadow-[1px_1px_0px_rgba(255,255,255,0.05),_-1px_-1px_0px_rgba(0,0,0,0.8)] text-[#f4c025]">
                      <SwapHoriz className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-[#8c7e63] font-bold">Swap</span>
                  </button>
                  
                  {/* Send */}
                  <button className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg hover:bg-white/5 active:bg-black/20 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[#24201b] border border-[#a88b3d] flex items-center justify-center shadow-[1px_1px_0px_rgba(255,255,255,0.05),_-1px_-1px_0px_rgba(0,0,0,0.8)] text-[#f4c025]">
                      <ArrowUpward className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-[#8c7e63] font-bold">Send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Leather Card Slot 2: Live Analysis */}
          <div className="relative">
            <div className="bg-gradient-to-b from-[#2a2520] to-[#1c1915] rounded-xl p-1 shadow-xl border-t border-[#3a3328] overflow-hidden">
              <div className="bg-[#0a0a0a] rounded-lg p-4 border border-[#3a3328] relative">
                {/* Terminal Header */}
                <div className="flex items-center justify-between mb-3 border-b border-[#333] pb-2">
                  <h3 className="text-xs font-bold tracking-[0.15em] uppercase flex items-center gap-2" style={{
                    color: '#d4af37',
                    textShadow: '0 -1px 0 rgba(0, 0, 0, 0.5), 0 1px 1px rgba(255, 255, 255, 0.2)',
                  }}>
                    <span className="w-2 h-2 rounded-full bg-[#f4c025] animate-pulse shadow-[0_0_8px_#f4c025]" />
                    Live Sentinel Analysis
                  </h3>
                  <span className="text-[10px] text-[#555] font-mono">SYS.V.2.0.4</span>
                </div>
                
                {/* Logs */}
                <div className="space-y-3 font-mono text-xs overflow-hidden max-h-[140px] relative">
                  {/* Fading mask at bottom */}
                  <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none z-10" />
                  
                  {sentinelLogs.map((log, index) => (
                    <div key={index} className={`flex gap-3 items-start ${index > 0 ? 'opacity-80' : 'opacity-100'}`}>
                      <span className="text-[#555] shrink-0">{log.time}</span>
                      <div className="flex-1">
                        <p className={`mb-0.5 font-bold ${
                          log.color === 'primary' ? 'text-[#f4c025]' :
                          log.color === 'gold' ? 'text-[#d4af37]' :
                          'text-[#888]'
                        }`}>
                          {log.message}
                        </p>
                        <p className="text-[#888] text-[10px]">{log.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Leather Card Slot 3: Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            {/* Daily Yield */}
            <div className="bg-gradient-to-b from-[#2a2520] to-[#1c1915] rounded-xl p-4 shadow-xl border-t border-[#3a3328] relative">
              <div className="absolute inset-1 border border-dashed border-[#3a3328]/50 rounded-lg pointer-events-none" />
              <div className="relative z-10">
                <p className="text-[10px] font-bold tracking-[0.1em] uppercase mb-2" style={{
                  color: '#d4af37',
                  textShadow: '0 -1px 0 rgba(0, 0, 0, 0.5), 0 1px 1px rgba(255, 255, 255, 0.2)',
                }}>
                  Daily Yield
                </p>
                <p className="text-white text-lg font-bold">+{formatCurrency(dailyYield)}</p>
                <div className="h-1 w-full bg-[#12100d] rounded-full mt-3 overflow-hidden border border-[#3a3328]">
                  <div 
                    className="h-full w-[75%] bg-[#f4c025] shadow-[0_0_10px_rgba(244,192,37,0.5)]"
                    style={{ width: '75%' }}
                  />
                </div>
              </div>
            </div>
            
            {/* Risk Level */}
            <div className="bg-gradient-to-b from-[#2a2520] to-[#1c1915] rounded-xl p-4 shadow-xl border-t border-[#3a3328] relative">
              <div className="absolute inset-1 border border-dashed border-[#3a3328]/50 rounded-lg pointer-events-none" />
              <div className="relative z-10">
                <p className="text-[10px] font-bold tracking-[0.1em] uppercase mb-2" style={{
                  color: '#d4af37',
                  textShadow: '0 -1px 0 rgba(0, 0, 0, 0.5), 0 1px 1px rgba(255, 255, 255, 0.2)',
                }}>
                  Risk Level
                </p>
                <p className="text-[#22c55e] text-lg font-bold capitalize">
                  {riskLevel} / Safe
                </p>
                <div className="flex gap-1 mt-3">
                  <div className="h-1 flex-1 bg-[#22c55e] rounded-full shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                  <div className="h-1 flex-1 bg-[#22c55e] rounded-full shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                  <div className="h-1 flex-1 bg-[#3a3328] rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Section */}
          <div className="pt-2">
            <div className="relative">
              {/* Metal Plate Background */}
              <div className="absolute inset-0 bg-[#000] rounded-xl transform skew-y-1 opacity-50 blur-sm translate-y-2" />
              <button className="relative w-full overflow-hidden rounded-xl group active:scale-[0.98] transition-all duration-200">
                {/* Button Surface */}
                <div className="bg-gradient-to-b from-[#1a1814] to-[#000] border-2 border-[#a88b3d] p-1 rounded-xl shadow-lg relative z-10">
                  {/* Caution Stripes */}
                  <div className="h-full w-full absolute top-0 left-0 opacity-10 bg-[repeating-linear-gradient(45deg,#000,#000_10px,#a88b3d_10px,#a88b3d_20px)]" />
                  <div className="relative z-20 bg-[#12100d] rounded-lg py-5 px-4 flex items-center justify-between border border-[#3a3328]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-b from-[#333] to-[#111] border-2 border-[#a88b3d] flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
                        <Warning className="w-7 h-7 text-red-600 drop-shadow-[0_0_5px_rgba(220,38,38,0.8)]" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-[#a88b3d] font-bold text-sm tracking-widest uppercase">Emergency</h3>
                        <p className="text-[#555] text-xs font-mono">PANIC LIQUIDATE ALL</p>
                      </div>
                    </div>
                    <ArrowUpward className="w-5 h-5 text-[#a88b3d]/50 group-hover:translate-x-1 transition-transform rotate-90" />
                  </div>
                </div>
              </button>
            </div>
          </div>
        </main>

        {/* Bottom Navigation Dock */}
        <nav className="absolute bottom-6 left-6 right-6 z-30">
          <div className="bg-[#1c1915]/90 backdrop-blur-md border border-[#3a3328] rounded-full px-6 py-4 shadow-2xl flex justify-between items-center relative">
            {/* Leather stitching on nav */}
            <div className="absolute inset-1 rounded-full border border-dashed border-[#3a3328]/50 pointer-events-none" />
            
            <button className="relative z-10 group flex flex-col items-center gap-1">
              <GridView className="w-5 h-5 text-[#f4c025] drop-shadow-[0_0_5px_rgba(244,192,37,0.5)]" />
            </button>
            
            <button className="relative z-10 group flex flex-col items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
              <PieChart className="w-5 h-5 text-[#8c7e63]" />
            </button>
            
            <div className="w-12 h-12 -mt-10 bg-gradient-to-b from-[#f4c025] to-[#a88b3d] rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(244,192,37,0.4)] border-4 border-[#1a1814] transform hover:-translate-y-1 transition-transform relative z-20">
              <SmartToy className="w-6 h-6 text-[#1a1814] font-bold" />
            </div>
            
            <button className="relative z-10 group flex flex-col items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
              <AccountBalanceWallet className="w-5 h-5 text-[#8c7e63]" />
            </button>
            
            <button className="relative z-10 group flex flex-col items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
              <Settings className="w-5 h-5 text-[#8c7e63]" />
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}
