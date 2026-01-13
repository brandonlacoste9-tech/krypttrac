// ============================================
// Krypto Trac: Multi-Chain Wallet View
// Unified view of assets across all chains
// ============================================

'use client'

import { useState, useEffect } from 'react'
import { getConnectedWallets, getWalletBalance } from '@/lib/wallet/multi-chain-client'

interface WalletViewProps {
  userId: string
  selectedNetwork?: string
  onNetworkChange?: (network: string) => void
}

export default function MultiChainWalletView({ userId, selectedNetwork, onNetworkChange }: WalletViewProps) {
  const [wallets, setWallets] = useState<any[]>([])
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWallets()
  }, [userId])

  const loadWallets = async () => {
    setLoading(true)
    const walletList = await getConnectedWallets(userId)
    setWallets(walletList)

    // Load balances for each wallet
    const balancePromises = walletList.map(async (wallet) => {
      const balance = await getWalletBalance(wallet.wallet_address, wallet.network)
      return { walletId: wallet.id, balance: balance?.balance || 0, currency: balance?.currency || 'ETH' }
    })

    const balanceResults = await Promise.all(balancePromises)
    const balanceMap: Record<string, number> = {}
    balanceResults.forEach(({ walletId, balance }) => {
      balanceMap[walletId] = balance
    })
    setBalances(balanceMap)
    setLoading(false)
  }

  const networks = ['Ethereum', 'Solana', 'Polygon', 'Arbitrum', 'Base', 'Optimism']
  const currentNetwork = selectedNetwork || 'Ethereum'

  return (
    <div className="space-y-4">
      {/* Network Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {networks.map((network) => (
          <button
            key={network}
            onClick={() => onNetworkChange?.(network)}
            className={`
              px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap
              ${currentNetwork === network
                ? 'bg-yellow-600 text-black shadow-lg'
                : 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30 hover:bg-yellow-600/30'
              }
            `}
          >
            {network}
          </button>
        ))}
      </div>

      {/* Wallet List */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading wallets...</div>
      ) : wallets.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">No wallets connected</p>
          <button className="px-4 py-2 bg-yellow-600 text-black font-bold rounded hover:bg-yellow-500">
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {wallets
            .filter(w => w.network.toLowerCase() === currentNetwork.toLowerCase())
            .map((wallet) => (
              <div
                key={wallet.id}
                className="p-4 bg-black/30 rounded-lg border border-yellow-600/20"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-400 font-bold text-sm">
                      {wallet.wallet_name || `${wallet.wallet_address.slice(0, 6)}...${wallet.wallet_address.slice(-4)}`}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">{wallet.network}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">
                      {balances[wallet.id]?.toFixed(4) || '0.0000'}
                    </p>
                    <p className="text-gray-400 text-xs">ETH</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
