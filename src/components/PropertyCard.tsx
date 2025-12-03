import { Property } from '@/types'
import Image from 'next/image'
import Link from 'next/link'

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const formatPrice = (price: number, type: Property['priceType']) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
    
    switch (type) {
      case 'monthly':
        return `${formatted}/month`;
      case 'yearly':
        return `${formatted}/year`;
      case 'sqft':
        return `${formatted}/sq ft`;
      default:
        return formatted;
    }
  };

  return (
    <div className="group relative bg-white border-2 border-gray-200 rounded-3xl overflow-hidden hover:border-[#FF5200] transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:shadow-[#FF5200]/20">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200]/5 to-[#E4002B]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative h-56 w-full overflow-hidden">
        {property.images.length > 0 ? (
          <Image
            src={property.images[0]}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF5200] to-[#E4002B] rounded-xl mx-auto mb-3 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-gray-600 text-sm">Premium Space</span>
            </div>
          </div>
        )}
        <div className="absolute top-4 right-4">
          <span className="bg-white/90 backdrop-blur-sm border border-gray-300 px-3 py-1 rounded-full text-xs font-semibold text-gray-900 capitalize">
            {property.propertyType}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
      </div>
      
      <div className="relative z-10 p-8">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-900 truncate group-hover:text-[#FF5200] transition-colors duration-300">{property.title}</h3>
          <div className="text-right ml-4">
            <span className="text-2xl font-black bg-gradient-to-r from-[#FF5200] to-[#E4002B] bg-clip-text text-transparent">
              {formatPrice(property.price, property.priceType)}
            </span>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed group-hover:text-gray-900 transition-colors duration-300">{property.description}</p>
        
        <div className="flex items-center text-sm text-gray-600 mb-4 group-hover:text-[#FF5200] transition-colors duration-300">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="font-medium">{property.city}, {property.state}</span>
        </div>
        
        <div className="flex justify-between items-center text-sm mb-6">
          <span className="text-gray-900 font-medium">{property.size.toLocaleString()} sq ft</span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            property.isAvailable 
              ? 'bg-green-100 border border-green-400 text-green-700' 
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            <div className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${property.isAvailable ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            {property.isAvailable ? 'Available Now' : 'Reserved'}
          </span>
        </div>
        
        {property.amenities.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {property.amenities.slice(0, 3).map((amenity, index) => (
                <span key={index} className="bg-gray-100 border border-gray-300 text-gray-700 px-3 py-1 rounded-full text-xs font-medium group-hover:bg-[#FF5200]/10 group-hover:border-[#FF5200] group-hover:text-[#FF5200] transition-all duration-300">
                  {amenity}
                </span>
              ))}
              {property.amenities.length > 3 && (
                <span className="text-gray-600 text-xs px-3 py-1 font-medium">
                  +{property.amenities.length - 3} more features
                </span>
              )}
            </div>
          </div>
        )}
        
        <Link 
          href={`/properties/${property.id}`}
          className="group relative block w-full bg-gradient-to-r from-[#FF5200] to-[#E4002B] hover:from-[#FF6B35] hover:to-[#FF5200] text-white text-center py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105"
        >
          <span className="relative z-10">Explore Space</span>
          <div className="absolute inset-0 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
        </Link>
      </div>
    </div>
  )
}
