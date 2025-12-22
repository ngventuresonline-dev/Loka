'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  category: string
  author: string
  date: string
  readTime: string
  image?: string
  tags: string[]
}

const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Top 10 Commercial Real Estate Hotspots in Bangalore for 2025',
    excerpt: 'Discover the most promising commercial locations in Bangalore, from Koramangala to Whitefield. Learn about footfall patterns, rental trends, and why these areas are attracting top brands.',
    category: 'Location Intelligence',
    author: 'Lokazen Team',
    date: '2025-01-15',
    readTime: '8 min read',
    tags: ['Bangalore', 'Commercial Real Estate', 'Location Intelligence']
  },
  {
    id: '2',
    title: 'Why Indiranagar Remains Bangalore\'s Premier F&B Destination',
    excerpt: 'An in-depth analysis of Indiranagar\'s commercial real estate landscape, foot traffic data, and why restaurants and cafes continue to thrive in this vibrant neighborhood.',
    category: 'Market Analysis',
    author: 'Lokazen Team',
    date: '2025-01-12',
    readTime: '6 min read',
    tags: ['Bangalore', 'Indiranagar', 'F&B', 'Market Trends']
  },
  {
    id: '3',
    title: 'Commercial Real Estate Trends in Delhi: A 2025 Guide',
    excerpt: 'Explore Delhi\'s commercial property market, from Connaught Place to Cyber City. Understand rental rates, vacancy trends, and emerging business districts.',
    category: 'Market Analysis',
    author: 'Lokazen Team',
    date: '2025-01-10',
    readTime: '10 min read',
    tags: ['Delhi', 'Commercial Real Estate', 'Market Trends']
  },
  {
    id: '4',
    title: 'Koramangala vs HSR Layout: Which Area is Better for Your Business?',
    excerpt: 'A comprehensive comparison of two of Bangalore\'s most sought-after commercial locations. Compare footfall, demographics, rental costs, and business success rates.',
    category: 'Location Comparison',
    author: 'Lokazen Team',
    date: '2025-01-08',
    readTime: '7 min read',
    tags: ['Bangalore', 'Koramangala', 'HSR Layout', 'Comparison']
  },
  {
    id: '5',
    title: 'The Rise of Cloud Kitchens: Finding the Perfect Location in Bangalore',
    excerpt: 'Cloud kitchens don\'t need prime visibility, but location still matters. Learn about ideal areas, power requirements, and cost-effective strategies for cloud kitchen operators.',
    category: 'Industry Insights',
    author: 'Lokazen Team',
    date: '2025-01-05',
    readTime: '5 min read',
    tags: ['Cloud Kitchen', 'Bangalore', 'F&B', 'Location Strategy']
  },
  {
    id: '6',
    title: 'Commercial Property Investment Guide: Bangalore vs Delhi vs Mumbai',
    excerpt: 'Compare commercial real estate investment opportunities across India\'s top metros. ROI analysis, market stability, and growth potential for property investors.',
    category: 'Investment',
    author: 'Lokazen Team',
    date: '2025-01-03',
    readTime: '12 min read',
    tags: ['Investment', 'Bangalore', 'Delhi', 'Mumbai', 'Commercial Real Estate']
  },
  {
    id: '7',
    title: 'Whitefield: Bangalore\'s Tech Hub Commercial Real Estate Boom',
    excerpt: 'How Whitefield transformed from a suburb to a commercial powerhouse. Tech parks, retail spaces, and the future of commercial real estate in this rapidly growing area.',
    category: 'Location Intelligence',
    author: 'Lokazen Team',
    date: '2025-01-01',
    readTime: '9 min read',
    tags: ['Whitefield', 'Bangalore', 'Tech Hub', 'Commercial Real Estate']
  },
  {
    id: '8',
    title: 'Retail Space Rental Rates in Bangalore: Complete 2025 Guide',
    excerpt: 'Comprehensive guide to retail rental rates across Bangalore\'s major commercial areas. From street retail to mall spaces, understand pricing trends and negotiation strategies.',
    category: 'Market Analysis',
    author: 'Lokazen Team',
    date: '2025-12-28',
    readTime: '8 min read',
    tags: ['Retail', 'Bangalore', 'Rental Rates', 'Market Analysis']
  },
  {
    id: '9',
    title: 'Delhi NCR Commercial Real Estate: Gurgaon vs Noida vs Delhi',
    excerpt: 'Compare commercial real estate opportunities across Delhi NCR. Which area offers the best value, growth potential, and business environment for your brand?',
    category: 'Location Comparison',
    author: 'Lokazen Team',
    date: '2025-12-25',
    readTime: '11 min read',
    tags: ['Delhi', 'Gurgaon', 'Noida', 'Commercial Real Estate', 'Comparison']
  },
  {
    id: '10',
    title: 'Foot Traffic Analysis: Best Times to Open Your Business in Bangalore',
    excerpt: 'Data-driven insights on peak footfall hours across Bangalore\'s commercial districts. Learn when customers visit and how to optimize your opening hours.',
    category: 'Location Intelligence',
    author: 'Lokazen Team',
    date: '2025-12-22',
    readTime: '6 min read',
    tags: ['Foot Traffic', 'Bangalore', 'Data Analysis', 'Business Strategy']
  },
  {
    id: '11',
    title: 'Commercial Real Estate Due Diligence: What Every Business Owner Should Know',
    excerpt: 'Essential checklist for commercial property due diligence. Legal considerations, property verification, and red flags to watch out for before signing a lease.',
    category: 'Industry Insights',
    author: 'Lokazen Team',
    date: '2025-12-20',
    readTime: '9 min read',
    tags: ['Due Diligence', 'Commercial Real Estate', 'Legal', 'Best Practices']
  },
  {
    id: '12',
    title: 'Marathahalli: The Hidden Gem of Bangalore Commercial Real Estate',
    excerpt: 'Why Marathahalli is becoming a preferred location for businesses. Affordable rents, good connectivity, and growing commercial infrastructure make it an attractive option.',
    category: 'Location Intelligence',
    author: 'Lokazen Team',
    date: '2025-12-18',
    readTime: '7 min read',
    tags: ['Marathahalli', 'Bangalore', 'Commercial Real Estate', 'Emerging Areas']
  },
  {
    id: '13',
    title: 'QSR Brands in Bangalore: Location Strategy for Quick Service Restaurants',
    excerpt: 'Specific location requirements for QSR brands. High-footfall areas, parking needs, and why certain locations work better for quick-service concepts.',
    category: 'Industry Insights',
    author: 'Lokazen Team',
    date: '2025-12-15',
    readTime: '8 min read',
    tags: ['QSR', 'Bangalore', 'F&B', 'Location Strategy']
  },
  {
    id: '14',
    title: 'Commercial Lease Negotiation: Tips from Industry Experts',
    excerpt: 'Master the art of commercial lease negotiation. Learn key terms, common pitfalls, and strategies to secure favorable lease agreements for your business.',
    category: 'Industry Insights',
    author: 'Lokazen Team',
    date: '2025-12-12',
    readTime: '10 min read',
    tags: ['Lease Negotiation', 'Commercial Real Estate', 'Business Strategy']
  },
  {
    id: '15',
    title: 'Bellandur and Sarjapur Road: Bangalore\'s Next Commercial Corridors',
    excerpt: 'How Bellandur and Sarjapur Road are evolving into major commercial destinations. Infrastructure development, business growth, and future potential.',
    category: 'Location Intelligence',
    author: 'Lokazen Team',
    date: '2025-12-10',
    readTime: '7 min read',
    tags: ['Bellandur', 'Sarjapur Road', 'Bangalore', 'Emerging Areas']
  },
  {
    id: '16',
    title: 'Commercial Real Estate Technology: How AI is Transforming Property Search',
    excerpt: 'Explore how AI-powered platforms like Lokazen are revolutionizing commercial property search. Matchmaking algorithms, location intelligence, and data-driven decisions.',
    category: 'Technology',
    author: 'Lokazen Team',
    date: '2025-12-08',
    readTime: '6 min read',
    tags: ['AI', 'Technology', 'Commercial Real Estate', 'Innovation']
  },
  {
    id: '17',
    title: 'Delhi Commercial Real Estate: Connaught Place vs Khan Market vs Hauz Khas',
    excerpt: 'Compare three of Delhi\'s most iconic commercial areas. Understand the unique characteristics, rental dynamics, and which location suits different business types.',
    category: 'Location Comparison',
    author: 'Lokazen Team',
    date: '2025-12-05',
    readTime: '9 min read',
    tags: ['Delhi', 'Connaught Place', 'Khan Market', 'Hauz Khas', 'Comparison']
  },
  {
    id: '18',
    title: 'Commercial Property Maintenance: A Complete Guide for Property Owners',
    excerpt: 'Essential maintenance practices for commercial property owners. Building systems, tenant relations, and how proper maintenance increases property value.',
    category: 'Property Management',
    author: 'Lokazen Team',
    date: '2025-12-03',
    readTime: '8 min read',
    tags: ['Property Management', 'Maintenance', 'Commercial Real Estate']
  }
]

const categories = ['All', 'Location Intelligence', 'Market Analysis', 'Industry Insights', 'Investment', 'Location Comparison', 'Technology', 'Property Management']

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory
    const matchesSearch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

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
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-gradient-to-br from-[#E4002B] to-[#FF6B35] rounded-full blur-[130px] opacity-10 animate-[float_25s_ease-in-out_infinite]"></div>
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-gradient-to-br from-[#FF6B35] to-[#FF5200] rounded-full blur-[100px] opacity-10 animate-[float_18s_ease-in-out_infinite_5s]"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center px-5 py-2 bg-white/80 backdrop-blur-xl border border-[#FF5200]/20 rounded-full mb-8 shadow-[0_0_20px_rgba(255,82,0,0.1)] opacity-0 animate-[fadeInUp_0.8s_ease-out_0.1s_forwards]">
              <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-2.5 animate-pulse shadow-[0_0_5px_rgba(255,82,0,0.8)]"></span>
              <span className="text-sm font-medium text-gray-700">Insights & Resources</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight opacity-0 animate-[fadeInUp_0.8s_ease-out_0.2s_forwards]">
              Commercial Real Estate <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">Blog</span>
            </h1>

            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed opacity-0 animate-[fadeInUp_0.8s_ease-out_0.3s_forwards]">
              Expert insights on commercial real estate, location intelligence, market trends, and business strategies for brands and property owners
            </p>
          </div>

          {/* Search and Filter */}
          <div className="max-w-4xl mx-auto mb-12 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.4s_forwards]">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 pl-12 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#FF5200] focus:ring-2 focus:ring-[#FF5200]/20 transition-all text-gray-900 placeholder-gray-400"
                />
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white shadow-lg shadow-[#FF5200]/30'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-[#FF5200]/50 hover:text-[#FF5200]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="relative z-10 pb-24 md:pb-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No articles found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredPosts.map((post, idx) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.id}`}
                  className="group relative opacity-0 animate-[fadeInUp_0.8s_ease-out_forwards]"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="relative bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-[#FF5200]/20 transition-all duration-500 hover:-translate-y-2 h-full flex flex-col">
                    {/* Top Accent Bar */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35] z-10"></div>

                    {/* Image Placeholder */}
                    <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200]/10 via-[#E4002B]/10 to-transparent"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-xl flex items-center justify-center shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      {/* Category Badge */}
                      <div className="mb-3">
                        <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-[#FF5200]/10 to-[#E4002B]/10 border border-[#FF5200]/20 rounded-full text-xs font-semibold text-[#FF5200]">
                          {post.category}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#FF5200] transition-colors line-clamp-2">
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
                        {post.excerpt}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span>{new Date(post.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* Hover Effect */}
                    <div className="absolute inset-0 border-2 border-[#FF5200] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}

