// ============================================
// Krypto Trac: Revenue Dashboard Client
// Real-time revenue tracking and analytics
// ============================================

import { createClient, RealtimeChannel } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export interface RevenueSummary {
  today_revenue: number
  week_revenue: number
  month_revenue: number
  total_revenue: number
  pending_revenue: number
  today_performance: number
  today_swaps: number
  today_subscriptions: number
}

export interface DailyRevenue {
  day: string
  performance_revenue: number
  swap_revenue: number
  referral_revenue: number
  protection_revenue: number
  subscription_revenue: number
  vault_revenue: number
  indexer_revenue: number
  ad_revenue: number
  total_revenue: number
  pending_revenue: number
}

/**
 * Get real-time revenue summary
 */
export async function getRevenueSummary(): Promise<RevenueSummary | null> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const { data, error } = await supabase
    .from('revenue_summary')
    .select('*')
    .single()
  
  if (error) {
    console.error('Error fetching revenue summary:', error)
    return null
  }
  
  return data as RevenueSummary
}

/**
 * Get daily revenue analytics
 */
export async function getDailyRevenue(days: number = 30): Promise<DailyRevenue[]> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const { data, error } = await supabase
    .from('monetization_analytics')
    .select('*')
    .order('day', { ascending: false })
    .limit(days)
  
  if (error) {
    console.error('Error fetching daily revenue:', error)
    return []
  }
  
  return (data || []) as DailyRevenue[]
}

/**
 * Subscribe to real-time revenue updates
 */
export function subscribeToRevenueUpdates(
  onUpdate: (update: { type: string; fee_amount: number; timestamp: string }) => void
): RealtimeChannel {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const channel = supabase.channel('revenue_updates')
    .on('broadcast', { event: 'fees_collected' }, (payload) => {
      onUpdate({
        type: 'fees_collected',
        fee_amount: payload.payload.total_amount,
        timestamp: payload.payload.timestamp,
      })
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'transaction_history',
    }, (payload) => {
      onUpdate({
        type: 'new_transaction',
        fee_amount: payload.new.fee_amount,
        timestamp: payload.new.created_at,
      })
    })
    .subscribe()
  
  return channel
}

/**
 * Get revenue breakdown by type
 */
export async function getRevenueBreakdown(startDate: string, endDate: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const { data, error } = await supabase
    .from('transaction_history')
    .select('transaction_type, fee_amount')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .eq('status', 'collected')
  
  if (error) {
    console.error('Error fetching revenue breakdown:', error)
    return {}
  }
  
  // Group by transaction type
  const breakdown = (data || []).reduce((acc, tx) => {
    const type = tx.transaction_type
    acc[type] = (acc[type] || 0) + parseFloat(tx.fee_amount)
    return acc
  }, {} as Record<string, number>)
  
  return breakdown
}

/**
 * Get top revenue-generating users
 */
export async function getTopRevenueUsers(limit: number = 10) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const { data, error } = await supabase
    .from('transaction_history')
    .select('user_id, fee_amount')
    .eq('status', 'collected')
    .not('user_id', 'is', null)
  
  if (error) {
    console.error('Error fetching top users:', error)
    return []
  }
  
  // Group by user and sum
  const userTotals = (data || []).reduce((acc, tx) => {
    const userId = tx.user_id
    acc[userId] = (acc[userId] || 0) + parseFloat(tx.fee_amount)
    return acc
  }, {} as Record<string, number>)
  
  // Sort and return top users
  return Object.entries(userTotals)
    .map(([user_id, total]) => ({ user_id, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
}
