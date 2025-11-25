'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Crown, Lock, Sparkles, Diamond } from 'lucide-react'

interface Message {
  id: string
  userId: string
  username: string
  tier: 'silver' | 'gold' | 'platinum'
  content: string
  timestamp: Date
}

interface PremiumChatProps {
  userTier?: 'free' | 'silver' | 'gold' | 'platinum'
  userId?: string
}

export function PremiumChat({ userTier = 'free', userId }: PremiumChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      userId: 'system',
      username: 'Krypttrac Bot',
      tier: 'platinum',
      content: 'Welcome to the Kings Lounge 👑 Gold and Platinum members only!',
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const canAccess = userTier === 'gold' || userTier === 'platinum'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!input.trim() || !canAccess) return

    const newMessage: Message = {
      id: Date.now().toString(),
      userId: userId || 'user-123',
      username: userTier === 'platinum' ? '💎 Platinum King' : '👑 Gold King',
      tier: userTier as 'gold' | 'platinum',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, newMessage])
    setInput('')
  }

  const getTierBadge = (tier: string) => {
    switch(tier) {
      case 'platinum':
        return (
          <span className="flex items-center gap-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 rounded-full font-semibold">
            <Diamond className="w-3 h-3" />
            PLATINUM
          </span>
        )
      case 'gold':
        return (
          <span className="flex items-center gap-1 text-xs bg-gradient-to-r from-yellow-600 to-yellow-500 px-2 py-0.5 rounded-full font-semibold">
            <Crown className="w-3 h-3" />
            GOLD
          </span>
        )
      default:
        return null
    }
  }

  if (!canAccess) {
    return (
      <div className="h-full bg-slate-900/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-6">
        <div className="relative">
          <Crown className="w-24 h-24 text-purple-400 opacity-20" />
          <Lock className="w-12 h-12 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="space-y-3">
          <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Kings Lounge 👑
          </h3>
          <p className="text-gray-400 max-w-md">
            Exclusive chat for Gold and Platinum Kings only. Connect with premium members, share alpha, and get priority AI support.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
          <div className="bg-slate-800/50 border border-yellow-500/30 rounded-xl p-6 space-y-4">
            <div className="text-4xl">👑</div>
            <h4 className="text-xl font-bold text-yellow-400">Gold King</h4>
            <p className="text-2xl font-bold text-white">$24.99<span className="text-sm text-gray-400">/mo</span></p>
            <ul className="text-sm text-gray-300 space-y-2 text-left">
              <li>✓ Kings Lounge access</li>
              <li>✓ Unlimited coins</li>
              <li>✓ Advanced analytics</li>
              <li>✓ Priority support</li>
            </ul>
            <button className="w-full py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 rounded-lg text-white font-semibold transition-all hover:scale-105">
              Upgrade to Gold
            </button>
          </div>

          <div className="bg-slate-800/50 border border-purple-500/50 rounded-xl p-6 space-y-4 shadow-xl shadow-purple-500/20">
            <div className="text-4xl">💎</div>
            <h4 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Platinum King</h4>
            <p className="text-2xl font-bold text-white">$49.99<span className="text-sm text-gray-400">/mo</span></p>
            <ul className="text-sm text-gray-300 space-y-2 text-left">
              <li>✓ Everything in Gold</li>
              <li>✓ AI chat commands (@ai)</li>
              <li>✓ Voice announcements</li>
              <li>✓ White-glove support</li>
            </ul>
            <button className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white font-semibold transition-all hover:scale-105">
              Go Platinum
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-slate-900/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/30 to-pink-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-yellow-400" />
            <div>
              <h3 className="font-bold text-white text-lg">Kings Lounge</h3>
              <p className="text-xs text-gray-400">Gold & Platinum Members Only</p>
            </div>
          </div>
          {getTierBadge(userTier)}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-3">
            <div className={`w-10 h-10 rounded-full ${
              msg.tier === 'platinum'
                ? 'bg-gradient-to-br from-purple-600 to-pink-600'
                : 'bg-gradient-to-br from-yellow-600 to-yellow-500'
            } flex items-center justify-center flex-shrink-0`}>
              {msg.tier === 'platinum' ? '💎' : '👑'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-white text-sm">{msg.username}</span>
                {getTierBadge(msg.tier)}
                <span className="text-xs text-gray-500">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-purple-500/20 bg-slate-900/80">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={userTier === 'platinum' ? 'Message the kings... 💎' : 'Message the gold members... 👑'}
            className="flex-1 bg-slate-800/60 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={sendMessage}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 p-3 rounded-xl transition-all hover:scale-105"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>

        {userTier === 'platinum' && (
          <div className="mt-3 flex items-center gap-2 text-xs text-purple-400">
            <Sparkles className="w-4 h-4" />
            <span>Platinum Perk: Use @ai to ask questions in chat</span>
          </div>
        )}
      </div>
    </div>
  )
}
