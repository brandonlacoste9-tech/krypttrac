'use client'

import { useState, useEffect } from 'react'
import { Wallet, LogOut, Copy, Check } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { formatCurrency } from '@/lib/utils'

export function WalletConnect() {
  const { connectedWallet, setConnectedWallet } = useAppStore()
  const [copied, setCopied] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const connectWallet = async () => {
    setIsConnecting(true)
    try {
      // Check if MetaMask is installed
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts',
        })
        if (accounts.length > 0) {
          setConnectedWallet(accounts[0])
        }
      } else {
        // Fallback: simulate wallet connection for demo
        const mockAddress = `0x${Array.from({ length: 40 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('')}`
        setConnectedWallet(mockAddress)
      }
    } catch (error) {
      console.error('Wallet connection error:', error)
      alert('Failed to connect wallet. Please install MetaMask or another Web3 wallet.')
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setConnectedWallet(null)
  }

  const copyAddress = () => {
    if (connectedWallet) {
      navigator.clipboard.writeText(connectedWallet)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (connectedWallet) {
    return (
      <div className="flex items-center gap-3">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-xl px-4 py-2 flex items-center gap-3">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm text-gray-300 font-mono">
            {formatAddress(connectedWallet)}
          </span>
          <button
            onClick={copyAddress}
            className="p-1 hover:bg-slate-700 rounded transition"
            title="Copy address"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
        <button
          onClick={disconnectWallet}
          className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-red-400 transition"
          title="Disconnect"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={connectWallet}
      disabled={isConnecting}
      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      <Wallet className="w-4 h-4" />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  )
}
