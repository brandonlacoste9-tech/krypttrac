'use client'

import { Shield, FileText, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-gray-400">Last updated: January 15, 2026</p>
        </div>

        {/* Content */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing or using Krypto Trac ("Service", "we", "us", "our"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these Terms, then you may not access the Service.
            </p>
          </section>

          {/* Disclaimer */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
              <h2 className="text-2xl font-bold text-white">2. Disclaimer of Liability</h2>
            </div>
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
              <p className="text-yellow-200 font-semibold mb-2">IMPORTANT NOTICE:</p>
              <p className="text-gray-300 leading-relaxed">
                Krypto Trac is a cryptocurrency tracking and portfolio management tool. We are <strong className="text-white">NOT</strong> responsible for any financial losses, damages, or consequences resulting from:
              </p>
            </div>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Investment decisions made based on information provided by the Service</li>
              <li>Technical issues, downtime, or service interruptions</li>
              <li>Loss of funds due to smart contract vulnerabilities, hacks, or exploits</li>
              <li>Inaccurate data, delayed information, or service errors</li>
              <li>Third-party integrations (Colony OS, Magnum Opus, exchanges, etc.)</li>
              <li>User error, lost passwords, or compromised accounts</li>
              <li>Market volatility, price fluctuations, or trading losses</li>
              <li>Regulatory changes or legal issues in your jurisdiction</li>
            </ul>
            <p className="text-gray-300 mt-4 leading-relaxed">
              <strong className="text-white">You use this Service at your own risk.</strong> Cryptocurrency trading and DeFi activities carry substantial risk of loss. Past performance is not indicative of future results. Always conduct your own research and consult with financial advisors before making investment decisions.
            </p>
          </section>

          {/* Trademark */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <Shield className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
              <h2 className="text-2xl font-bold text-white">3. Trademark Notice</h2>
            </div>
            <p className="text-gray-300 leading-relaxed mb-4">
              "Krypto Trac", "Fort Knox", "Sentinel AI", and associated logos, designs, and branding are trademarks of Krypto Trac. All rights reserved.
            </p>
            <p className="text-gray-300 leading-relaxed">
              You may not use our trademarks, service marks, or trade names in connection with any product or service without our prior written consent. Unauthorized use may result in legal action.
            </p>
          </section>

          {/* Service Description */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Service Description</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Krypto Trac provides cryptocurrency portfolio tracking, market intelligence, and DeFi integration tools. Our Service includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Real-time cryptocurrency price tracking</li>
              <li>AI-powered sentiment analysis and news aggregation</li>
              <li>Whale transaction alerts and market intelligence</li>
              <li>Security scanning and transaction verification (via Vertex AI)</li>
              <li>DeFi staking integration (via Magnum Opus)</li>
              <li>Portfolio management and watchlist features</li>
            </ul>
          </section>

          {/* User Responsibilities */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. User Responsibilities</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Maintaining the security of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Compliance with all applicable laws and regulations</li>
              <li>Verifying the accuracy of information before making financial decisions</li>
              <li>Securing your wallet private keys and recovery phrases</li>
              <li>Paying all subscription fees and charges</li>
            </ul>
          </section>

          {/* Subscription and Payments */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Subscriptions and Payments</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Krypto Trac operates on a subscription model with optional add-ons:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Subscriptions are billed monthly in advance</li>
              <li>All fees are non-refundable except as required by law</li>
              <li>We reserve the right to change pricing with 30 days notice</li>
              <li>Cancellation takes effect at the end of the current billing period</li>
              <li>Free trials automatically convert to paid subscriptions unless cancelled</li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Third-Party Services</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Our Service integrates with third-party services including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li><strong>Colony OS</strong> - Wallet signing and transaction execution</li>
              <li><strong>Magnum Opus</strong> - DeFi staking and yield opportunities</li>
              <li><strong>Vertex AI (Google Cloud)</strong> - Security scanning and analysis</li>
              <li><strong>Supabase</strong> - Data storage and authentication</li>
              <li><strong>Stripe</strong> - Payment processing</li>
              <li><strong>CoinGecko</strong> - Market data and news</li>
            </ul>
            <p className="text-gray-300 mt-4 leading-relaxed">
              We are not responsible for the availability, accuracy, or security of third-party services. Your use of third-party services is subject to their respective terms of service.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, KRYPT TRAC AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, revenue, data, or use</li>
              <li>Financial losses from trading or investment decisions</li>
              <li>Loss of funds due to smart contract exploits, hacks, or vulnerabilities</li>
              <li>Service interruptions, downtime, or technical failures</li>
            </ul>
            <p className="text-gray-300 mt-4 leading-relaxed">
              Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim, or $100, whichever is greater.
            </p>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Indemnification</h2>
            <p className="text-gray-300 leading-relaxed">
              You agree to indemnify and hold harmless Krypto Trac, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising out of your use of the Service, violation of these Terms, or infringement of any rights of another party.
            </p>
          </section>

          {/* Modifications */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Modifications to Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to modify these Terms at any time. Material changes will be notified via email or through the Service. Your continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. Termination</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We may terminate or suspend your account and access to the Service immediately, without prior notice, for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Violation of these Terms</li>
              <li>Fraudulent or illegal activity</li>
              <li>Non-payment of fees</li>
              <li>At our sole discretion, with or without cause</li>
            </ul>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">12. Governing Law</h2>
            <p className="text-gray-300 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions. Any disputes arising from these Terms shall be resolved in the courts of [Your Jurisdiction].
            </p>
          </section>

          {/* Contact */}
          <section className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">13. Contact Information</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <div className="space-y-2 text-gray-300">
              <p><strong className="text-white">Email:</strong> <a href="mailto:kryptotrac@admin.com" className="text-purple-400 hover:text-purple-300 underline">kryptotrac@admin.com</a></p>
              <p><strong className="text-white">Website:</strong> <a href="https://krypttrac.com" className="text-purple-400 hover:text-purple-300 underline">https://krypttrac.com</a></p>
            </div>
          </section>

          {/* Acknowledgment */}
          <section className="bg-slate-900/50 border border-slate-600 rounded-lg p-6">
            <p className="text-gray-300 text-sm leading-relaxed">
              <strong className="text-white">By using Krypto Trac, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</strong> If you do not agree to these Terms, you must not use the Service.
            </p>
          </section>

        </div>

        {/* Footer Navigation */}
        <div className="mt-8 text-center space-x-6">
          <Link href="/" className="text-purple-400 hover:text-purple-300 underline text-sm">
            Home
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
