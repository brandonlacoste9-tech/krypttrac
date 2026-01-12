'use client'

import { Rocket, Zap } from 'lucide-react'
import { FeatureGate } from './FeatureGate'
import { UpgradeModal } from './UpgradeModal'
import { FortKnoxBadge } from './FortKnoxBadge'
import { SecurityWarning } from './SecurityWarning'
import { useState } from 'react'
import { useSubscriptionStore } from '@/lib/subscriptionStore'
import { scanTransaction, TransactionMetadata, SecurityAuditResult } from '@/lib/security/guardian'

interface HighYieldButtonProps {
  coin: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
  className?: string
}

/**
 * High-Yield Staking Button
 * Shows on bullish news and triggers upgrade modal if DeFi add-on is not active
 */
export function HighYieldButton({ coin, sentiment, className = '' }: HighYieldButtonProps) {
  const hasDeFi = useSubscriptionStore((state) => state.hasDeFi())
  const [showModal, setShowModal] = useState(false)
  const [showSecurityScan, setShowSecurityScan] = useState(false)
  const [auditResult, setAuditResult] = useState<SecurityAuditResult | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  // Only show on bullish sentiment
  if (sentiment !== 'bullish') {
    return null
  }

  const handleClick = async () => {
    if (!hasDeFi) {
      setShowModal(true)
    } else {
      // Scan transaction before proceeding
      await handleSecurityScan()
    }
  }

  const handleSecurityScan = async () => {
    setIsScanning(true)
    try {
      // Mock transaction metadata - replace with actual Magnum Opus contract
      const tx: TransactionMetadata = {
        contractAddress: '0x0000000000000000000000000000000000000000', // Replace with actual
        functionName: 'stake',
        value: '0',
        chainId: 1, // Ethereum mainnet
      }

      const result = await scanTransaction(tx)
      setAuditResult(result)
      setShowSecurityScan(true)

      // If safe, proceed automatically
      if (result.status === 'SAFE') {
        setTimeout(() => {
          handleStakingFlow()
          setShowSecurityScan(false)
        }, 2000)
      }
    } catch (error) {
      console.error('Security scan error:', error)
      // Proceed with warning if scan fails
      handleStakingFlow()
    } finally {
      setIsScanning(false)
    }
  }

  const handleStakingFlow = async () => {
    try {
      // Initialize Colony OS client-side wallet signing
      const { initColonyOS, signTransaction } = await import('@/lib/colony/client')
      
      // Initialize Colony OS (connects to user's wallet)
      const colonyClient = await initColonyOS()
      
      if (!colonyClient) {
        alert('Colony OS wallet not found. Please install the Colony OS extension.')
        return
      }

      // Prepare Magnum Opus staking transaction
      const stakingTx = {
        contractAddress: '0x0000000000000000000000000000000000000000', // Replace with actual Magnum Opus contract
        functionName: 'stake',
        functionArgs: [coin], // Coin symbol for staking
        value: '0', // No ETH value for token staking
        chainId: 1, // Ethereum mainnet
      }

      // Sign transaction with Colony OS (Ed25519 signature)
      const signedTx = await signTransaction(stakingTx, colonyClient)
      
      if (signedTx) {
        console.log('Transaction signed successfully:', signedTx)
        // Transaction is signed client-side and ready to be broadcast
        // In production, you would send signedTx to your backend for execution
        alert(`High-yield staking transaction for ${coin} signed successfully! (Fort Knox Secured)`)
      }
    } catch (error: any) {
      console.error('Colony OS staking error:', error)
      alert(`Failed to initiate staking: ${error.message || 'Unknown error'}`)
    }
  }

  const handleProceedAnyway = () => {
    setShowSecurityScan(false)
    handleStakingFlow()
  }

  return (
    <>
      <FeatureGate
        feature="defi"
        blurIntensity="light"
        showUpgrade={false}
        className={className}
      >
        <button
          onClick={handleClick}
          disabled={isScanning}
          className="w-full bg-gradient-to-r from-yellow-600 via-orange-600 to-pink-600 hover:from-yellow-700 hover:via-orange-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-orange-500/50 flex items-center justify-center gap-2"
        >
          {isScanning ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Scanning Security...</span>
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5" />
              <span>High-Yield Staking (700%+ APY)</span>
              <Zap className="w-4 h-4" />
              <FortKnoxBadge variant="small" showText={false} />
            </>
          )}
        </button>
      </FeatureGate>

      {showModal && (
        <UpgradeModal
          feature="magnum"
          onClose={() => setShowModal(false)}
          trial={7}
        />
      )}

      {showSecurityScan && auditResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="max-w-lg w-full">
            <SecurityWarning
              auditResult={auditResult}
              onProceed={auditResult.status === 'WARNING' ? handleProceedAnyway : undefined}
              onCancel={() => setShowSecurityScan(false)}
              showDetails={true}
              transactionMetadata={{
                contractAddress: '0x0000000000000000000000000000000000000000', // Replace with actual
                functionName: 'stake',
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
