'use client'

import { AlertTriangle, Shield, X, CheckCircle2, AlertCircle, FileText, Loader2 } from 'lucide-react'
import { SecurityAuditResult, SafetyStatus } from '@/lib/security/guardian'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface SecurityWarningProps {
  auditResult: SecurityAuditResult
  onProceed?: () => void
  onCancel?: () => void
  showDetails?: boolean
  transactionMetadata?: {
    contractAddress?: string
    functionName?: string
  }
}

export function SecurityWarning({
  auditResult,
  onProceed,
  onCancel,
  showDetails = true,
}: SecurityWarningProps) {
  const getStatusColor = (status: SafetyStatus) => {
    switch (status) {
      case 'SAFE':
        return 'from-green-600 to-emerald-600 border-green-400'
      case 'WARNING':
        return 'from-yellow-600 to-orange-600 border-yellow-400'
      case 'BLOCK':
        return 'from-red-600 to-rose-600 border-red-400'
      default:
        return 'from-gray-600 to-slate-600 border-gray-400'
    }
  }

  const getStatusIcon = (status: SafetyStatus) => {
    switch (status) {
      case 'SAFE':
        return <CheckCircle2 className="w-6 h-6" />
      case 'WARNING':
        return <AlertTriangle className="w-6 h-6" />
      case 'BLOCK':
        return <Shield className="w-6 h-6" />
      default:
        return <AlertCircle className="w-6 h-6" />
    }
  }

  const isBlocked = auditResult.status === 'BLOCK'
  const isWarning = auditResult.status === 'WARNING'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`bg-gradient-to-br ${getStatusColor(auditResult.status)} rounded-xl border-2 p-6 shadow-2xl backdrop-blur-xl`}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white">
            {getStatusIcon(auditResult.status)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-white">
                {isBlocked && 'Transaction Blocked'}
                {isWarning && 'Security Warning'}
                {auditResult.status === 'SAFE' && 'Security Check Passed'}
              </h3>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white/90 text-sm">
                  Safety Score: {auditResult.confidence}%
                </span>
                <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${auditResult.confidence}%` }}
                    className={`h-full ${
                      auditResult.confidence >= 80
                        ? 'bg-green-300'
                        : auditResult.confidence >= 50
                        ? 'bg-yellow-300'
                        : 'bg-red-300'
                    }`}
                  />
                </div>
              </div>
            </div>

            {auditResult.risks.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-white mb-2">Detected Risks:</h4>
                <ul className="space-y-1">
                  {auditResult.risks.map((risk, index) => (
                    <li key={index} className="flex items-start gap-2 text-white/90 text-sm">
                      <AlertTriangle className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {showDetails && auditResult.contractAnalysis && (
              <div className="mb-4 bg-black/20 rounded-lg p-3">
                <h4 className="font-semibold text-white mb-2 text-sm">Contract Analysis:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={auditResult.contractAnalysis.isKnownPhishing ? 'text-red-300' : 'text-green-300'}>
                    Phishing: {auditResult.contractAnalysis.isKnownPhishing ? 'Detected' : 'None'}
                  </div>
                  <div className={auditResult.contractAnalysis.hasInfiniteApproval ? 'text-yellow-300' : 'text-green-300'}>
                    Approval: {auditResult.contractAnalysis.hasInfiniteApproval ? 'Infinite' : 'Limited'}
                  </div>
                  <div className={auditResult.contractAnalysis.reentrancyRisk ? 'text-yellow-300' : 'text-green-300'}>
                    Re-entrancy: {auditResult.contractAnalysis.reentrancyRisk ? 'Risk' : 'Safe'}
                  </div>
                  <div className={auditResult.contractAnalysis.frontRunRisk ? 'text-yellow-300' : 'text-green-300'}>
                    Front-run: {auditResult.contractAnalysis.frontRunRisk ? 'Risk' : 'Safe'}
                  </div>
                </div>
              </div>
            )}

            {auditResult.recommendations.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-white mb-2">Recommendations:</h4>
                <ul className="space-y-1">
                  {auditResult.recommendations.map((rec, index) => (
                    <li key={index} className="text-white/80 text-sm flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-white/60 rounded-full mt-2 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Detailed Report Button */}
            {!showDetailedReport && (isWarning || isBlocked) && (
              <button
                onClick={fetchDetailedReport}
                disabled={isLoadingReasoning}
                className="w-full mt-4 bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoadingReasoning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    View Detailed Security Report
                  </>
                )}
              </button>
            )}

            {/* Detailed Report Display */}
            {showDetailedReport && detailedReasoning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-black/30 rounded-lg border border-white/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-white" />
                  <h4 className="font-semibold text-white text-sm">Detailed Security Analysis</h4>
                </div>
                <p className="text-white/90 text-sm leading-relaxed">{detailedReasoning}</p>
                <button
                  onClick={() => setShowDetailedReport(false)}
                  className="mt-3 text-white/70 hover:text-white text-xs"
                >
                  Hide Report
                </button>
              </motion.div>
            )}

            {!isBlocked && (onProceed || onCancel) && (
              <div className="flex gap-3 mt-4">
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="flex-1 bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                )}
                {onProceed && isWarning && (
                  <button
                    onClick={onProceed}
                    className="flex-1 bg-white text-yellow-600 hover:bg-yellow-50 font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Proceed Anyway
                  </button>
                )}
              </div>
            )}

            {isBlocked && (
              <div className="mt-4 p-3 bg-red-900/30 rounded-lg border border-red-400/30">
                <p className="text-white text-sm font-semibold">
                  This transaction has been blocked by the Fort Knox Security System.
                  Do not proceed with this transaction.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
