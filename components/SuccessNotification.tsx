'use client'

import { CheckCircle2, X, Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SuccessNotificationProps {
  show: boolean
  feature?: string | null
  onClose: () => void
  duration?: number
}

export function SuccessNotification({
  show,
  feature,
  onClose,
  duration = 5000,
}: SuccessNotificationProps) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  if (!show) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-4 right-4 z-50 max-w-md"
        >
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-xl shadow-2xl border border-green-400/30 p-4 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-white" />
                  <h4 className="font-bold text-white text-sm">Feature Unlocked!</h4>
                </div>
                {feature && (
                  <p className="text-white/90 text-sm mb-2">
                    You now have access to <span className="font-semibold">{feature}</span>
                  </p>
                )}
                <p className="text-white/80 text-xs">
                  Your subscription is now active. Start exploring premium features!
                </p>
              </div>

              <button
                onClick={onClose}
                className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress bar */}
            {duration > 0 && (
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
                className="mt-3 h-1 bg-white/30 rounded-full overflow-hidden"
              >
                <div className="h-full bg-white/50" />
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
