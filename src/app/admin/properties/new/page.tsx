'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import FileUpload from '@/components/admin/FileUpload'
import { useAuth } from '@/contexts/AuthContext'

export default function NewPropertyPage() {
  const router = useRouter()
  const { user, isLoggedIn } = useAuth()
  const [loading, setLoading] = useState(false)
  const [owners, setOwners] = useState<any[]>([])
  const [images, setImages] = useState<string[]>([])
  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    description: '',
    address: '',
    city: '',
    area: '',
    state: '',
    zipCode: '',
    latitude: '',
    longitude: '',
    // Pricing
    price: '',
    priceType: 'monthly',
    securityDeposit: '',
    rentEscalation: '',
    // Property Details
    size: '',
    propertyType: 'office',
    storePowerCapacity: '',
    powerBackup: false,
    waterFacility: false,
    amenities: [] as string[],
    // From Owner Onboarding
    location: '',
    rent: '',
    deposit: '',
    // Added by & Status
    addedBy: 'admin' as 'admin' | 'owner',
    ownerId: '',
    availability: true,
    isFeatured: false,
  })

  const propertyTypes = [
    'Office',
    'Retail Space',
    'Restaurant',
    'Food Court',
    'Café / Coffee Shop',
    'QSR (Quick Service Restaurant)',
    'Dessert / Bakery',
    'Warehouse',
    'Mall Space',
    'Standalone Building',
    'Bungalow',
    'Villa',
    'Commercial Complex',
    'Business Park',
    'IT Park',
    'Co-working Space',
    'Service Apartment',
    'Hotel / Hospitality',
    'Land',
    'Industrial Space',
    'Showroom',
    'Kiosk',
    'Other'
  ]
  
  // Major Indian Metro Cities
  const metroCities = [
    'Bangalore',
    'Delhi',
    'Mumbai',
    'Chennai',
    'Hyderabad',
    'Pune',
    'Kolkata',
    'Ahmedabad',
    'Jaipur',
    'Surat',
    'Lucknow',
    'Kanpur',
    'Nagpur',
    'Indore',
    'Thane',
    'Bhopal',
    'Visakhapatnam',
    'Patna',
    'Vadodara',
    'Ghaziabad',
    'Ludhiana',
    'Agra',
    'Nashik',
    'Faridabad',
    'Meerut',
    'Rajkot',
    'Varanasi',
    'Srinagar',
    'Amritsar',
    'Ranchi',
    'Other'
  ]

  // Areas by City
  const cityAreas: Record<string, string[]> = {
    'Bangalore': [
      'Koramangala',
      'Indiranagar',
      'Whitefield',
      'HSR Layout',
      'Jayanagar',
      'BTM Layout',
      'MG Road',
      'Brigade Road',
      'Marathahalli',
      'Hebbal',
      'Banashankari',
      'Sarjapur Road',
      'Electronic City',
      'Bellandur',
      'Bannerghatta Road',
      'Rajajinagar',
      'Malleshwaram',
      'Basavanagudi',
      'Vijayanagar',
      'Yelahanka',
      'Yeshwanthpur',
      'RT Nagar',
      'Frazer Town',
      'Richmond Town',
      'Ulsoor',
      'Kanakapura Road',
      'New Bel Road',
      'Kalyan Nagar',
      'Kamanahalli',
      'Sahakar Nagar',
      'Other'
    ],
    'Delhi': [
      'Connaught Place',
      'Gurgaon',
      'Noida',
      'Dwarka',
      'Rohini',
      'Pitampura',
      'Rajouri Garden',
      'Lajpat Nagar',
      'Karol Bagh',
      'Greater Kailash',
      'Vasant Kunj',
      'Saket',
      'Hauz Khas',
      'Defence Colony',
      'South Extension',
      'Other'
    ],
    'Mumbai': [
      'Bandra',
      'Andheri',
      'Powai',
      'Juhu',
      'Worli',
      'Lower Parel',
      'BKC (Bandra Kurla Complex)',
      'Colaba',
      'Fort',
      'Nariman Point',
      'Malad',
      'Borivali',
      'Thane',
      'Navi Mumbai',
      'Other'
    ],
    'Chennai': [
      'T Nagar',
      'Anna Nagar',
      'Adyar',
      'Besant Nagar',
      'Velachery',
      'OMR (Old Mahabalipuram Road)',
      'Porur',
      'Guindy',
      'Nungambakkam',
      'Mylapore',
      'Egmore',
      'Other'
    ],
    'Hyderabad': [
      'Banjara Hills',
      'Jubilee Hills',
      'Hitech City',
      'Gachibowli',
      'Kondapur',
      'Madhapur',
      'Secunderabad',
      'Himayatnagar',
      'Ameerpet',
      'Kukatpally',
      'Other'
    ],
    'Pune': [
      'Koregaon Park',
      'Viman Nagar',
      'Hinjewadi',
      'Baner',
      'Aundh',
      'Wakad',
      'Kothrud',
      'Hadapsar',
      'Magarpatta',
      'Other'
    ],
    'Kolkata': [
      'Park Street',
      'Salt Lake',
      'New Town',
      'Ballygunge',
      'Alipore',
      'Dum Dum',
      'Howrah',
      'Other'
    ],
    'Ahmedabad': [
      'SG Highway',
      'Prahlad Nagar',
      'Satellite',
      'Vastrapur',
      'Navrangpura',
      'Bodakdev',
      'Other'
    ],
    'Jaipur': [
      'Malviya Nagar',
      'Vaishali Nagar',
      'C Scheme',
      'Pink City',
      'Raja Park',
      'Other'
    ],
    'Other': []
  }

  useEffect(() => {
    if (user?.id && user?.email) fetchOwners()
  }, [user?.id, user?.email])

  const fetchOwners = async () => {
    if (!user?.id || !user?.email) return
    try {
      const response = await fetch(`/api/admin/owners?userId=${user.id}&userEmail=${encodeURIComponent(user.email)}`)
      if (response.ok) {
        const data = await response.json()
        const list = data.owners || []
        if (list.length === 0) {
          // Fallback placeholder so the dropdown is usable when no owners exist
          setOwners([{ id: 'placeholder', name: 'Default Owner (create owners to replace this)' }])
          setFormData(prev => ({ ...prev, ownerId: 'placeholder' }))
        } else {
          setOwners(list)
          // Auto-select first owner
          setFormData(prev => ({ ...prev, ownerId: list[0].id }))
        }
      }
    } catch (error) {
      console.error('Error fetching owners:', error)
      // Fallback to a placeholder option on error
      setOwners([{ id: 'placeholder', name: 'Default Owner (fetch failed)' }])
      setFormData(prev => ({ ...prev, ownerId: 'placeholder' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!isLoggedIn || !user?.id || !user?.email) {
        alert('You must be logged in as admin to create a property')
        return
      }

      const params = new URLSearchParams({
        userId: user.id,
        userEmail: encodeURIComponent(user.email),
      })

      // Combine address with area if area is selected
      const fullAddress = formData.location || formData.address
      const addressWithArea = formData.area 
        ? `${fullAddress}${fullAddress ? ', ' : ''}${formData.area}`
        : fullAddress

      const response = await fetch(`/api/admin/properties?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          address: addressWithArea,
          price: parseFloat(formData.rent || formData.price || '0'),
          securityDeposit: formData.deposit ? parseFloat(formData.deposit) : (formData.securityDeposit ? parseFloat(formData.securityDeposit) : null),
          rentEscalation: formData.rentEscalation ? parseFloat(formData.rentEscalation) : null,
          size: parseInt(formData.size),
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          images,
        }),
      })

      if (response.ok) {
        router.push('/admin/properties')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create property')
      }
    } catch (error) {
      console.error('Error creating property:', error)
      alert('Failed to create property')
    } finally {
      setLoading(false)
    }
  }

  const availableAmenities = [
    'Ground Floor', 'Corner Unit', 'Main Road', 'Parking', 'Kitchen Setup', 
    'AC', 'Security', 'Storage', 'WiFi', 'Restroom', 'Elevator', 'Other'
  ]

  const toggleAmenity = (amenity: string) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.includes(amenity)
        ? formData.amenities.filter(a => a !== amenity)
        : [...formData.amenities, amenity]
    })
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Add New Property</h1>
          <p className="text-gray-400">Create a new property listing</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 space-y-8">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Location Address *</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value, address: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                  placeholder="Enter full address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">City *</label>
                <select
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value, area: '' })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                >
                  <option value="">Select city</option>
                  {metroCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Area</label>
                <select
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  disabled={!formData.city || !cityAreas[formData.city] || cityAreas[formData.city].length === 0}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select area</option>
                  {formData.city && cityAreas[formData.city]?.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Zip Code</label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Latitude</label>
                <input
                  type="text"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                  placeholder="e.g., 12.9716"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Longitude</label>
                <input
                  type="text"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                  placeholder="e.g., 77.5946"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Pricing</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Rent (Monthly) *</label>
                <input
                  type="text"
                  required
                  value={formData.rent}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setFormData({ ...formData, rent: value, price: value })
                  }}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                  placeholder="e.g., 50000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Deposit *</label>
                <input
                  type="text"
                  required
                  value={formData.deposit}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    setFormData({ ...formData, deposit: value, securityDeposit: value })
                  }}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                  placeholder="e.g., 100000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Price Type *</label>
                <select
                  value={formData.priceType}
                  onChange={(e) => setFormData({ ...formData, priceType: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="sqft">Per Sq Ft</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Rent Escalation (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rentEscalation}
                  onChange={(e) => setFormData({ ...formData, rentEscalation: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                />
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Property Details</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Size (sq ft) *</label>
                <input
                  type="number"
                  required
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Property Type *</label>
                <select
                  required
                  value={formData.propertyType}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                >
                  <option value="">Select property type</option>
                  {propertyTypes.map(type => (
                    <option key={type} value={type.toLowerCase().replace(/\s+/g, '-')}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Power Capacity</label>
                <input
                  type="text"
                  value={formData.storePowerCapacity}
                  onChange={(e) => setFormData({ ...formData, storePowerCapacity: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.powerBackup}
                  onChange={(e) => setFormData({ ...formData, powerBackup: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label className="text-sm font-medium text-gray-300">Power Backup</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.waterFacility}
                  onChange={(e) => setFormData({ ...formData, waterFacility: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label className="text-sm font-medium text-gray-300">Water Facility</label>
              </div>
            </div>
          </div>

          {/* Amenities (from Owner Onboarding) */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Features & Amenities</h2>
            <div className="grid grid-cols-3 gap-3">
              {availableAmenities.map((amenity) => (
                <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-gray-300 text-sm">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Images */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Images</h2>
            <FileUpload
              label="Property Images"
              accept="image/*"
              multiple
              value={images}
              onChange={setImages}
            />
          </div>

          {/* Added By & Status */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Added By & Status</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Added By *</label>
                <select
                  required
                  value={formData.addedBy}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      addedBy: e.target.value as 'admin' | 'owner',
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                >
                  <option value="owner">Owner / User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label className="text-sm font-medium text-gray-300">Available</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label className="text-sm font-medium text-gray-300">Featured</label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#FF5200] text-white rounded-lg hover:bg-[#E4002B] transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Property Entry'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}

