/**
 * Authentication utilities for getting current user
 * Works with Supabase Auth
 */

import { supabase } from './supabase'

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error getting user:', error)
      return null
    }

    return user
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}

export async function getUserId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.id || null
}

export async function getUserEmail(): Promise<string | undefined> {
  const user = await getCurrentUser()
  return user?.email || undefined
}
