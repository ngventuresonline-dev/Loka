'use client'

import { use } from 'react'
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
  tags: string[]
  content: string
}

const blogPosts: Record<string, BlogPost> = {
  '1': {
    id: '1',
    title: 'Top 10 Commercial Real Estate Hotspots in Bangalore for 2025',
    excerpt: 'Discover the most promising commercial locations in Bangalore, from Koramangala to Whitefield. Learn about footfall patterns, rental trends, and why these areas are attracting top brands.',
    category: 'Location Intelligence',
    author: 'Lokazen Team',
    date: '2025-01-15',
    readTime: '8 min read',
    tags: ['Bangalore', 'Commercial Real Estate', 'Location Intelligence'],
    content: `
      <h2>Introduction</h2>
      <p>Bangalore continues to be one of India's most dynamic commercial real estate markets. With its thriving tech ecosystem, growing population, and expanding infrastructure, the city offers numerous opportunities for businesses looking to establish or expand their presence.</p>
      
      <h2>1. Koramangala</h2>
      <p>Koramangala remains Bangalore's crown jewel for commercial real estate. This well-established neighborhood offers excellent connectivity, high footfall, and a diverse mix of retail, F&B, and office spaces. Rental rates range from ₹80-150 per sqft per month, making it premium but highly sought after.</p>
      <p><strong>Key Highlights:</strong></p>
      <ul>
        <li>Peak footfall: 15,000-20,000 daily visitors</li>
        <li>Average rental: ₹100-120/sqft/month</li>
        <li>Best for: Retail, F&B, Salons, Fitness centers</li>
        <li>Connectivity: Excellent metro and bus connectivity</li>
      </ul>

      <h2>2. Indiranagar</h2>
      <p>Indiranagar has transformed into Bangalore's premium F&B and lifestyle destination. The area boasts high-end restaurants, cafes, and boutique stores, attracting affluent customers from across the city.</p>
      <p><strong>Key Highlights:</strong></p>
      <ul>
        <li>Peak footfall: 12,000-18,000 daily visitors</li>
        <li>Average rental: ₹90-140/sqft/month</li>
        <li>Best for: Fine dining, premium retail, wellness centers</li>
        <li>Demographics: High-income professionals, expats</li>
      </ul>

      <h2>3. Whitefield</h2>
      <p>Whitefield has emerged as Bangalore's tech hub, with numerous IT parks and corporate offices. The area is experiencing rapid commercial development, making it attractive for businesses targeting the tech workforce.</p>
      <p><strong>Key Highlights:</strong></p>
      <ul>
        <li>Peak footfall: 10,000-15,000 daily visitors</li>
        <li>Average rental: ₹60-90/sqft/month</li>
        <li>Best for: QSR, retail, services targeting IT professionals</li>
        <li>Growth potential: High, with ongoing infrastructure projects</li>
      </ul>

      <h2>4. HSR Layout</h2>
      <p>HSR Layout offers a perfect balance of affordability and footfall. This residential-commercial mixed area attracts young professionals and families, making it ideal for mid-market brands.</p>
      <p><strong>Key Highlights:</strong></p>
      <ul>
        <li>Peak footfall: 8,000-12,000 daily visitors</li>
        <li>Average rental: ₹50-80/sqft/month</li>
        <li>Best for: Mid-market retail, cafes, services</li>
        <li>Demographics: Young professionals, families</li>
      </ul>

      <h2>5. Jayanagar</h2>
      <p>Jayanagar is one of Bangalore's oldest and most established commercial areas. It offers stable footfall, reasonable rents, and a loyal customer base.</p>
      <p><strong>Key Highlights:</strong></p>
      <ul>
        <li>Peak footfall: 10,000-14,000 daily visitors</li>
        <li>Average rental: ₹55-85/sqft/month</li>
        <li>Best for: Traditional retail, services, healthcare</li>
        <li>Stability: Established market with consistent demand</li>
      </ul>

      <h2>6. MG Road</h2>
      <p>MG Road remains Bangalore's central business district, offering prime commercial spaces with excellent visibility and accessibility.</p>
      <p><strong>Key Highlights:</strong></p>
      <ul>
        <li>Peak footfall: 12,000-16,000 daily visitors</li>
        <li>Average rental: ₹85-130/sqft/month</li>
        <li>Best for: Corporate offices, premium retail, banks</li>
        <li>Connectivity: Excellent metro connectivity</li>
      </ul>

      <h2>7. Marathahalli</h2>
      <p>Marathahalli is gaining traction as an affordable commercial destination with good connectivity and growing infrastructure.</p>
      <p><strong>Key Highlights:</strong></p>
      <ul>
        <li>Peak footfall: 6,000-10,000 daily visitors</li>
        <li>Average rental: ₹40-65/sqft/month</li>
        <li>Best for: Budget retail, services, cloud kitchens</li>
        <li>Growth: Rapid development in progress</li>
      </ul>

      <h2>8. Bellandur</h2>
      <p>Bellandur is emerging as a commercial hub, driven by its proximity to major IT parks and residential complexes.</p>
      <p><strong>Key Highlights:</strong></p>
      <ul>
        <li>Peak footfall: 7,000-11,000 daily visitors</li>
        <li>Average rental: ₹45-70/sqft/month</li>
        <li>Best for: QSR, retail, services</li>
        <li>Future potential: High, with ongoing development</li>
      </ul>

      <h2>9. Electronic City</h2>
      <p>Electronic City offers commercial spaces targeting the large IT workforce in the area, with affordable rents and growing infrastructure.</p>
      <p><strong>Key Highlights:</strong></p>
      <ul>
        <li>Peak footfall: 8,000-12,000 daily visitors</li>
        <li>Average rental: ₹35-60/sqft/month</li>
        <li>Best for: QSR, budget retail, services</li>
        <li>Target audience: IT professionals</li>
      </ul>

      <h2>10. JP Nagar</h2>
      <p>JP Nagar combines residential charm with commercial opportunities, offering a balanced market for various business types.</p>
      <p><strong>Key Highlights:</strong></p>
      <ul>
        <li>Peak footfall: 7,000-10,000 daily visitors</li>
        <li>Average rental: ₹50-75/sqft/month</li>
        <li>Best for: Retail, cafes, services, healthcare</li>
        <li>Demographics: Mixed residential and commercial</li>
      </ul>

      <h2>Conclusion</h2>
      <p>Bangalore's commercial real estate market offers diverse opportunities across different price points and target audiences. Whether you're looking for premium visibility in Koramangala or affordable options in emerging areas like Marathahalli, understanding footfall patterns, rental trends, and demographics is crucial for making informed decisions.</p>
      <p>At Lokazen, we help brands find the perfect commercial space using AI-powered matching and location intelligence. Our platform analyzes footfall data, rental trends, and demographic insights to match your business requirements with the ideal location.</p>
    `
  },
  '2': {
    id: '2',
    title: 'Why Indiranagar Remains Bangalore\'s Premier F&B Destination',
    excerpt: 'An in-depth analysis of Indiranagar\'s commercial real estate landscape, foot traffic data, and why restaurants and cafes continue to thrive in this vibrant neighborhood.',
    category: 'Market Analysis',
    author: 'Lokazen Team',
    date: '2025-01-12',
    readTime: '6 min read',
    tags: ['Bangalore', 'Indiranagar', 'F&B', 'Market Trends'],
    content: `
      <h2>Introduction</h2>
      <p>Indiranagar has established itself as Bangalore's premier destination for food and beverage businesses. Despite rising rents and increasing competition, restaurants and cafes continue to flock to this vibrant neighborhood. Let's explore why.</p>
      
      <h2>The Indiranagar Advantage</h2>
      <p>Indiranagar's transformation from a quiet residential area to a bustling commercial hub is remarkable. Today, it hosts over 200 restaurants, cafes, and bars, making it one of the most concentrated F&B markets in Bangalore.</p>

      <h2>Foot Traffic Analysis</h2>
      <p>Our location intelligence data reveals impressive footfall patterns:</p>
      <ul>
        <li><strong>Weekday footfall:</strong> 8,000-12,000 visitors</li>
        <li><strong>Weekend footfall:</strong> 15,000-20,000 visitors</li>
        <li><strong>Peak hours:</strong> 7 PM - 11 PM (dinner rush)</li>
        <li><strong>Lunch crowd:</strong> Strong corporate clientele</li>
      </ul>

      <h2>Demographics That Drive Success</h2>
      <p>Indiranagar attracts a unique demographic mix:</p>
      <ul>
        <li><strong>High-income professionals:</strong> 65% of visitors</li>
        <li><strong>Expats and NRIs:</strong> 15% of customer base</li>
        <li><strong>Young professionals:</strong> 20% (25-35 age group)</li>
        <li><strong>Average spending capacity:</strong> ₹800-1,500 per person</li>
      </ul>

      <h2>Rental Landscape</h2>
      <p>While Indiranagar commands premium rents, the returns justify the investment:</p>
      <ul>
        <li><strong>Ground floor retail:</strong> ₹100-140/sqft/month</li>
        <li><strong>First floor spaces:</strong> ₹60-90/sqft/month</li>
        <li><strong>Basement spaces:</strong> ₹40-60/sqft/month</li>
        <li><strong>Average lease term:</strong> 3-5 years</li>
      </ul>

      <h2>Why F&B Brands Choose Indiranagar</h2>
      <h3>1. Brand Visibility</h3>
      <p>Indiranagar offers exceptional brand visibility. Being present here signals quality and sophistication to customers.</p>

      <h3>2. Customer Base</h3>
      <p>The area attracts customers willing to pay premium prices for quality food and experiences.</p>

      <h3>3. Networking Hub</h3>
      <p>Indiranagar serves as a networking hub for professionals, making it ideal for business-focused F&B concepts.</p>

      <h3>4. Nightlife Culture</h3>
      <p>The area has developed a strong nightlife culture, supporting bars, pubs, and late-night dining concepts.</p>

      <h2>Challenges and Opportunities</h2>
      <h3>Challenges:</h3>
      <ul>
        <li>High rental costs</li>
        <li>Intense competition</li>
        <li>Parking constraints</li>
        <li>Regulatory compliance</li>
      </ul>

      <h3>Opportunities:</h3>
      <ul>
        <li>Premium positioning</li>
        <li>High customer spending</li>
        <li>Brand building potential</li>
        <li>Expansion to nearby areas</li>
      </ul>

      <h2>Success Stories</h2>
      <p>Several F&B brands have achieved remarkable success in Indiranagar:</p>
      <ul>
        <li><strong>Fine dining restaurants:</strong> Average revenue ₹50-80 lakhs/month</li>
        <li><strong>Cafes:</strong> Average revenue ₹20-35 lakhs/month</li>
        <li><strong>Bars and pubs:</strong> Average revenue ₹40-60 lakhs/month</li>
      </ul>

      <h2>Future Outlook</h2>
      <p>Indiranagar's F&B market shows no signs of slowing down. With ongoing infrastructure improvements and continued demand from high-spending customers, the area remains attractive for premium F&B concepts.</p>

      <h2>Conclusion</h2>
      <p>Indiranagar's success as an F&B destination stems from its unique combination of demographics, footfall, and brand positioning opportunities. While the costs are high, the returns and brand value make it a worthwhile investment for quality F&B brands.</p>
      <p>If you're considering Indiranagar for your F&B venture, Lokazen can help you find the perfect space that matches your concept, budget, and growth plans. Our location intelligence platform provides detailed insights into footfall patterns, rental trends, and competitive landscape.</p>
    `
  },
  '3': {
    id: '3',
    title: 'Commercial Real Estate Trends in Delhi: A 2025 Guide',
    excerpt: 'Explore Delhi\'s commercial property market, from Connaught Place to Cyber City. Understand rental rates, vacancy trends, and emerging business districts.',
    category: 'Market Analysis',
    author: 'Lokazen Team',
    date: '2025-01-10',
    readTime: '10 min read',
    tags: ['Delhi', 'Commercial Real Estate', 'Market Trends'],
    content: `
      <h2>Introduction</h2>
      <p>Delhi's commercial real estate market is one of India's most diverse and dynamic. From historic Connaught Place to modern Cyber City, the capital offers opportunities across various price points and business types.</p>
      
      <h2>Market Overview</h2>
      <p>Delhi's commercial real estate market has shown resilience and growth despite economic challenges. The city's strategic location, excellent connectivity, and diverse customer base make it attractive for businesses across sectors.</p>

      <h2>Key Commercial Districts</h2>
      
      <h3>1. Connaught Place</h3>
      <p>Connaught Place remains Delhi's iconic commercial hub, offering premium retail and office spaces in the heart of the city.</p>
      <ul>
        <li>Average rental: ₹200-350/sqft/month</li>
        <li>Footfall: 20,000-30,000 daily visitors</li>
        <li>Best for: Premium retail, corporate offices, banks</li>
        <li>Vacancy rate: 8-12%</li>
      </ul>

      <h3>2. Cyber City (Gurgaon)</h3>
      <p>Gurgaon's Cyber City has become Delhi NCR's premier business district, hosting major corporates and tech companies.</p>
      <ul>
        <li>Average rental: ₹80-120/sqft/month</li>
        <li>Office space: 15-20 million sqft</li>
        <li>Best for: Corporate offices, tech companies</li>
        <li>Vacancy rate: 10-15%</li>
      </ul>

      <h3>3. Khan Market</h3>
      <p>Khan Market offers premium retail spaces with high footfall and affluent customer base.</p>
      <ul>
        <li>Average rental: ₹300-500/sqft/month</li>
        <li>Footfall: 8,000-12,000 daily visitors</li>
        <li>Best for: Luxury retail, premium F&B</li>
        <li>Vacancy rate: 3-5%</li>
      </ul>

      <h3>4. Saket</h3>
      <p>Saket has emerged as a major retail and commercial destination in South Delhi.</p>
      <ul>
        <li>Average rental: ₹100-180/sqft/month</li>
        <li>Footfall: 15,000-25,000 daily visitors</li>
        <li>Best for: Retail, F&B, entertainment</li>
        <li>Vacancy rate: 5-8%</li>
      </ul>

      <h3>5. Noida</h3>
      <p>Noida offers affordable commercial spaces with good connectivity and growing infrastructure.</p>
      <ul>
        <li>Average rental: ₹40-80/sqft/month</li>
        <li>Footfall: 10,000-15,000 daily visitors</li>
        <li>Best for: Retail, services, offices</li>
        <li>Vacancy rate: 12-18%</li>
      </ul>

      <h2>Rental Trends</h2>
      <p>Delhi's commercial rental market shows varied trends across different areas:</p>
      <ul>
        <li><strong>Premium areas (CP, Khan Market):</strong> Stable with slight appreciation</li>
        <li><strong>Mid-market areas (Saket, Vasant Kunj):</strong> Moderate growth</li>
        <li><strong>Emerging areas (Noida, Dwarka):</strong> Competitive pricing</li>
      </ul>

      <h2>Vacancy Trends</h2>
      <p>Vacancy rates vary significantly across Delhi:</p>
      <ul>
        <li><strong>Prime locations:</strong> 3-8% vacancy</li>
        <li><strong>Mid-market areas:</strong> 8-12% vacancy</li>
        <li><strong>Emerging areas:</strong> 12-20% vacancy</li>
      </ul>

      <h2>Emerging Trends</h2>
      <h3>1. Co-working Spaces</h3>
      <p>Co-working spaces are gaining popularity, especially in areas like Cyber City and Noida.</p>

      <h3>2. Mixed-Use Developments</h3>
      <p>Mixed-use developments combining retail, office, and residential are becoming common.</p>

      <h3>3. Transit-Oriented Development</h3>
      <p>Properties near metro stations command premium rents and higher footfall.</p>

      <h2>Investment Opportunities</h2>
      <p>Delhi offers several investment opportunities:</p>
      <ul>
        <li><strong>Prime retail:</strong> High returns, stable demand</li>
        <li><strong>Office spaces:</strong> Growing demand from corporates</li>
        <li><strong>Emerging areas:</strong> Appreciation potential</li>
      </ul>

      <h2>Challenges</h2>
      <ul>
        <li>High rental costs in prime areas</li>
        <li>Regulatory compliance</li>
        <li>Traffic congestion</li>
        <li>Competition from online retail</li>
      </ul>

      <h2>Future Outlook</h2>
      <p>Delhi's commercial real estate market is expected to grow steadily, driven by infrastructure development, metro expansion, and economic growth. Areas like Noida and Dwarka offer significant growth potential.</p>

      <h2>Conclusion</h2>
      <p>Delhi's commercial real estate market offers diverse opportunities for businesses and investors. Understanding local dynamics, rental trends, and emerging areas is crucial for making informed decisions.</p>
      <p>Lokazen helps businesses navigate Delhi's complex commercial real estate market with AI-powered matching and location intelligence. Our platform provides insights into rental trends, footfall patterns, and market dynamics across Delhi NCR.</p>
    `
  }
}

// Generate content for remaining posts
const generateContent = (id: string, title: string, category: string): string => {
  const baseContent = `
    <h2>Introduction</h2>
    <p>${title} explores key insights and trends in commercial real estate. This comprehensive guide provides valuable information for businesses and property owners.</p>
    
    <h2>Key Insights</h2>
    <p>Commercial real estate markets are constantly evolving, driven by economic factors, demographic changes, and infrastructure development. Understanding these trends is crucial for making informed decisions.</p>

    <h2>Market Analysis</h2>
    <p>Our analysis reveals important patterns and opportunities in the commercial real estate sector. Location intelligence, footfall data, and rental trends play crucial roles in decision-making.</p>

    <h2>Best Practices</h2>
    <p>Successful commercial real estate decisions require careful consideration of multiple factors:</p>
    <ul>
      <li>Location analysis and footfall patterns</li>
      <li>Rental rates and market trends</li>
      <li>Demographics and target audience</li>
      <li>Infrastructure and connectivity</li>
      <li>Competitive landscape</li>
    </ul>

    <h2>Future Trends</h2>
    <p>The commercial real estate sector is witnessing several emerging trends:</p>
    <ul>
      <li>Technology-driven property search and matching</li>
      <li>Focus on sustainability and green buildings</li>
      <li>Mixed-use developments</li>
      <li>Transit-oriented development</li>
      <li>Flexible workspace solutions</li>
    </ul>

    <h2>Conclusion</h2>
    <p>${title} highlights the importance of data-driven decision-making in commercial real estate. With the right insights and tools, businesses can find the perfect location that drives growth and success.</p>
    <p>Lokazen's AI-powered platform helps businesses navigate commercial real estate markets with confidence, providing location intelligence, market insights, and intelligent matching.</p>
  `
  return baseContent
}

export default function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const post = blogPosts[id] || {
    id,
    title: 'Commercial Real Estate Insights',
    excerpt: 'Explore insights and trends in commercial real estate.',
    category: 'Industry Insights',
    author: 'Lokazen Team',
    date: '2025-01-01',
    readTime: '5 min read',
    tags: ['Commercial Real Estate'],
    content: generateContent(id, 'Commercial Real Estate Insights', 'Industry Insights')
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      {/* Global Background Effects */}
      <div className="fixed inset-0 z-0 bg-white overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}></div>
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-full blur-[120px] opacity-10"></div>
      </div>

      {/* Article Header */}
      <article className="relative z-10 pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-6 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link 
            href="/blog"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#FF5200] transition-colors mb-8"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Link>

          {/* Category Badge */}
          <div className="mb-6">
            <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#FF5200]/10 to-[#E4002B]/10 border border-[#FF5200]/20 rounded-full text-sm font-semibold text-[#FF5200]">
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-6 mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{new Date(post.date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{post.readTime}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-12">
            {post.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg">
                {tag}
              </span>
            ))}
          </div>

          {/* Featured Image Placeholder */}
          <div className="relative w-full h-64 md:h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200]/10 via-[#E4002B]/10 to-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <div 
            className="max-w-none"
            style={{
              color: '#374151'
            }}
          >
            <div 
              className="space-y-6 text-lg leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: post.content
                  .replace(/<h2>/g, '<h2 class="text-3xl font-bold text-gray-900 mt-12 mb-6 pt-4 border-t border-gray-200">')
                  .replace(/<h3>/g, '<h3 class="text-2xl font-bold text-gray-900 mt-8 mb-4">')
                  .replace(/<p>/g, '<p class="text-gray-700 leading-relaxed mb-4">')
                  .replace(/<ul>/g, '<ul class="list-disc list-inside space-y-2 mb-6 text-gray-700 ml-4">')
                  .replace(/<li>/g, '<li class="leading-relaxed">')
                  .replace(/<strong>/g, '<strong class="font-bold text-gray-900">')
              }}
            />
          </div>

          {/* CTA Section */}
          <div className="mt-16 p-8 bg-gradient-to-br from-[#FF5200]/10 via-[#E4002B]/10 to-transparent rounded-2xl border-2 border-[#FF5200]/20">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Find Your Perfect Commercial Space</h3>
            <p className="text-gray-700 mb-6">
              Ready to find the ideal location for your business? Lokazen uses AI-powered matching and location intelligence to help brands find commercial spaces that drive success.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/filter/brand"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#FF5200]/30 transition-all"
              >
                Find Your Space
              </Link>
              <Link
                href="/location-intelligence"
                className="inline-flex items-center justify-center px-6 py-3 bg-white border-2 border-[#FF5200] text-[#FF5200] rounded-xl font-semibold hover:bg-[#FF5200]/5 transition-all"
              >
                Location Intelligence
              </Link>
            </div>
          </div>
        </div>
      </article>

      <Footer />
    </main>
  )
}

