'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, TrendingUp, Shield, Zap, Crown } from 'lucide-react'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

export default function Home() {
  const features = [
    { icon: <TrendingUp className="w-6 h-6" />, title: 'Real-Time Data', desc: 'Live prices updated every 30 seconds' },
    { icon: <Sparkles className="w-6 h-6" />, title: 'AI Assistant', desc: 'Get instant market insights and analysis' },
    { icon: <Shield className="w-6 h-6" />, title: 'Secure Tracking', desc: 'Connect wallets safely and track your portfolio' },
    { icon: <Zap className="w-6 h-6" />, title: 'Smart Alerts', desc: 'Never miss important price movements' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center space-y-8 max-w-4xl">
          {/* Crown Logo with Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 p-1 shadow-2xl">
              <div className="w-full h-full bg-slate-900 rounded-3xl flex items-center justify-center">
                <Image
                  src="/kk-logo.png"
                  alt="Krypto Kings"
                  width={100}
                  height={100}
                  className="drop-shadow-2xl"
                  priority
                />
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-5xl sm:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Krypto Kings
            </h1>
            <p className="text-2xl sm:text-3xl text-gray-400 mt-4 flex items-center justify-center gap-2">
              Built for Kings <Crown className="w-6 h-6 text-yellow-400" />
            </p>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-gray-300 text-lg max-w-2xl mx-auto"
          >
            The most advanced crypto tracker for 2026. Real-time data, AI insights, DeFi tracking, and exclusive features for the crypto elite.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/dashboard">
              <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-bold text-lg transition-all hover:scale-105 shadow-xl flex items-center gap-2 w-full sm:w-auto">
                Enter Dashboard
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/watchlist">
              <button className="px-8 py-4 bg-slate-800/50 hover:bg-slate-700/50 border border-purple-500/30 rounded-xl text-white font-bold text-lg transition-all hover:scale-105 w-full sm:w-auto">
                Explore Features
              </button>
            </Link>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-xl p-4 hover:border-purple-500/50 transition"
              >
                <div className="text-purple-400 mb-2 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">{feature.title}</h3>
                <p className="text-gray-400 text-xs">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
