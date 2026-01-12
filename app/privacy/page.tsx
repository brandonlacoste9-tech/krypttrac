'use client'

import { Shield, Lock, Eye, Mail } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-gray-400">Last updated: January 15, 2026</p>
        </div>

        {/* Content */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              Krypto Trac ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <Eye className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
              <h2 className="text-2xl font-bold text-white">2. Information We Collect</h2>
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-3 mt-4">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Email address and authentication credentials</li>
              <li>Subscription preferences and payment information (processed via Stripe)</li>
              <li>Portfolio holdings and watchlist data</li>
              <li>Settings and preferences</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.2 Automatically Collected Information</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Device information (browser type, operating system)</li>
              <li>Usage data (features accessed, time spent)</li>
              <li>IP address and location data</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.3 Information We Do NOT Collect</h3>
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                <li><strong className="text-white">Private Keys:</strong> We never collect or store your cryptocurrency private keys</li>
                <li><strong className="text-white">Seed Phrases:</strong> We do not request or store wallet recovery phrases</li>
                <li><strong className="text-white">Transaction Signatures:</strong> All cryptographic signatures are generated client-side</li>
              </ul>
            </div>
          </section>

          {/* How We Use Information */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We use collected information to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Provide and maintain the Service</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send service-related communications</li>
              <li>Improve and personalize user experience</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          {/* Data Storage */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <Lock className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
              <h2 className="text-2xl font-bold text-white">4. Data Storage and Security</h2>
            </div>
            <p className="text-gray-300 leading-relaxed mb-4">
              Your data is stored securely using:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li><strong className="text-white">Supabase:</strong> Encrypted database with Row Level Security (RLS)</li>
              <li><strong className="text-white">Stripe:</strong> PCI-compliant payment processing</li>
              <li><strong className="text-white">Encryption:</strong> Data in transit (TLS) and at rest</li>
              <li><strong className="text-white">Authentication:</strong> Secure session management</li>
            </ul>
            <p className="text-gray-300 mt-4 leading-relaxed">
              While we implement industry-standard security measures, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Third-Party Services</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We use the following third-party services that may collect information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li><strong className="text-white">Supabase:</strong> Database and authentication (privacy policy: supabase.com/privacy)</li>
              <li><strong className="text-white">Stripe:</strong> Payment processing (privacy policy: stripe.com/privacy)</li>
              <li><strong className="text-white">Google Cloud (Vertex AI):</strong> AI analysis (privacy policy: cloud.google.com/privacy)</li>
              <li><strong className="text-white">CoinGecko:</strong> Market data (privacy policy: coingecko.com/privacy)</li>
              <li><strong className="text-white">Vercel/Netlify:</strong> Hosting (privacy policy: vercel.com/privacy / netlify.com/privacy)</li>
            </ul>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Cookies and Tracking</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Maintain your session and authentication state</li>
              <li>Store user preferences and settings</li>
              <li>Analyze usage patterns and improve the Service</li>
              <li>Prevent fraud and ensure security</li>
            </ul>
            <p className="text-gray-300 mt-4 leading-relaxed">
              You can control cookies through your browser settings. Disabling cookies may limit Service functionality.
            </p>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Data Sharing and Disclosure</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We do NOT sell your personal information. We may share data only:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>With service providers necessary to operate the Service (under strict confidentiality agreements)</li>
              <li>To comply with legal obligations or court orders</li>
              <li>To protect our rights, property, or safety</li>
              <li>In connection with a business transfer (merger, acquisition, etc.)</li>
              <li>With your explicit consent</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Your Rights</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Depending on your jurisdiction, you may have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li><strong className="text-white">Access:</strong> Request a copy of your personal data</li>
              <li><strong className="text-white">Rectification:</strong> Correct inaccurate information</li>
              <li><strong className="text-white">Erasure:</strong> Request deletion of your data</li>
              <li><strong className="text-white">Portability:</strong> Export your data in a structured format</li>
              <li><strong className="text-white">Objection:</strong> Opt-out of certain data processing</li>
              <li><strong className="text-white">Withdrawal:</strong> Withdraw consent where applicable</li>
            </ul>
            <p className="text-gray-300 mt-4 leading-relaxed">
              To exercise these rights, contact us at <a href="mailto:kryptotrac@admin.com" className="text-purple-400 hover:text-purple-300 underline">kryptotrac@admin.com</a>
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Data Retention</h2>
            <p className="text-gray-300 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide the Service. After account deletion, we may retain certain information as required by law or for legitimate business purposes (e.g., fraud prevention, dispute resolution).
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Children's Privacy</h2>
            <p className="text-gray-300 leading-relaxed">
              Our Service is not intended for users under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child, we will delete it immediately.
            </p>
          </section>

          {/* International Users */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. International Users</h2>
            <p className="text-gray-300 leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. By using the Service, you consent to the transfer of your information to countries that may have different data protection laws than your country.
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">12. Changes to This Privacy Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. Material changes will be notified via email or through the Service. Your continued use after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <Mail className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold text-white">13. Contact Us</h2>
                <p className="text-gray-300 leading-relaxed mt-4">
                  If you have questions about this Privacy Policy, please contact us:
                </p>
                <div className="mt-4 space-y-2 text-gray-300">
                  <p><strong className="text-white">Email:</strong> <a href="mailto:kryptotrac@admin.com" className="text-purple-400 hover:text-purple-300 underline">kryptotrac@admin.com</a></p>
                  <p><strong className="text-white">Website:</strong> <a href="https://krypttrac.com" className="text-purple-400 hover:text-purple-300 underline">https://krypttrac.com</a></p>
                </div>
              </div>
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
          <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 underline text-sm">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
