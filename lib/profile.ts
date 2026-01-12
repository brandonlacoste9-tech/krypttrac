import { supabase } from './supabase'

export interface Profile {
  id: string
  email: string
  add_ons: string[]
  created_at: string
  updated_at: string
}

/**
 * Fetch user profile from Supabase
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return data as Profile
  } catch (error) {
    console.error('Failed to fetch profile:', error)
    return null
  }
}

/**
 * Get current user's profile
 */
export async function getCurrentUserProfile(): Promise<Profile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return null
    }

    return getProfile(user.id)
  } catch (error) {
    console.error('Failed to get current user profile:', error)
    return null
  }
}

/**
 * Refresh profile and return add-ons array
 */
export async function refreshUserAddOns(): Promise<string[]> {
  const profile = await getCurrentUserProfile()
  return profile?.add_ons || []
}
