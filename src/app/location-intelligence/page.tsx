'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function LocationIntelligencePage() {
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState('')
  const [hasUsedFreeSearch, setHasUsedFreeSearch] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const categories = ['Retail', 'F&B', 'Salon & Spa', 'Fitness', 'Office Space', 'Healthcare']

  const handleSearch = () => {
    if (!location || !category) return
    
    // Check if user has used free search
    const usedFree = localStorage.getItem('usedFreeLocationSearch')
    
    if (!usedFree) {
      setShowPreview(true)
      localStorage.setItem('usedFreeLocationSearch', 'true')
      setHasUsedFreeSearch(false)
    } else {
      setHasUsedFreeSearch(true)
      // Show payment modal
    }
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Futuristic Background */}
      <div className="fixed inset-0 z-0">
        {/* Grid */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255, 82, 0, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 82, 0, 0.3) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            animation: 'gridScroll 20s linear infinite'
          }}></div>
        </div>

        {/* Glowing Orbs */}
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-[#FF5200]/20 rounded-full blur-[150px] animate-[float_15s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-[#E4002B]/20 rounded-full blur-[150px] animate-[float_20s_ease-in-out_infinite_5s]"></div>

        {/* Scanning Lines */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-[#FF5200] to-transparent animate-[scan_8s_ease-in-out_infinite]"></div>
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-[#E4002B] to-transparent animate-[scan_6s_ease-in-out_infinite_2s]" style={{ top: '30%' }}></div>
        </div>
      </div>

      <Navbar />

      <div className="relative z-10 pt-32 sm:pt-36 md:pt-40 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#FF5200]/10 to-[#E4002B]/10 border border-[#FF5200]/30 rounded-full mb-6 backdrop-blur-xl">
              <span className="w-2 h-2 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-3 animate-pulse shadow-[0_0_10px_rgba(255,82,0,1)]"></span>
              <span className="text-sm font-semibold bg-gradient-to-r from-[#FF5200] to-[#E4002B] bg-clip-text text-transparent">First Search FREE</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-white">Make</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] animate-gradientShift bg-[length:200%_200%]">Data-Driven</span>
              <br />
              <span className="text-white">Location Decisions</span>
            </h1>

            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
              Access real-time market intelligence, foot traffic patterns, and competitive analysis before you commit to any location
            </p>

            <div className="inline-flex items-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full shadow-[0_0_10px_rgba(255,82,0,0.8)]"></div>
                <span className="text-gray-300">95% Accuracy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full shadow-[0_0_10px_rgba(255,82,0,0.8)]"></div>
                <span className="text-gray-300">100+ Brands Trust Us</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full shadow-[0_0_10px_rgba(255,82,0,0.8)]"></div>
                <span className="text-gray-300">Real-Time Data</span>
              </div>
            </div>
          </div>

          {/* Search Interface */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="relative group">
              {/* Animated Border */}
              <div className="absolute -inset-[2px] bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] rounded-3xl opacity-50 group-hover:opacity-100 blur-sm transition-all duration-700 animate-gradientShift bg-[length:200%_200%]"></div>
              
              <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl rounded-3xl p-8 border border-[#FF5200]/20">
                <div className="space-y-6">
                  {/* Location Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">Enter Location or Address</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Koramangala, Bangalore or specific address..."
                        className="w-full bg-black/50 border border-[#FF5200]/30 rounded-xl px-6 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#FF5200] focus:shadow-[0_0_20px_rgba(255,82,0,0.3)] transition-all"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <svg className="w-5 h-5 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">Select Business Category</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategory(cat)}
                          className={'px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 border-2 ' + (category === cat ? 'bg-gradient-to-r from-[#FF5200] to-[#E4002B] border-[#FF5200] text-white shadow-[0_0_20px_rgba(255,82,0,0.5)]' : 'bg-black/30 border-[#FF5200]/20 text-gray-400 hover:border-[#FF5200]/50 hover:text-white')}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleSearch}
                    disabled={!location || !category}
                    className="w-full py-5 bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] text-white rounded-xl font-bold text-lg hover:shadow-[0_0_40px_rgba(255,82,0,0.6)] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] relative overflow-hidden group"
                  >
                    <span className="relative z-10">Generate Intelligence Report</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B35] via-[#E4002B] to-[#FF5200] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </button>

                  <p className="text-center text-sm text-gray-500">
                    🎁 First search is completely free • Detailed reports from ₹4,999
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* What You Get Section */}
          <div className="mb-20">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-bold mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] animate-gradient">
                  Intelligence
                </span> You Receive
              </h2>
              <p className="text-gray-400 text-lg max-w-3xl mx-auto">
                Comprehensive location insights powered by AI and real-time data sources
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  title: 'Foot Traffic Analysis',
                  desc: 'Daily patterns, peak hours, weekend vs weekday traffic',
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ),
                  gradient: 'from-[#FF5200] to-[#E4002B]'
                },
                {
                  title: 'Demographics Data',
                  desc: 'Age, income levels, spending habits within radius',
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ),
                  gradient: 'from-[#E4002B] to-[#FF6B35]'
                },
                {
                  title: 'Competition Mapping',
                  desc: 'Direct & indirect competitors with revenue estimates',
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  ),
                  gradient: 'from-[#FF6B35] to-[#FF5200]'
                },
                {
                  title: 'Catchment Analysis',
                  desc: '5/10/15 min walk & drive time zones',
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ),
                  gradient: 'from-[#FF5200] to-[#FF6B35]'
                },
                {
                  title: 'Market Demand Score',
                  desc: 'AI-calculated demand for your business category',
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  ),
                  gradient: 'from-[#E4002B] to-[#FF5200]'
                },
                {
                  title: 'Rent Benchmarking',
                  desc: 'Compare prices vs area average with justification',
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  gradient: 'from-[#FF6B35] to-[#E4002B]'
                },
                {
                  title: 'Growth Trends',
                  desc: 'Historical data + projected growth indicators',
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  ),
                  gradient: 'from-[#FF5200] to-[#E4002B]'
                },
                {
                  title: 'Traffic Drivers',
                  desc: 'Anchor stores & major businesses generating footfall',
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  ),
                  gradient: 'from-[#E4002B] to-[#FF6B35]'
                }
              ].map((item, i) => (
                <div key={i} className="relative group">
                  {/* Animated Border Glow */}
                  <div className={'absolute -inset-[2px] bg-gradient-to-r ' + item.gradient + ' rounded-2xl opacity-0 group-hover:opacity-100 blur-md transition-all duration-700'}></div>
                  
                  {/* Card */}
                  <div className="relative h-full bg-gradient-to-br from-black/90 via-gray-900/90 to-black/90 backdrop-blur-xl border border-[#FF5200]/20 rounded-2xl p-6 hover:border-[#FF5200]/60 transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-[0_0_40px_rgba(255,82,0,0.3)]">
                    {/* Icon Container with Gradient Background */}
                    <div className={'relative mb-5 w-16 h-16 rounded-xl bg-gradient-to-br ' + item.gradient + ' p-[2px] group-hover:scale-110 transition-transform duration-500'}>
                      <div className="w-full h-full bg-black/80 rounded-xl flex items-center justify-center text-white">
                        {item.icon}
                      </div>
                    </div>
                    
                    {/* Title with Gradient on Hover */}
                    <h3 className={'text-xl font-bold mb-3 transition-all duration-500 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r ' + item.gradient}>
                      {item.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-500">
                      {item.desc}
                    </p>

                    {/* Bottom Accent Line */}
                    <div className={'absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ' + item.gradient + ' opacity-0 group-hover:opacity-100 rounded-b-2xl transition-opacity duration-500'}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Section */}
          <div className="mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
              Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">Plan</span>
            </h2>
            <p className="text-gray-400 text-center mb-12">Transparent pricing for every business size</p>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Starter */}
              <div className="relative group">
                <div className="absolute -inset-[1px] bg-gradient-to-r from-[#FF5200]/50 to-[#E4002B]/50 rounded-3xl opacity-50 group-hover:opacity-100 blur transition-all duration-500"></div>
                <div className="relative bg-gradient-to-br from-gray-900 to-black border border-[#FF5200]/30 rounded-3xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
                  <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B] mb-6">
                    ₹4,999
                  </div>
                  <ul className="space-y-4 mb-8">
                    {['1 Location Report', 'Full Analysis', 'PDF Export', 'Valid for 30 days'].map((item) => (
                      <li key={item} className="flex items-center text-gray-300">
                        <svg className="w-5 h-5 text-[#FF5200] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button className="w-full py-3 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-xl font-semibold hover:shadow-[0_0_30px_rgba(255,82,0,0.5)] transition-all duration-300">
                    Get Started
                  </button>
                </div>
              </div>

              {/* Growth - Popular */}
              <div className="relative group scale-105 mt-12">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white text-sm font-bold rounded-full shadow-[0_0_20px_rgba(255,82,0,0.8)] z-10">
                  MOST POPULAR
                </div>
                <div className="absolute -inset-[2px] bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-3xl blur-lg opacity-75"></div>
                <div className="relative bg-gradient-to-br from-gray-900 to-black border-2 border-[#FF5200] rounded-3xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Growth</h3>
                  <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B] mb-6">
                    ₹14,999
                  </div>
                  <ul className="space-y-4 mb-8">
                    {['5 Location Reports', 'Comparison Analysis', 'Priority Support', '3 Revisions', 'Valid for 90 days'].map((item) => (
                      <li key={item} className="flex items-center text-gray-300">
                        <svg className="w-5 h-5 text-[#FF5200] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button className="w-full py-3 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-xl font-semibold hover:shadow-[0_0_30px_rgba(255,82,0,0.8)] transition-all duration-300">
                    Choose Growth
                  </button>
                </div>
              </div>

              {/* Enterprise */}
              <div className="relative group">
                <div className="absolute -inset-[1px] bg-gradient-to-r from-[#FF5200]/50 to-[#E4002B]/50 rounded-3xl opacity-50 group-hover:opacity-100 blur transition-all duration-500"></div>
                <div className="relative bg-gradient-to-br from-gray-900 to-black border border-[#FF5200]/30 rounded-3xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
                  <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B] mb-6">
                    Custom
                  </div>
                  <ul className="space-y-4 mb-8">
                    {['Unlimited Reports', 'API Access', 'Dedicated Manager', 'Custom Integrations', '24/7 Support'].map((item) => (
                      <li key={item} className="flex items-center text-gray-300">
                        <svg className="w-5 h-5 text-[#FF5200] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button className="w-full py-3 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-xl font-semibold hover:shadow-[0_0_30px_rgba(255,82,0,0.5)] transition-all duration-300">
                    Contact Sales
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Section */}
          <div className="text-center">
            <div className="inline-flex items-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Data from trusted sources</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#FF5200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Instant delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gridScroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          50% { top: 100%; opacity: 1; }
        }
      `}</style>
    </div>
  )
}
