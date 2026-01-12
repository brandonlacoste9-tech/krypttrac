'use client'

import { useEffect, useState } from 'react'
import { GuardianManager } from '@/components/GuardianManager'
import { ManageSubscription } from '@/components/ManageSubscription'
import { useSubscriptionStore } from '@/lib/subscriptionStore'
import { getCurrentUserProfile } from '@/lib/profile'
import { supabase } from '@/lib/supabase'
import { Shield, CreditCard, User, Settings as SettingsIcon } from 'lucide-react'

export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { addOns } = useSubscriptionStore()

  useEffect(() => {
    async function loadUserData() {
      try {
        // Get current user from Supabase
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          console.error('Not authenticated:', authError)
          setIsLoading(false)
          return
        }

        setUserId(user.id)
        setUserEmail(user.email || null)

        // Get user profile for Stripe customer ID
        const profile = await getCurrentUserProfile()
        if (profile) {
          // Note: You may need to add stripe_customer_id to your profiles table
          // For now, we'll use the user ID as a fallback
          setStripeCustomerId((profile as any).stripe_customer_id || user.id)
        }
      } catch (error) {
        console.error('Failed to load user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading settings...</div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Please log in to access settings</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-purple-400" />
            Settings
          </h1>
          <p className="text-gray-400">Manage your account, security, and subscriptions</p>
        </div>

        {/* User Info Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Account Information</h2>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-gray-400 text-sm">Email:</span>
              <span className="text-white ml-2">{userEmail || 'Not set'}</span>
            </div>
            <div>
              <span className="text-gray-400 text-sm">User ID:</span>
              <span className="text-white ml-2 font-mono text-xs">{userId}</span>
            </div>
            {addOns.length > 0 && (
              <div>
                <span className="text-gray-400 text-sm">Active Add-ons:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {addOns.map((addon) => (
                    <span
                      key={addon}
                      className="px-3 py-1 bg-purple-600/30 border border-purple-500/50 rounded-lg text-purple-300 text-sm font-medium capitalize"
                    >
                      {addon}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Management Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Subscription Management</h2>
          </div>
          <p className="text-gray-400 mb-4 text-sm">
            Manage your subscriptions, add-ons, payment methods, and billing history
          </p>
          <ManageSubscription customerId={stripeCustomerId || undefined} />
        </div>

        {/* Fort Knox Security Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Fort Knox Security</h2>
          </div>
          <p className="text-gray-400 mb-4 text-sm">
            Manage your social recovery guardians and security settings
          </p>
          <GuardianManager showRecoveryButton={true} />
        </div>
      </div>
    </div>
  )
}
