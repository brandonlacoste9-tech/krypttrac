'use client'

import Link from 'next/link'
import { Shield, Mail } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-900/50 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-purple-400" />
              <h3 className="text-xl font-bold text-white">Krypto Trac</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Fort Knox security for crypto. Zero passwords. Zero backdoors. Zero compromises.
            </p>
            <p className="text-gray-500 text-xs">
              © {currentYear} Krypto Trac. All rights reserved.
            </p>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-purple-400 text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-purple-400 text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a 
                  href="/TRADEMARK_POLICY.md" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-purple-400 text-sm transition-colors"
                >
                  Trademark Policy
                </a>
              </li>
              <li>
                <Link href="/whitepaper" className="text-gray-400 hover:text-purple-400 text-sm transition-colors">
                  Technical Whitepaper
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="mailto:kryptotrac@admin.com" 
                  className="text-gray-400 hover:text-purple-400 text-sm transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  kryptotrac@admin.com
                </a>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-400 hover:text-purple-400 text-sm transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Trademark Notice */}
        <div className="mt-8 pt-8 border-t border-slate-800">
          <p className="text-gray-500 text-xs text-center">
            Krypto Trac™, Fort Knox™, Sentinel AI™, and The Vault™ are trademarks of Krypto Trac.
          </p>
        </div>
      </div>
    </footer>
  )
}
