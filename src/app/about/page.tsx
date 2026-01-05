'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function AboutPage() {
  const router = useRouter()
  const [particles, setParticles] = useState<Array<{left: string, top: string, animation: string}>>([])

  // Generate particles only on client to avoid hydration mismatch
  useEffect(() => {
    try {
      setParticles(
        Array.from({ length: 25 }, () => ({
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite ${Math.random() * 2}s`
        }))
      )
    } catch (error) {
      console.error('Error setting particles:', error)
    }
  }, [])

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      {/* Global Background Effects */}
      <div className="fixed inset-0 z-0 bg-white overflow-hidden pointer-events-none">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'center center'
        }}></div>

        {/* Floating Gradient Orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full blur-[120px] opacity-10 animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-gradient-to-br from-[#E4002B] to-[#FF6B35] rounded-full blur-[130px] opacity-10 animate-[float_25s_ease-in-out_infinite] animate-[morph_15s_ease-in-out_infinite]"></div>
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-gradient-to-br from-[#FF6B35] to-[#FF5200] rounded-full blur-[100px] opacity-10 animate-[float_18s_ease-in-out_infinite_5s]"></div>

        {/* Twinkling Particles */}
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#FF5200] rounded-full opacity-40"
            style={{
              top: particle.top,
              left: particle.left,
              animation: particle.animation
            }}
          ></div>
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 sm:pt-24 md:pt-32 pb-16 sm:pb-20 md:pb-24 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-18 md:mb-20">
            <div className="inline-flex items-center px-5 py-2 bg-white/80 backdrop-blur-xl border border-[#FF5200]/20 rounded-full mb-8 shadow-[0_0_20px_rgba(255,82,0,0.1)] opacity-0 animate-[fadeInUp_0.8s_ease-out_0.1s_forwards]">
              <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-2.5 animate-pulse shadow-[0_0_5px_rgba(255,82,0,0.8)]"></span>
              <span className="text-sm font-medium text-gray-700">About Our Platform</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight opacity-0 animate-[fadeInUp_0.8s_ease-out_0.2s_forwards] relative px-4 sm:px-0">
              <span className="whitespace-nowrap">Revolutionizing</span>
              {' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B] relative">
                <span className="whitespace-nowrap">Commercial&nbsp;Real&nbsp;Estate</span>
                <div className="absolute inset-0 blur-md opacity-[0.08]" style={{
                  background: 'radial-gradient(circle, rgba(255,107,53,0.4) 0%, rgba(255,82,0,0.3) 50%, transparent 70%)',
                  animation: 'pulse 2s ease-in-out infinite'
                }}></div>
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed opacity-0 animate-[fadeInUp_0.8s_ease-out_0.3s_forwards] px-4 sm:px-0">
              We&apos;re building the future of property-brand matching using AI, location intelligence, and data-driven insights
            </p>
          </div>

          {/* Stats Grid - Enhanced */}
          <div className="grid md:grid-cols-4 gap-6 mb-20 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.4s_forwards]">
            {[
              { number: '500+', label: 'Properties Listed', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', trend: '↑ 23%' },
              { number: '200+', label: 'Active Brands', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', trend: '↑ 18%' },
              { number: '95%', label: 'Match Success', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', trend: '↑ 5%' },
              { number: 'Instant', label: 'Avg Match Time', icon: 'M13 10V3L4 14h7v7l9-11h-7z', trend: 'Fast' }
            ].map((stat, idx) => (
              <div key={idx} className="group relative" style={{animationDelay: `${0.4 + idx * 0.1}s`}}>
                <div className="absolute -inset-1 bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] rounded-2xl opacity-0 group-hover:opacity-100 blur transition-all duration-700 animate-gradientShift bg-[length:200%_200%]"></div>
                <div className="relative bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-xl border-2 border-gray-200 rounded-2xl p-8 text-center hover:border-[#FF5200] transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#FF5200]/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                  
                  <div className="relative z-10">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                      </svg>
                    </div>
                    
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B] mb-2 group-hover:scale-105 transition-transform">
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray-600 font-semibold uppercase tracking-wider mb-3">{stat.label}</div>
                    <div className="text-xs text-[#FF5200] font-bold">{stat.trend}</div>
                  </div>
                  
                  <div className="absolute inset-0 border-2 border-[#FF5200] rounded-2xl opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Brands Section - Dark Accent */}
      <section className="relative z-10 py-24 md:py-32 bg-gradient-to-b from-gray-900 via-black to-gray-900 overflow-hidden">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(#FF5200 1px, transparent 1px), linear-gradient(90deg, #FF5200 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            animation: 'grid 20s linear infinite'
          }}></div>
        </div>
        
        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-[#FF5200]/30 to-[#E4002B]/30 rounded-full blur-3xl animate-[float_15s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-[#E4002B]/30 to-[#FF6B35]/30 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite_5s]"></div>
        
        {/* Scanning Lines */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#FF5200] to-transparent animate-[scan_4s_ease-in-out_infinite]"></div>
          <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#E4002B] to-transparent animate-[scan_4s_ease-in-out_infinite_2s]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-5 py-2 bg-white/10 backdrop-blur-xl border border-[#FF5200]/30 rounded-full mb-6 shadow-[0_0_20px_rgba(255,82,0,0.3)]">
              <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-2.5 animate-pulse shadow-[0_0_5px_rgba(255,82,0,0.8)]"></span>
              <span className="text-sm font-medium text-white">For Brands</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              <span className="whitespace-nowrap">Find&nbsp;Your</span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B] relative">
                <span className="whitespace-nowrap">Perfect&nbsp;Location</span>
                <div className="absolute inset-0 blur-md opacity-[0.15]" style={{
                  background: 'radial-gradient(circle, rgba(255,107,53,0.6) 0%, rgba(255,82,0,0.4) 50%, transparent 70%)',
                  animation: 'pulse 2s ease-in-out infinite'
                }}></div>
              </span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Data-driven property matching powered by AI and comprehensive location intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'AI-Powered Matching',
                description: 'Our proprietary Brand Fit Index (BFI) analyzes hundreds of data points to match your brand with the perfect properties.',
                features: ['Smart location scoring', 'Competitor proximity analysis', 'Demographic targeting', 'Footfall predictions']
              },
              {
                title: 'Comprehensive Insights',
                description: 'Get detailed analytics on every property including footfall data, demographics, and local market trends.',
                features: ['Real-time footfall data', 'Customer demographics', 'Competition mapping', 'Growth potential analysis']
              },
              {
                title: 'Streamlined Process',
                description: 'From search to signing, we handle everything. Save months of research and negotiation time.',
                features: ['Instant property matches', 'Direct owner communication', 'Automated negotiations', 'Quick onboarding']
              }
            ].map((feature, idx) => (
              <div key={idx} className="group opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]" style={{animationDelay: `${0.5 + idx * 0.1}s`}}>
                <div className="relative h-full">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-3xl opacity-0 group-hover:opacity-100 blur transition-all duration-700 animate-gradientShift bg-[length:200%_200%]"></div>
                  <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border-2 border-gray-700 rounded-3xl p-8 hover:border-[#FF5200] transition-all duration-500 hover:shadow-[0_0_50px_rgba(255,82,0,0.3)] h-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200]/0 to-[#FF5200]/0 group-hover:from-[#FF5200]/10 group-hover:to-[#E4002B]/10 transition-all duration-500"></div>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#FF5200]/20 to-transparent rounded-full blur-2xl"></div>
                    <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <h3 className="relative z-10 text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#FF5200] group-hover:to-[#E4002B] transition-all">{feature.title}</h3>
                    <p className="relative z-10 text-gray-300 mb-6 leading-relaxed">{feature.description}</p>
                    <ul className="relative z-10 space-y-3">
                      {feature.features.map((item, fIdx) => (
                        <li key={fIdx} className="flex items-start text-sm text-gray-400">
                          <span className="w-1.5 h-1.5 bg-[#FF5200] rounded-full mr-3 mt-1.5 flex-shrink-0"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scrolling Ticker */}
      <div className="relative z-10 bg-gradient-to-r from-gray-900 via-black to-gray-900 py-6 overflow-hidden border-y border-[#FF5200]/20">
        <div className="flex gap-8 animate-[scroll_30s_linear_infinite]">
          {[
            'AI-Powered Matching', '500+ Properties', '95% Success Rate', 'Real-time Analytics', 'Location Intelligence', 'Footfall Data', 'Demographics', 'Competitor Mapping',
            'AI-Powered Matching', '500+ Properties', '95% Success Rate', 'Real-time Analytics', 'Location Intelligence', 'Footfall Data', 'Demographics', 'Competitor Mapping',
            'AI-Powered Matching', '500+ Properties', '95% Success Rate', 'Real-time Analytics'
          ].map((text, idx) => (
            <div key={idx} className="flex items-center gap-3 flex-shrink-0">
              <span className="w-2 h-2 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full animate-pulse"></span>
              <span className="text-white font-semibold text-sm whitespace-nowrap">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* For Property Owners Section */}
      <section className="relative z-10 py-24 md:py-32 bg-gradient-to-b from-gray-50/30 to-white overflow-hidden">
        {/* Subtle animated background */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(255,82,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,82,0,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          animation: 'grid 30s linear infinite'
        }}></div>
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-5 py-2 bg-white/80 backdrop-blur-xl border border-[#E4002B]/20 rounded-full mb-6 shadow-[0_0_20px_rgba(228,0,43,0.1)]">
              <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#E4002B] to-[#FF6B35] rounded-full mr-2.5 animate-pulse shadow-[0_0_5px_rgba(228,0,43,0.8)]"></span>
              <span className="text-sm font-medium text-gray-700">For Property Owners</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              <span className="inline-block whitespace-nowrap">List Your</span>{' '}
              <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#E4002B] to-[#FF6B35] relative">
                <span className="inline-block whitespace-nowrap">Prime Properties</span>
                <div className="absolute inset-0 blur-md opacity-[0.08]" style={{
                  background: 'radial-gradient(circle, rgba(228,0,43,0.4) 0%, rgba(255,107,53,0.3) 50%, transparent 70%)',
                  animation: 'pulse 2s ease-in-out infinite'
                }}></div>
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect with pre-qualified brands actively searching for commercial spaces
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Property Fit Index',
                description: 'Our PFI algorithm matches your property with brands that are the perfect fit, maximizing occupancy rates.',
                features: ['Intelligent brand matching', 'Automated tenant screening', 'Optimal pricing suggestions', 'Market demand analysis']
              },
              {
                title: 'Maximum Visibility',
                description: 'Your properties are showcased to thousands of active brands searching for their next location.',
                features: ['Priority listing placement', 'Enhanced property profiles', 'Professional photography support', 'Featured property promotions']
              },
              {
                title: 'Effortless Management',
                description: 'Manage all your listings, inquiries, and negotiations from one powerful dashboard.',
                features: ['Centralized dashboard', 'Automated inquiry responses', 'Document management', 'Performance analytics']
              }
            ].map((feature, idx) => (
              <div key={idx} className="group opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]" style={{animationDelay: `${0.6 + idx * 0.1}s`}}>
                <div className="relative h-full">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#E4002B] to-[#FF6B35] rounded-3xl opacity-0 group-hover:opacity-20 blur transition-all duration-500"></div>
                  <div className="relative bg-white/80 backdrop-blur-xl border-2 border-gray-200 rounded-3xl p-8 hover:border-[#E4002B] transition-all duration-500 hover:shadow-2xl h-full">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#E4002B] to-[#FF6B35] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
                    <ul className="space-y-3">
                      {feature.features.map((item, fIdx) => (
                        <li key={fIdx} className="flex items-start text-sm text-gray-600">
                          <span className="w-1.5 h-1.5 bg-[#E4002B] rounded-full mr-3 mt-1.5 flex-shrink-0"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Partners Section */}
      <section className="relative z-10 py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-5 py-2 bg-white/80 backdrop-blur-xl border border-[#FF6B35]/20 rounded-full mb-6 shadow-[0_0_20px_rgba(255,107,53,0.1)]">
              <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#FF6B35] to-[#FF5200] rounded-full mr-2.5 animate-pulse shadow-[0_0_5px_rgba(255,107,53,0.8)]"></span>
              <span className="text-sm font-medium text-gray-700">For Partners</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              <span className="whitespace-nowrap">Partner</span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B35] to-[#FF5200] relative">
                <span className="whitespace-nowrap">With&nbsp;Us</span>
                <div className="absolute inset-0 blur-md opacity-[0.08]" style={{
                  background: 'radial-gradient(circle, rgba(255,107,53,0.4) 0%, rgba(255,82,0,0.3) 50%, transparent 70%)',
                  animation: 'pulse 2s ease-in-out infinite'
                }}></div>
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Join our growing ecosystem of data providers, real estate agencies, and technology partners
            </p>
            
            {/* Coming Soon Badge */}
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#FF6B35]/10 to-[#FF5200]/10 border-2 border-[#FF5200]/30 rounded-full backdrop-blur-xl">
              <svg className="w-5 h-5 text-[#FF5200] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">
                Coming Soon
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Data Partners',
                description: 'Integrate your location intelligence, footfall data, or market analytics into our platform.',
                features: ['API integration', 'Revenue sharing model', 'Co-branding opportunities', 'Access to our network']
              },
              {
                title: 'Real Estate Agencies',
                description: 'Expand your reach and streamline property transactions through our platform.',
                features: ['White-label solutions', 'Lead generation', 'Commission structures', 'Marketing support']
              },
              {
                title: 'Technology Partners',
                description: 'Build on our platform or integrate complementary services for the real estate ecosystem.',
                features: ['API access', 'Technical documentation', 'Developer support', 'Joint go-to-market']
              }
            ].map((partner, idx) => (
              <div key={idx} className="group opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]" style={{animationDelay: `${0.7 + idx * 0.1}s`}}>
                <div className="relative h-full">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#FF6B35] to-[#FF5200] rounded-3xl opacity-0 group-hover:opacity-20 blur transition-all duration-500"></div>
                  <div className="relative bg-white/80 backdrop-blur-xl border-2 border-gray-200 rounded-3xl p-8 hover:border-[#FF6B35] transition-all duration-500 hover:shadow-2xl h-full">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B35] to-[#FF5200] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{partner.title}</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">{partner.description}</p>
                    <ul className="space-y-3">
                      {partner.features.map((item, fIdx) => (
                        <li key={fIdx} className="flex items-start text-sm text-gray-600">
                          <span className="w-1.5 h-1.5 bg-[#FF6B35] rounded-full mr-3 mt-1.5 flex-shrink-0"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Partner CTA */}
          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-6 text-lg">
              Interested in partnering with us? We&apos;ll be opening our partner program soon.
            </p>
            <button className="px-8 py-4 bg-gradient-to-r from-[#FF6B35] to-[#FF5200] text-white rounded-full font-bold shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 opacity-50 cursor-not-allowed">
              Partner Applications Opening Soon
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 md:py-32 overflow-hidden bg-gradient-to-b from-white to-gray-50/30">
        {/* Energy Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-[500px] h-[500px] border-2 border-[#FF5200]/20 rounded-full animate-[ripple_4s_ease-out_infinite]"></div>
          <div className="absolute w-[500px] h-[500px] border-2 border-[#E4002B]/20 rounded-full animate-[ripple_4s_ease-out_infinite_1.5s]"></div>
          <div className="absolute w-[500px] h-[500px] border-2 border-[#FF6B35]/20 rounded-full animate-[ripple_4s_ease-out_infinite_3s]"></div>
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center px-5 py-2 bg-white/80 backdrop-blur-xl border border-[#FF5200]/20 rounded-full mb-8 shadow-[0_0_20px_rgba(255,82,0,0.1)]">
            <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-2.5 animate-pulse shadow-[0_0_5px_rgba(255,82,0,0.8)]"></span>
            <span className="text-sm font-medium text-gray-700">Join Our Platform</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            <span className="inline-block whitespace-nowrap">Ready to Get</span>{' '}
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B] relative">
              <span className="inline-block whitespace-nowrap">Started?</span>
              <div className="absolute inset-0 blur-md opacity-[0.08]" style={{
                background: 'radial-gradient(circle, rgba(255,107,53,0.4) 0%, rgba(255,82,0,0.3) 50%, transparent 70%)',
                animation: 'pulse 2s ease-in-out infinite'
              }}></div>
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Join thousands of brands and property owners transforming commercial real estate
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button 
              onClick={() => router.push('/onboarding/brand')}
              className="group relative px-12 py-5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-full text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#E4002B] to-[#FF5200] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center gap-2">
                I&apos;m a Brand
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
            
            <button 
              onClick={() => router.push('/onboarding/owner')}
              className="group px-12 py-5 bg-white/80 backdrop-blur-xl border-2 border-gray-300 text-gray-900 rounded-full text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-[#FF5200] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF5200]/10 to-[#E4002B]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center gap-2">
                I&apos;m a Property Owner
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
