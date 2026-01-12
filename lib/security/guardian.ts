/**
 * Vertex AI Guardian - Transaction Safety Scanner
 * The Sentinel: Scans every transaction before Colony OS signing
 */

import { analyzeSentimentWithVertexAI } from '../vertexAI'

export type SafetyStatus = 'SAFE' | 'WARNING' | 'BLOCK' | 'UNKNOWN'

export interface SecurityAuditResult {
  status: SafetyStatus
  confidence: number // 0-100
  risks: string[]
  recommendations: string[]
  contractAnalysis?: {
    isKnownPhishing: boolean
    hasInfiniteApproval: boolean
    reentrancyRisk: boolean
    frontRunRisk: boolean
  }
}

export interface TransactionMetadata {
  contractAddress: string
  contractABI?: string
  functionName: string
  parameters?: Record<string, any>
  value?: string // ETH amount
  tokenAddress?: string // Token contract address
  approvalAmount?: string // Token approval amount
  recipientAddress?: string
  chainId?: number
}

/**
 * Scan a transaction using Vertex AI Guardian
 * Analyzes contract safety before user signs with Colony OS
 */
export async function scanTransaction(
  tx: TransactionMetadata
): Promise<SecurityAuditResult> {
  try {
    const prompt = `You are a blockchain security expert analyzing a smart contract transaction for safety.

Transaction Details:
- Contract Address: ${tx.contractAddress}
- Function: ${tx.functionName}
${tx.value ? `- Value: ${tx.value} ETH` : ''}
${tx.tokenAddress ? `- Token: ${tx.tokenAddress}` : ''}
${tx.approvalAmount ? `- Approval Amount: ${tx.approvalAmount}` : ''}
${tx.recipientAddress ? `- Recipient: ${tx.recipientAddress}` : ''}
${tx.chainId ? `- Chain ID: ${tx.chainId}` : ''}

Analyze this transaction for the following risks:
1. Phishing contracts (known malicious addresses)
2. Infinite approval vulnerabilities
3. Re-entrancy attack vectors
4. Front-running risks
5. Dust attack patterns
6. Suspicious token approvals
7. Unverified contract code

Provide your analysis in this exact JSON format:
{
  "status": "SAFE" | "WARNING" | "BLOCK",
  "confidence": 0-100,
  "risks": ["risk1", "risk2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "contractAnalysis": {
    "isKnownPhishing": boolean,
    "hasInfiniteApproval": boolean,
    "reentrancyRisk": boolean,
    "frontRunRisk": boolean
  }
}

Rules:
- Use "BLOCK" if the contract is confirmed malicious or has critical vulnerabilities
- Use "WARNING" if there are suspicious patterns but no confirmed threats
- Use "SAFE" if the transaction appears legitimate
- Confidence should reflect how certain you are (higher = more certain)

JSON response only:`

    // Use Vertex AI to analyze
    const model = await import('@google/generative-ai').then(m => {
      const { GoogleGenerativeAI } = m
      const apiKey = process.env.GOOGLE_CLOUD_API_KEY || ''
      if (!apiKey) return null
      return new GoogleGenerativeAI(apiKey)
    })

    if (!model) {
      // Fallback to basic checks if Vertex AI unavailable
      return fallbackSecurityCheck(tx)
    }

    const genModel = model.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.2, // Low temperature for consistent security analysis
        maxOutputTokens: 500,
      },
    })

    const result = await genModel.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return fallbackSecurityCheck(tx)
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      status: parsed.status || 'UNKNOWN',
      confidence: parsed.confidence || 50,
      risks: parsed.risks || [],
      recommendations: parsed.recommendations || [],
      contractAnalysis: parsed.contractAnalysis || {
        isKnownPhishing: false,
        hasInfiniteApproval: false,
        reentrancyRisk: false,
        frontRunRisk: false,
      },
    }
  } catch (error) {
    console.error('Guardian scan error:', error)
    return fallbackSecurityCheck(tx)
  }
}

/**
 * Fallback security check when Vertex AI is unavailable
 * Performs basic pattern matching
 */
function fallbackSecurityCheck(
  tx: TransactionMetadata
): SecurityAuditResult {
  const risks: string[] = []
  const recommendations: string[] = []

  // Check for infinite approval
  if (tx.approvalAmount) {
    const approvalAmount = BigInt(tx.approvalAmount)
    const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
    
    if (approvalAmount === maxUint256 || approvalAmount > BigInt('1000000000000000000000000')) {
      risks.push('Infinite or extremely high token approval detected')
      recommendations.push('Consider using a limited approval amount')
      return {
        status: 'WARNING',
        confidence: 70,
        risks,
        recommendations,
        contractAnalysis: {
          isKnownPhishing: false,
          hasInfiniteApproval: true,
          reentrancyRisk: false,
          frontRunRisk: false,
        },
      }
    }
  }

  // Check for suspicious contract address patterns
  if (tx.contractAddress && tx.contractAddress.length !== 42) {
    risks.push('Invalid contract address format')
    return {
      status: 'BLOCK',
      confidence: 100,
      risks,
      recommendations: ['Do not proceed with this transaction'],
      contractAnalysis: {
        isKnownPhishing: false,
        hasInfiniteApproval: false,
        reentrancyRisk: false,
        frontRunRisk: false,
      },
    }
  }

  return {
    status: 'SAFE',
    confidence: 50, // Lower confidence for fallback
    risks: [],
    recommendations: ['AI analysis unavailable - proceed with caution'],
    contractAnalysis: {
      isKnownPhishing: false,
      hasInfiniteApproval: false,
      reentrancyRisk: false,
      frontRunRisk: false,
    },
  }
}

/**
 * Check if a contract address is in a known phishing database
 * (In production, integrate with a real threat intelligence API)
 */
export async function checkPhishingDatabase(
  contractAddress: string
): Promise<boolean> {
  // TODO: Integrate with threat intelligence API
  // For now, return false (safe)
  return false
}
