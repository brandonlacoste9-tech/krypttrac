import { Shield, Lock, Eye, Users, CheckCircle2, Sparkles } from 'lucide-react'
import { FortKnoxBadge } from '@/components/FortKnoxBadge'

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-12 h-12 text-purple-400" />
            <h1 className="text-5xl font-bold text-white">Fort Knox Security</h1>
            <Sparkles className="w-12 h-12 text-yellow-400" />
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Institutional-grade security architecture designed to make it mathematically 
            impossible for hackers to steal funds, even if they compromise your device.
          </p>
        </div>

        {/* Three Layers */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Layer 1: The Vault */}
          <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">The Vault</h2>
            <p className="text-gray-300 mb-4">
              <strong>Ed25519 Cryptographic Signing</strong>
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Every action is signed locally on your device using elliptic curve cryptography. 
              No passwords, no session tokens—only cryptographic proofs that only your device can generate.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero passwords stored</span>
              </div>
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>No session hijacking possible</span>
              </div>
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Device-level signing</span>
              </div>
            </div>
          </div>

          {/* Layer 2: The Sentinel */}
          <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mb-6">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">The Sentinel</h2>
            <p className="text-gray-300 mb-4">
              <strong>Vertex AI Guardian</strong>
            </p>
            <p className="text-gray-400 text-sm mb-6">
              AI-powered transaction scanner analyzes every transaction before you sign. 
              Detects phishing contracts, infinite approvals, and re-entrancy vulnerabilities in real-time.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Phishing detection</span>
              </div>
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Smart contract auditing</span>
              </div>
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>99%+ safety scores</span>
              </div>
            </div>
          </div>

          {/* Layer 3: The Shield */}
          <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 backdrop-blur-xl border border-green-500/30 rounded-2xl p-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center mb-6">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">The Shield</h2>
            <p className="text-gray-300 mb-4">
              <strong>Social Recovery</strong>
            </p>
            <p className="text-gray-400 text-sm mb-6">
              No more lost seed phrases. Nominate 3 trusted guardians (friends or devices) 
              to recover your account with a 2-of-3 quorum. Your keys are sharded across 
              multiple locations for maximum security.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>2-of-3 guardian recovery</span>
              </div>
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>MPC key sharding</span>
              </div>
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>No seed phrase needed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Features */}
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Why Fort Knox Security Matters
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-purple-300 mb-3">
                Protection Against Modern Threats
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Phishing contract detection</li>
                <li>• Infinite approval prevention</li>
                <li>• Re-entrancy attack blocking</li>
                <li>• Front-running protection</li>
                <li>• Dust attack detection</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-purple-300 mb-3">
                Zero-Trust Architecture
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li>• No passwords to steal</li>
                <li>• No session tokens to hijack</li>
                <li>• Every request cryptographically verified</li>
                <li>• Device-level signing required</li>
                <li>• Multi-party computation for keys</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="inline-flex items-center gap-4 mb-6">
            <FortKnoxBadge variant="large" />
            <span className="text-2xl font-bold text-white">Ready to Secure Your Portfolio?</span>
            <FortKnoxBadge variant="large" />
          </div>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Start with the $10/mo Core plan and add Fort Knox Security features. 
            Your peace of mind is worth it.
          </p>
          <a
            href="/dashboard"
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-500/50"
          >
            Get Started
          </a>
        </div>
      </div>
    </main>
  )
}
