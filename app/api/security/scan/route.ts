import { NextRequest, NextResponse } from 'next/server'
import { scanTransaction, TransactionMetadata } from '@/lib/security/guardian'

/**
 * Security Scanner API
 * Public endpoint for scanning transactions before signing
 */
export async function POST(request: NextRequest) {
  try {
    const tx = await request.json() as TransactionMetadata

    if (!tx.contractAddress) {
      return NextResponse.json(
        { error: 'Contract address is required' },
        { status: 400 }
      )
    }

    const auditResult = await scanTransaction(tx)

    return NextResponse.json({
      success: true,
      ...auditResult,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Security scan error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to scan transaction',
      },
      { status: 500 }
    )
  }
}
