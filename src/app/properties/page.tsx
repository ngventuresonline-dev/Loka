'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PropertyCard from '@/components/PropertyCard'
import { Property } from '@/types'

// Sample data - in a real app, this would come from an API/database
const sampleProperties: Property[] = [
  {
    id: '1',
    title: 'Premium Cafe Space in Indiranagar',
    description: 'High-footfall location perfect for specialty coffee chains and QSR brands with modern interiors.',
    address: '100 Feet Road, Indiranagar',
    city: 'Bangalore',
    state: 'Karnataka',
    zipCode: '560038',
    price: 85000,
    priceType: 'monthly',
    securityDeposit: 510000,
    rentEscalation: 5,
    size: 1200,
    propertyType: 'retail',
    amenities: ['WiFi', 'Parking', 'Air Conditioning', 'Kitchen Setup', 'Street Facing'],
    storePowerCapacity: '15 KW',
    powerBackup: true,
    waterFacility: true,
    images: ['/images/cafe1.jpg'],
    ownerId: 'owner1',
    createdAt: new Date(),
    updatedAt: new Date(),
    isAvailable: true,
  },
  {
    id: '2',
    title: 'Prime Retail Space in Koramangala',
    description: 'Corner property in upscale shopping district, ideal for fashion outlets and D2C brands.',
    address: '5th Block, Koramangala',
    city: 'Bangalore',
    state: 'Karnataka',
    zipCode: '560095',
    price: 120000,
    priceType: 'monthly',
    securityDeposit: 720000,
    rentEscalation: 7,
    size: 1800,
    propertyType: 'retail',
    amenities: ['Parking', 'Security', 'Air Conditioning', 'Glass Frontage', 'High Ceiling'],
    storePowerCapacity: '20 KW',
    powerBackup: true,
    waterFacility: true,
    images: ['/images/retail1.jpg'],
    ownerId: 'owner2',
    createdAt: new Date(),
    updatedAt: new Date(),
    isAvailable: true,
  },
  {
    id: '3',
    title: 'Restaurant Space on MG Road',
    description: 'Premium dining space in Bangalore\'s most prestigious location with rooftop access.',
    address: 'MG Road, Shanthala Nagar',
    city: 'Bangalore',
    state: 'Karnataka',
    zipCode: '560001',
    price: 200000,
    priceType: 'monthly',
    securityDeposit: 1200000,
    rentEscalation: 8,
    size: 2500,
    propertyType: 'restaurant',
    amenities: ['Kitchen', 'Parking', 'Air Conditioning', 'Rooftop', 'Bar License', 'Elevator'],
    storePowerCapacity: '50 KW',
    powerBackup: true,
    waterFacility: true,
    images: ['/images/restaurant1.jpg'],
    ownerId: 'owner3',
    createdAt: new Date(),
    updatedAt: new Date(),
    isAvailable: true,
  },
  {
    id: '4',
    title: 'Cloud Kitchen Space in HSR Layout',
    description: 'Fully-equipped kitchen space perfect for delivery-first food brands and cloud kitchens.',
    address: 'Sector 1, HSR Layout',
    city: 'Bangalore',
    state: 'Karnataka',
    zipCode: '560102',
    price: 65000,
    priceType: 'monthly',
    securityDeposit: 390000,
    rentEscalation: 5,
    size: 800,
    propertyType: 'restaurant',
    amenities: ['Commercial Kitchen', 'Gas Pipeline', 'Ventilation', 'Storage', 'Parking'],
    storePowerCapacity: '30 KW',
    powerBackup: true,
    waterFacility: true,
    images: ['/images/kitchen1.jpg'],
    ownerId: 'owner4',
    createdAt: new Date(),
    updatedAt: new Date(),
    isAvailable: true,
  },
  {
    id: '5',
    title: 'Boutique Space in Whitefield',
    description: 'Modern retail space in emerging commercial hub, ideal for specialty stores and boutiques.',
    address: 'ITPL Main Road, Whitefield',
    city: 'Bangalore',
    state: 'Karnataka',
    zipCode: '560066',
    price: 75000,
    priceType: 'monthly',
    securityDeposit: 450000,
    rentEscalation: 6,
    size: 1000,
    propertyType: 'retail',
    amenities: ['Air Conditioning', 'Parking', 'Security', 'WiFi', 'Display Windows'],
    storePowerCapacity: '10 KW',
    powerBackup: true,
    waterFacility: true,
    images: ['/images/boutique1.jpg'],
    ownerId: 'owner5',
    createdAt: new Date(),
    updatedAt: new Date(),
    isAvailable: true,
  },
  {
    id: '6',
    title: 'Fitness Center Space in Jayanagar',
    description: 'Spacious ground floor property perfect for gyms, yoga studios, and fitness centers.',
    address: '4th Block, Jayanagar',
    city: 'Bangalore',
    state: 'Karnataka',
    zipCode: '560011',
    price: 95000,
    priceType: 'monthly',
    securityDeposit: 570000,
    rentEscalation: 5,
    size: 2000,
    propertyType: 'office',
    amenities: ['Ground Floor', 'Parking', 'Restrooms', 'Air Conditioning', 'High Ceiling'],
    storePowerCapacity: '25 KW',
    powerBackup: true,
    waterFacility: true,
    images: ['/images/gym1.jpg'],
    ownerId: 'owner6',
    createdAt: new Date(),
    updatedAt: new Date(),
    isAvailable: true,
  },
];

export default function PropertiesPage() {
  const [particles, setParticles] = useState<Array<{left: string, top: string, animation: string, animationDelay: string}>>([])

  // Generate particles only on client to avoid hydration mismatch
  useEffect(() => {
    setParticles(
      Array.from({ length: 30 }, () => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 2}s`
      }))
    )
  }, [])

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Advanced Animated Background Effects - Same as Homepage */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Subtle Grid */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255, 82, 0, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 82, 0, 0.5) 1px, transparent 1px)',
            backgroundSize: '100px 100px',
            animation: 'grid 40s linear infinite'
          }}></div>
        </div>
        
        {/* Multiple Floating Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-[#FF5200]/10 via-[#E4002B]/5 to-transparent rounded-full blur-[120px] animate-[float_20s_ease-in-out_infinite]"></div>
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#E4002B]/8 via-[#FF6B35]/4 to-transparent rounded-full blur-[100px] animate-[float_25s_ease-in-out_infinite_5s]"></div>
        <div className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] bg-gradient-to-br from-[#FF6B35]/6 via-[#FF5200]/3 to-transparent rounded-full blur-[90px] animate-[float_18s_ease-in-out_infinite_10s]"></div>
        
        {/* Animated Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((particle, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full opacity-40"
              style={{
                left: particle.left,
                top: particle.top,
                animation: particle.animation,
                animationDelay: particle.animationDelay
              }}
            ></div>
          ))}
        </div>

        {/* Scanning Beams */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-0 left-1/6 w-px h-full bg-gradient-to-b from-transparent via-[#FF5200] to-transparent animate-[scan_5s_ease-in-out_infinite]"></div>
          <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-[#E4002B] to-transparent animate-[scan_5s_ease-in-out_infinite_1s]"></div>
          <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-[#FF6B35] to-transparent animate-[scan_5s_ease-in-out_infinite_2s]"></div>
          <div className="absolute top-0 right-1/6 w-px h-full bg-gradient-to-b from-transparent via-[#FF5200] to-transparent animate-[scan_5s_ease-in-out_infinite_3s]"></div>
        </div>
      </div>
      
      <Navbar />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-5 leading-tight tracking-tight">
            <span className="text-gray-900">Discover Premium</span><br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] via-[#E4002B] to-[#FF6B35]">Commercial Spaces</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
            Explore curated properties across Bangalore's most sought-after locations.
          </p>
        </div>
        
        {/* Smart Filters */}
        <div className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-3xl p-4 sm:p-6 md:p-8 mb-12 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Property Type</label>
              <select className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200] transition-all duration-300">
                <option value="">All Types</option>
                <option value="retail">Retail Space</option>
                <option value="restaurant">Restaurant/Cafe</option>
                <option value="office">Office Space</option>
                <option value="warehouse">Warehouse</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Location</label>
              <select className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200] transition-all duration-300">
                <option value="">All Bangalore</option>
                <option value="indiranagar">Indiranagar</option>
                <option value="koramangala">Koramangala</option>
                <option value="mg-road">MG Road</option>
                <option value="hsr-layout">HSR Layout</option>
                <option value="whitefield">Whitefield</option>
                <option value="jayanagar">Jayanagar</option>
                <option value="bellandur">Bellandur</option>
                <option value="btm-layout">BTM Layout</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Budget (Monthly)</label>
              <select className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200] transition-all duration-300">
                <option value="">Any Budget</option>
                <option value="0-50000">Under ₹50K</option>
                <option value="50000-100000">₹50K - ₹1L</option>
                <option value="100000-150000">₹1L - ₹1.5L</option>
                <option value="150000+">Above ₹1.5L</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Size (sq ft)</label>
              <select className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF5200] focus:border-[#FF5200] transition-all duration-300">
                <option value="">Any Size</option>
                <option value="0-1000">0 - 1,000 sq ft</option>
                <option value="1000-2000">1,000 - 2,000 sq ft</option>
                <option value="2000-3000">2,000 - 3,000 sq ft</option>
                <option value="3000+">3,000+ sq ft</option>
              </select>
            </div>
          </div>
          
          <div className="mt-8 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-gray-900 font-medium">{sampleProperties.length} properties available</span>
            </div>
            <button className="group relative bg-gradient-to-r from-[#FF5200] to-[#E4002B] hover:from-[#FF6B35] hover:to-[#FF5200] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105">
              <span className="relative z-10">Apply Filters</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
        
        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
        
        {/* Load More */}
        <div className="mt-12 text-center">
          <button className="bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-900 px-8 py-4 rounded-xl font-semibold transition-all hover:border-[#FF5200] hover:text-[#FF5200]">
            Load More Properties
          </button>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
