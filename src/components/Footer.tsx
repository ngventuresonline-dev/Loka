'use client'

import Link from 'next/link'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="relative z-10 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div>
            <div className="mb-4">
              <Logo size="md" showText={true} showPoweredBy={false} href="/" variant="dark" />
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              AI Powered Commercial Real Estate Matchmaking Platform
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-gray-400 hover:text-[#FF5200] transition-colors">How It Works</Link></li>
              <li><Link href="/#brand-placements" className="text-gray-400 hover:text-[#FF5200] transition-colors">Success Stories</Link></li>
              <li><Link href="/blog" className="text-gray-400 hover:text-[#FF5200] transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h4 className="font-bold mb-4 text-lg">For Users</h4>
            <ul className="space-y-3">
              <li><Link href="/for-brands" className="text-gray-400 hover:text-[#FF5200] transition-colors">For Brands</Link></li>
              <li><Link href="/filter/owner" className="text-gray-400 hover:text-[#FF5200] transition-colors">List Property</Link></li>
              <li><Link href="/auth/login" className="text-gray-400 hover:text-[#FF5200] transition-colors">Brand Login</Link></li>
              <li><Link href="/auth/login" className="text-gray-400 hover:text-[#FF5200] transition-colors">Property Listing Login</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Contact Us</h4>
            <p className="text-gray-400 mb-4 text-sm">Unit of N & G Ventures</p>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#FF5200] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>support@lokazen.in</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#FF5200] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Kokarya Business Synergy Centre, Jayanagar, Bengaluru 560041</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Lokazen. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-gray-400 hover:text-[#FF5200] transition-colors" prefetch={true}>Privacy Policy</Link>
            <Link href="/terms" className="text-gray-400 hover:text-[#FF5200] transition-colors" prefetch={true}>Terms & Conditions</Link>
            <Link href="/cookies" className="text-gray-400 hover:text-[#FF5200] transition-colors" prefetch={true}>Cookies Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
