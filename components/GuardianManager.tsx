'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Shield, AlertTriangle, CheckCircle2, X, Key, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getUserId } from '@/lib/auth'

interface Guardian {
  id: string
  guardian_user_id: string
  guardian_public_key: string
  guardian_address?: string
  nickname?: string
  status: 'pending' | 'active' | 'revoked'
  created_at: string
}

interface GuardianManagerProps {
  className?: string
  showRecoveryButton?: boolean
}

export function GuardianManager({ className = '', showRecoveryButton = false }: GuardianManagerProps) {
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newGuardianKey, setNewGuardianKey] = useState('')
  const [newGuardianNickname, setNewGuardianNickname] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadGuardians()
  }, [])

  const loadGuardians = async () => {
    setIsLoading(true)
    try {
      const userId = await getUserId()
      if (!userId) {
        setError('Please log in to manage guardians')
        setIsLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('guardians')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setGuardians(data || [])
    } catch (err: any) {
      console.error('Failed to load guardians:', err)
      setError(err.message || 'Failed to load guardians')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddGuardian = async () => {
    if (!newGuardianKey.trim()) {
      setError('Public key or address is required')
      return
    }

    setIsAdding(true)
    setError(null)

    try {
      const userId = await getUserId()
      if (!userId) {
        throw new Error('Please log in to add guardians')
      }

      // Validate public key format (simplified - should check Ed25519 format)
      if (newGuardianKey.length < 32) {
        throw new Error('Invalid public key format')
      }

      const { data, error: insertError } = await supabase
        .from('guardians')
        .insert({
          user_id: userId,
          guardian_public_key: newGuardianKey.trim(),
          guardian_address: newGuardianKey.trim(), // Use same value for now
          nickname: newGuardianNickname.trim() || null,
          status: 'pending',
        })
        .select()
        .single()

      if (insertError) {
        // Handle unique constraint violation
        if (insertError.code === '23505') {
          throw new Error('This guardian is already added')
        }
        throw insertError
      }

      // Reload guardians
      await loadGuardians()

      // Reset form
      setNewGuardianKey('')
      setNewGuardianNickname('')
      setShowAddForm(false)
    } catch (err: any) {
      console.error('Failed to add guardian:', err)
      setError(err.message || 'Failed to add guardian')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveGuardian = async (guardianId: string) => {
    if (!confirm('Are you sure you want to remove this guardian?')) {
      return
    }

    try {
      const { error: deleteError } = await supabase
        .from('guardians')
        .delete()
        .eq('id', guardianId)

      if (deleteError) throw deleteError

      await loadGuardians()
    } catch (err: any) {
      console.error('Failed to remove guardian:', err)
      setError(err.message || 'Failed to remove guardian')
    }
  }

  const handleInitiateRecovery = () => {
    // Navigate to recovery page or show recovery modal
    alert('Recovery flow coming soon! This would initiate a recovery request that requires 2-of-3 guardian approvals.')
  }

  const activeGuardians = guardians.filter(g => g.status === 'active')
  const pendingGuardians = guardians.filter(g => g.status === 'pending')

  return (
    <div className={`bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Social Recovery Guardians</h2>
            <p className="text-sm text-gray-400">Protect your account with trusted guardians</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Guardian
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Add Guardian Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-purple-500/30">
          <h3 className="font-semibold text-white mb-4">Add New Guardian</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Public Key or Address <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={newGuardianKey}
                onChange={(e) => setNewGuardianKey(e.target.value)}
                placeholder="0x... or Ed25519 public key"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Nickname (Optional)
              </label>
              <input
                type="text"
                value={newGuardianNickname}
                onChange={(e) => setNewGuardianNickname(e.target.value)}
                placeholder="e.g., My Phone, Friend's Device"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddGuardian}
                disabled={isAdding}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {isAdding ? 'Adding...' : 'Add Guardian'}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewGuardianKey('')
                  setNewGuardianNickname('')
                  setError(null)
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guardians List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading guardians...</div>
      ) : guardians.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">No guardians added yet</p>
          <p className="text-sm text-gray-500 mb-6">
            Add at least 3 guardians to enable social recovery. 
            You'll need 2-of-3 approvals to recover your account.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Add Your First Guardian
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Guardians */}
          {activeGuardians.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Active Guardians ({activeGuardians.length})
              </h3>
              <div className="space-y-2">
                {activeGuardians.map((guardian) => (
                  <div
                    key={guardian.id}
                    className="bg-slate-900/50 border border-green-500/30 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">
                          {guardian.nickname || 'Unnamed Guardian'}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                          {guardian.guardian_public_key.slice(0, 16)}...
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveGuardian(guardian.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Guardians */}
          {pendingGuardians.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Pending Guardians ({pendingGuardians.length})
              </h3>
              <div className="space-y-2">
                {pendingGuardians.map((guardian) => (
                  <div
                    key={guardian.id}
                    className="bg-slate-900/50 border border-yellow-500/30 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">
                          {guardian.nickname || 'Unnamed Guardian'}
                        </div>
                        <div className="text-xs text-gray-400">Awaiting activation</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveGuardian(guardian.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Info */}
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-blue-300 mb-1">2-of-3 Recovery Threshold</div>
                <p className="text-sm text-gray-400">
                  You have {activeGuardians.length} active guardian{activeGuardians.length !== 1 ? 's' : ''}. 
                  You need at least 3 active guardians for social recovery. 
                  To recover your account, 2-of-3 guardians must approve the recovery request.
                </p>
              </div>
            </div>
          </div>

          {/* Initiate Recovery Button (for lost key state) */}
          {showRecoveryButton && activeGuardians.length >= 3 && (
            <button
              onClick={handleInitiateRecovery}
              className="w-full mt-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5" />
              Initiate Account Recovery
            </button>
          )}
        </div>
      )}
    </div>
  )
}
