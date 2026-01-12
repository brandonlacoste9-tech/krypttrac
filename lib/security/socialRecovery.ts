/**
 * Social Recovery System - Guardian-Based Account Recovery
 * Eliminates the "lost seed phrase" problem
 */

export interface Guardian {
  id: string
  userId: string // User being protected
  guardianUserId: string // Guardian's user ID
  guardianPublicKey: string // Guardian's public key for signing
  status: 'pending' | 'active' | 'revoked'
  createdAt: number
  nickname?: string // User-friendly name (e.g., "My Phone", "Friend's Device")
}

export interface RecoveryRequest {
  id: string
  userId: string
  newPublicKey: string // New public key to recover to
  guardians: Guardian[]
  signatures: RecoverySignature[]
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: number
  completedAt?: number
}

export interface RecoverySignature {
  guardianId: string
  signature: string // Ed25519 signature of the recovery request
  signedAt: number
}

/**
 * Threshold: 2-of-3 guardians required for recovery
 */
const RECOVERY_THRESHOLD = 2
const MIN_GUARDIANS = 3

/**
 * Add a guardian to a user's recovery system
 */
export async function addGuardian(
  userId: string,
  guardianUserId: string,
  guardianPublicKey: string,
  nickname?: string
): Promise<Guardian> {
  // In production, store in Supabase
  const guardian: Guardian = {
    id: `guardian-${Date.now()}`,
    userId,
    guardianUserId,
    guardianPublicKey,
    status: 'pending',
    createdAt: Date.now(),
    nickname,
  }

  // TODO: Store in Supabase and send invitation to guardian
  
  return guardian
}

/**
 * Initiate account recovery
 * Requires 2-of-3 guardians to approve
 */
export async function initiateRecovery(
  userId: string,
  newPublicKey: string,
  guardians: Guardian[]
): Promise<RecoveryRequest> {
  if (guardians.length < MIN_GUARDIANS) {
    throw new Error(`Need at least ${MIN_GUARDIANS} guardians`)
  }

  const activeGuardians = guardians.filter(g => g.status === 'active')
  if (activeGuardians.length < MIN_GUARDIANS) {
    throw new Error(`Need at least ${MIN_GUARDIANS} active guardians`)
  }

  const recoveryRequest: RecoveryRequest = {
    id: `recovery-${Date.now()}`,
    userId,
    newPublicKey,
    guardians: activeGuardians,
    signatures: [],
    status: 'pending',
    requestedAt: Date.now(),
  }

  // TODO: Store in Supabase and notify guardians

  return recoveryRequest
}

/**
 * Guardian signs a recovery request
 */
export async function signRecoveryRequest(
  recoveryRequestId: string,
  guardianId: string,
  signature: string
): Promise<RecoveryRequest | null> {
  // TODO: Load from Supabase
  // const recoveryRequest = await loadRecoveryRequest(recoveryRequestId)

  // Verify guardian is authorized
  // Add signature to recovery request
  
  // Check if threshold reached
  // If 2-of-3 signatures, approve recovery

  // For now, return null (placeholder)
  return null
}

/**
 * Execute recovery after threshold is met
 * Updates user's public key to the new one
 */
export async function executeRecovery(
  recoveryRequestId: string
): Promise<boolean> {
  // TODO: Load recovery request from Supabase
  // Verify 2-of-3 signatures
  // Update user's public key in Supabase
  // Mark recovery as completed

  return true
}

/**
 * Get active guardians for a user
 */
export async function getGuardians(userId: string): Promise<Guardian[]> {
  // TODO: Load from Supabase
  // SELECT * FROM guardians WHERE user_id = userId AND status = 'active'
  
  return []
}

/**
 * Revoke a guardian
 */
export async function revokeGuardian(
  userId: string,
  guardianId: string
): Promise<void> {
  // TODO: Update guardian status to 'revoked' in Supabase
  // Ensure user still has at least 3 guardians
}
