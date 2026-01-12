'use client'

import { FileText, Shield, Zap, Brain, Lock } from 'lucide-react'
import Link from 'next/link'

export default function WhitepaperPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Krypto Trac Technical Whitepaper</h1>
          <p className="text-gray-400">Fort Knox Security Architecture & Implementation</p>
          <p className="text-gray-500 text-sm mt-2">Version 1.0 • January 2026</p>
        </div>

        {/* Content */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 space-y-12">
          
          {/* Executive Summary */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-400" />
              1. Executive Summary
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Krypto Trac represents a paradigm shift in cryptocurrency portfolio management by combining zero-trust cryptographic authentication, AI-powered security scanning, and predictive market intelligence into a single, cohesive platform.
            </p>
            <p className="text-gray-300 leading-relaxed">
              This whitepaper outlines the technical architecture, security protocols, and implementation details that enable Krypto Trac to provide institutional-grade security at consumer pricing ($10/month base + modular add-ons).
            </p>
          </section>

          {/* Architecture Overview */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
              <Zap className="w-8 h-8 text-purple-400" />
              2. Architecture Overview
            </h2>
            <div className="bg-slate-900/50 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">2.1 System Components</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">•</span>
                  <div>
                    <strong className="text-white">Frontend:</strong> Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">•</span>
                  <div>
                    <strong className="text-white">Backend:</strong> Next.js API Routes (Serverless), Supabase (PostgreSQL)
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">•</span>
                  <div>
                    <strong className="text-white">AI Engine:</strong> Google Cloud Vertex AI (Gemini 1.5 Flash)
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">•</span>
                  <div>
                    <strong className="text-white">Authentication:</strong> Ed25519 Cryptographic Signing (Colony OS)
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">•</span>
                  <div>
                    <strong className="text-white">Payments:</strong> Stripe Subscriptions (Modular Pricing)
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-400 font-bold">•</span>
                  <div>
                    <strong className="text-white">Data Sources:</strong> CoinGecko API (Market Data), On-chain Data (Ethereum, etc.)
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* Security Architecture */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
              <Lock className="w-8 h-8 text-purple-400" />
              3. Security Architecture: "Fort Knox"
            </h2>
            
            <div className="space-y-6">
              <div className="bg-slate-900/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-3">3.1 The Vault (Ed25519 Cryptographic Signing)</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Traditional web applications rely on session tokens and passwords, which are vulnerable to session hijacking and database breaches. Krypto Trac eliminates this attack vector entirely through Ed25519 elliptic curve cryptography.
                </p>
                <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                  <h4 className="text-white font-semibold mb-2">Implementation:</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                    <li>Every API request requires a cryptographic signature generated with the user's private key</li>
                    <li>Signatures are verified server-side using the user's public key stored in Supabase</li>
                    <li>Replay protection via timestamp and nonce validation</li>
                    <li>Private keys never leave the user's device (client-side signing only)</li>
                  </ul>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  <strong className="text-white">Result:</strong> Even if Krypto Trac's database is compromised, attackers cannot execute transactions without access to the user's physical device and private key.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-3">3.2 The Sentinel (Vertex AI Guardian)</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Before any DeFi transaction is executed, Krypto Trac pipes transaction metadata into Google Cloud Vertex AI (Gemini 1.5 Flash) for real-time security analysis.
                </p>
                <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                  <h4 className="text-white font-semibold mb-2">Scanning Capabilities:</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                    <li>Phishing contract detection (known malicious addresses)</li>
                    <li>Infinite approval vulnerability analysis</li>
                    <li>Re-entrancy attack vector detection</li>
                    <li>Front-running risk assessment</li>
                    <li>Dust attack pattern recognition</li>
                    <li>Suspicious token approval detection</li>
                    <li>Unverified contract code warnings</li>
                  </ul>
                </div>
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                  <p className="text-purple-200 text-sm">
                    <strong>Status Levels:</strong> SAFE (proceed), WARNING (require double confirmation), BLOCK (transaction rejected)
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-3">3.3 The Shield (Multi-Party Computation)</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Krypto Trac implements a simplified MPC (Multi-Party Computation) system to shard private keys across multiple devices, eliminating single points of failure.
                </p>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">Key Sharding (2-of-3):</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                    <li>Private key is split into 3 shards using Shamir's Secret Sharing</li>
                    <li>One shard stored in browser Secure Enclave (local)</li>
                    <li>One shard stored in encrypted backend vault (cloud)</li>
                    <li>One shard stored on user's secondary device (optional)</li>
                    <li>Transactions require 2-of-3 shards to reconstruct key</li>
                  </ul>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-3">3.4 Social Recovery</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Eliminates the need for seed phrases through a guardian-based recovery system. Users nominate 3 trusted guardians (friends, devices, or services). Account recovery requires 2-of-3 guardian approvals.
                </p>
              </div>
            </div>
          </section>

          {/* AI Intelligence */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-400" />
              4. AI-Powered Intelligence
            </h2>
            <div className="bg-slate-900/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-3">4.1 Sentiment Analysis (Vertex AI)</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                News articles are analyzed using Gemini 1.5 Flash to determine market sentiment (Bullish, Bearish, Neutral) with confidence scores (0-100). The model uses Google Search Grounding to verify facts against live data.
              </p>
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">4.2 Whale Movement Prediction</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Large transactions are analyzed to predict market impact. The system considers:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>Transaction size relative to market cap</li>
                <li>Destination (exchange vs. cold storage)</li>
                <li>Historical patterns (similar transactions and outcomes)</li>
                <li>Time-of-day and market conditions</li>
              </ul>
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">4.3 Coin Extraction</h3>
              <p className="text-gray-300 leading-relaxed">
                Weighted frequency analysis identifies primary coins mentioned in news articles, enabling contextual trade buttons and sentiment mapping.
              </p>
            </div>
          </section>

          {/* Data Privacy */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">5. Data Privacy & Storage</h2>
            <div className="bg-slate-900/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-3">5.1 What We DON'T Collect</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-4">
                <li><strong className="text-white">Private Keys:</strong> Never collected or stored</li>
                <li><strong className="text-white">Seed Phrases:</strong> Never requested</li>
                <li><strong className="text-white">Transaction Signatures:</strong> Generated client-side only</li>
                <li><strong className="text-white">Wallet Addresses:</strong> Not stored unless user explicitly adds them</li>
              </ul>
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">5.2 What We DO Collect</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>Email address (for authentication and notifications)</li>
                <li>Subscription preferences and payment information (via Stripe)</li>
                <li>Portfolio holdings (user-provided, encrypted at rest)</li>
                <li>Public keys (for signature verification)</li>
                <li>Usage analytics (anonymized, aggregated)</li>
              </ul>
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">5.3 Encryption</h3>
              <p className="text-gray-300 leading-relaxed">
                All data in transit uses TLS 1.3. Data at rest is encrypted using Supabase's built-in encryption. Row-Level Security (RLS) policies ensure users can only access their own data.
              </p>
            </div>
          </section>

          {/* Monetization Model */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">6. Monetization & Pricing</h2>
            <div className="bg-slate-900/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-3">6.1 Modular Subscription Model</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">Core Tracker ($10/mo)</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Real-time price tracking</li>
                    <li>• News feed with AI sentiment</li>
                    <li>• Portfolio management</li>
                    <li>• Watchlist & alerts</li>
                  </ul>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">Add-Ons</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• DeFi Add-on: $10/mo</li>
                    <li>• Whale Watcher: $5/mo</li>
                    <li>• Magnum Pro: $10/mo</li>
                  </ul>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">6.2 Operational Costs</h3>
              <p className="text-gray-300 leading-relaxed">
                Serverless architecture (Vercel/Netlify) + Supabase + Stripe ensures near-zero operational overhead. Infrastructure scales automatically with usage, maintaining profitability even at scale.
              </p>
            </div>
          </section>

          {/* Technical Specifications */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">7. Technical Specifications</h2>
            <div className="bg-slate-900/50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-white font-semibold mb-2">Performance Metrics</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Transaction Scan: &lt; 2 seconds</li>
                    <li>• Security Confidence: 99%+ accuracy</li>
                    <li>• Whale Prediction: 80%+ accuracy</li>
                    <li>• API Response: &lt; 200ms (p95)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-2">Scalability</h4>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Serverless architecture (auto-scaling)</li>
                    <li>• Database: PostgreSQL (Supabase)</li>
                    <li>• CDN: Vercel Edge Network</li>
                    <li>• Caching: Stale-While-Revalidate (SWR)</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Conclusion */}
          <section>
            <h2 className="text-3xl font-bold text-white mb-4">8. Conclusion</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Krypto Trac demonstrates that institutional-grade security and AI-powered intelligence can be delivered at consumer pricing through careful architecture and serverless infrastructure.
            </p>
            <p className="text-gray-300 leading-relaxed">
              By combining zero-trust authentication (Ed25519), AI security scanning (Vertex AI), and predictive market intelligence, Krypto Trac provides a platform that protects user assets while delivering actionable insights—all for $10/month.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Contact & Inquiries</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              For technical inquiries, security audits, or partnership opportunities:
            </p>
            <div className="space-y-2 text-gray-300">
              <p><strong className="text-white">Email:</strong> <a href="mailto:kryptotrac@admin.com" className="text-purple-400 hover:text-purple-300 underline">kryptotrac@admin.com</a></p>
              <p><strong className="text-white">Website:</strong> <a href="https://krypttrac.com" className="text-purple-400 hover:text-purple-300 underline">https://krypttrac.com</a></p>
            </div>
          </section>

        </div>

        {/* Footer Navigation */}
        <div className="mt-8 text-center space-x-6">
          <Link href="/" className="text-purple-400 hover:text-purple-300 underline text-sm">
            Home
          </Link>
          <Link href="/terms" className="text-purple-400 hover:text-purple-300 underline text-sm">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline text-sm">
            Privacy Policy
          </Link>
          <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 underline text-sm">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
