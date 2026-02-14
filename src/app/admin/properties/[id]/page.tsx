'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import FileUpload from '@/components/admin/FileUpload'
import { useAuth } from '@/contexts/AuthContext'
import LokazenNodesLoader from '@/components/LokazenNodesLoader'

export default function EditPropertyPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const propertyId = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [owners, setOwners] = useState<any[]>([])
  const [images, setImages] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    area: '',
    state: '',
    zipCode: '',
    latitude: '',
    longitude: '',
    mapLink: '',
    price: '',
    priceType: 'monthly',
    securityDeposit: '',
    rentEscalation: '',
    size: '',
    propertyType: 'office',
    storePowerCapacity: '',
    powerBackup: false,
    waterFacility: false,
    amenities: [] as string[],
    addedBy: 'owner' as 'admin' | 'owner',
    ownerId: '',
    availability: true,
    isFeatured: false,
    displayOrder: 0,
  })

  const propertyTypes = [
    { label: 'Office', value: 'office', dbValue: 'office' },
    { label: 'Retail Space', value: 'retail', dbValue: 'retail' },
    { label: 'Restaurant', value: 'restaurant', dbValue: 'restaurant' },
    { label: 'Food Court', value: 'food-court', dbValue: 'restaurant' },
    { label: 'Café / Coffee Shop', value: 'cafe-coffee-shop', dbValue: 'restaurant' },
    { label: 'QSR (Quick Service Restaurant)', value: 'qsr', dbValue: 'restaurant' },
    { label: 'Dessert / Bakery', value: 'dessert-bakery', dbValue: 'restaurant' },
    { label: 'Warehouse', value: 'warehouse', dbValue: 'warehouse' },
    { label: 'Mall Space', value: 'mall-space', dbValue: 'retail' },
    { label: 'Standalone Building', value: 'standalone-building', dbValue: 'other' },
    { label: 'Bungalow', value: 'bungalow', dbValue: 'other' },
    { label: 'Villa', value: 'villa', dbValue: 'other' },
    { label: 'Commercial Complex', value: 'commercial-complex', dbValue: 'other' },
    { label: 'Business Park', value: 'business-park', dbValue: 'office' },
    { label: 'IT Park', value: 'it-park', dbValue: 'office' },
    { label: 'Co-working Space', value: 'co-working-space', dbValue: 'office' },
    { label: 'Service Apartment', value: 'service-apartment', dbValue: 'other' },
    { label: 'Hotel / Hospitality', value: 'hotel-hospitality', dbValue: 'other' },
    { label: 'Land', value: 'land', dbValue: 'other' },
    { label: 'Industrial Space', value: 'industrial-space', dbValue: 'warehouse' },
    { label: 'Showroom', value: 'showroom', dbValue: 'retail' },
    { label: 'Kiosk', value: 'kiosk', dbValue: 'retail' },
    { label: 'Other', value: 'other', dbValue: 'other' }
  ]

  // Helper to get display value from database value
  // Tries to match based on title/description keywords if dbValue is generic
  const getPropertyTypeValue = (dbValue: string, title?: string, description?: string) => {
    const text = `${title || ''} ${description || ''}`.toLowerCase()
    
    // If dbValue is generic 'other', try to match from title/description
    if (dbValue === 'other') {
      if (text.includes('bungalow')) return 'bungalow'
      if (text.includes('villa')) return 'villa'
      if (text.includes('standalone')) return 'standalone-building'
      if (text.includes('commercial complex')) return 'commercial-complex'
      if (text.includes('service apartment')) return 'service-apartment'
      if (text.includes('hotel') || text.includes('hospitality')) return 'hotel-hospitality'
      if (text.includes('land')) return 'land'
    }
    
    // If dbValue is 'restaurant', try to match specific type
    if (dbValue === 'restaurant') {
      // Check for QSR first (most specific) - check multiple variations and common QSR keywords
      if (text.includes('qsr') || 
          text.includes('quick service') || 
          text.includes('quick-service') ||
          text.includes('quick service restaurant') ||
          text.includes('fast food') ||
          text.includes('fast-food') ||
          (text.includes('corner') && (text.includes('restaurant') || text.includes('space')))) {
        return 'qsr'
      }
      if (text.includes('food court') || text.includes('fc')) return 'food-court'
      if (text.includes('cafe') || text.includes('coffee')) return 'cafe-coffee-shop'
      if (text.includes('dessert') || text.includes('bakery')) return 'dessert-bakery'
    }
    
    // If dbValue is 'office', try to match specific type
    if (dbValue === 'office') {
      if (text.includes('business park')) return 'business-park'
      if (text.includes('it park')) return 'it-park'
      if (text.includes('co-working') || text.includes('coworking')) return 'co-working-space'
    }
    
    // If dbValue is 'retail', try to match specific type
    if (dbValue === 'retail') {
      if (text.includes('mall')) return 'mall-space'
      if (text.includes('showroom')) return 'showroom'
      if (text.includes('kiosk')) return 'kiosk'
    }
    
    // If dbValue is 'warehouse', try to match specific type
    if (dbValue === 'warehouse') {
      if (text.includes('industrial')) return 'industrial-space'
    }
    
    // Default: find first match or return the dbValue
    const found = propertyTypes.find(pt => pt.dbValue === dbValue)
    return found ? found.value : dbValue
  }
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
  const availableAmenities = [
    'Ground Floor', 'Corner Unit', 'Main Road', 'Parking', 'Kitchen Setup', 
    'AC', 'Security', 'Storage', 'WiFi', 'Restroom', 'Elevator', 'Other'
  ]

  useEffect(() => {
    if (propertyId && user?.id && user?.email) {
      fetchProperty()
      fetchOwners()
    }
  }, [propertyId, user])

  const fetchProperty = async () => {
    try {
      setLoading(true)
      console.log('[Edit Property] Fetching property:', propertyId)
      const response = await fetch(`/api/properties/${propertyId}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('[Edit Property] API error:', response.status, errorData)
        
        if (response.status === 404) {
          alert(`Property not found: ${propertyId}\n\nPlease check the property ID and try again.`)
        } else if (response.status === 503) {
          alert('Database connection failed. Please check your database configuration.')
        } else {
          alert(`Failed to load property: ${errorData.error || errorData.message || 'Unknown error'}`)
        }
        router.push('/admin/properties')
        return
      }

      const data = await response.json()
      console.log('[Edit Property] Received data:', { 
        hasProperty: !!data.property, 
        hasData: !!data,
        propertyId: data.property?.id || data.id 
      })
      
      const prop = data.property || data
      
      if (!prop || !prop.id) {
        console.error('[Edit Property] Invalid property data:', data)
        alert('Invalid property data received')
        router.push('/admin/properties')
        return
      }

      setFormData({
        title: prop.title || '',
        description: prop.description || '',
        address: prop.address || '',
        city: prop.city || '',
        area: prop.area || '',
        state: prop.state || '',
        zipCode: prop.zipCode || '',
        latitude: prop.latitude?.toString() || '',
        longitude: prop.longitude?.toString() || '',
        mapLink: prop.mapLink || '',
        price: prop.price ? Number(prop.price).toString() : '',
        priceType: prop.priceType || 'monthly',
        securityDeposit: prop.securityDeposit ? Number(prop.securityDeposit).toString() : '',
        rentEscalation: prop.rentEscalation ? Number(prop.rentEscalation).toString() : '',
        size: prop.size ? Number(prop.size).toString() : '',
        propertyType: getPropertyTypeValue(prop.propertyType || 'office', prop.title, prop.description),
        storePowerCapacity: prop.storePowerCapacity || '',
        powerBackup: prop.powerBackup || false,
        waterFacility: prop.waterFacility || false,
        amenities: Array.isArray(prop.amenities) ? prop.amenities : [],
        addedBy: prop.owner?.userType === 'admin' || prop.ownerId === user?.id ? 'admin' : 'owner',
        ownerId: prop.ownerId || prop.owner?.id || '',
        availability: prop.availability !== undefined ? prop.availability : true,
        isFeatured: prop.isFeatured || false,
        displayOrder: prop.displayOrder || 0,
      })
      setImages(Array.isArray(prop.images) ? prop.images : [])
    } catch (error: any) {
      console.error('[Edit Property] Error fetching property:', error)
      alert(`Failed to load property: ${error.message || 'Network error'}`)
      router.push('/admin/properties')
    } finally {
      setLoading(false)
    }
  }

  const fetchOwners = async () => {
    if (!user?.id || !user?.email) return
    try {
      const response = await fetch(`/api/admin/owners?userId=${user.id}&userEmail=${encodeURIComponent(user.email)}`)
      if (response.ok) {
        const data = await response.json()
        setOwners(data.owners || [])
      }
    } catch (error) {
      console.error('Error fetching owners:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !user?.email) {
      alert('You must be logged in to update properties')
      return
    }

    setSaving(true)

    try {
      // Combine address with area if area is selected
      const fullAddress = formData.address
      const addressWithArea = formData.area 
        ? `${fullAddress}${fullAddress ? ', ' : ''}${formData.area}`
        : fullAddress

      // Convert display property type value to database enum value
      const selectedType = propertyTypes.find(pt => pt.value === formData.propertyType)
      const dbPropertyType = selectedType ? selectedType.dbValue : formData.propertyType

      const response = await fetch(`/api/admin/properties?userId=${user.id}&userEmail=${encodeURIComponent(user.email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
          propertyId,
          ...formData,
          propertyType: dbPropertyType,
          address: addressWithArea,
          price: parseFloat(formData.price || '0'),
          securityDeposit: formData.securityDeposit ? parseFloat(formData.securityDeposit) : null,
          rentEscalation: formData.rentEscalation ? parseFloat(formData.rentEscalation) : null,
          size: parseInt(formData.size || '0'),
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          mapLink: formData.mapLink || null,
          displayOrder: parseInt(String(formData.displayOrder)) || null,
          images,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          alert('Property updated successfully!')
          router.push('/admin/properties')
        } else {
          alert(result.error || 'Failed to update property')
        }
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to update property' }))
        alert(error.error || 'Failed to update property')
      }
    } catch (error) {
      console.error('Error updating property:', error)
      alert('Failed to update property. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const toggleAmenity = (amenity: string) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.includes(amenity)
        ? formData.amenities.filter(a => a !== amenity)
        : [...formData.amenities, amenity]
    })
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <LokazenNodesLoader size="lg" className="mb-4" />
            <p className="text-gray-400">Loading property...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Edit Property</h1>
          <p className="text-gray-400">Update property details</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 space-y-8">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                <div className="flex gap-2 items-center">
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!user?.id || !user?.email) {
                        alert('You must be logged in as admin to generate titles')
                        return
                      }
                      const params = new URLSearchParams({
                        userId: user.id,
                        userEmail: encodeURIComponent(user.email),
                      })
                      try {
                        const res = await fetch(`/api/admin/properties/describe?${params.toString()}`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ propertyId, mode: 'title' }),
                        })
                        const data = await res.json()
                        if (res.ok && data.title) {
                          setFormData((prev) => ({ ...prev, title: data.title }))
                        } else {
                          alert(data.error || 'Failed to generate title')
                        }
                      } catch (err) {
                        console.error('Generate title error', err)
                        alert('Failed to generate title')
                      }
                    }}
                    className="px-3 py-1 bg-gray-800 text-xs text-gray-200 rounded hover:bg-gray-700 border border-gray-600 whitespace-nowrap"
                  >
                    {formData.title ? 'Regenerate Title' : 'Generate Title'}
                  </button>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <div className="space-y-2">
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!user?.id || !user?.email) {
                        alert('You must be logged in as admin to generate descriptions')
                        return
                      }
                      const params = new URLSearchParams({
                        userId: user.id,
                        userEmail: encodeURIComponent(user.email),
                      })
                      try {
                        const res = await fetch(`/api/admin/properties/describe?${params.toString()}`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ propertyId, mode: 'description' }),
                        })
                        const data = await res.json()
                        if (res.ok && data.description) {
                          setFormData((prev) => ({ ...prev, description: data.description }))
                        } else {
                          alert(data.error || 'Failed to generate description')
                        }
                      } catch (err) {
                        console.error('Generate description error', err)
                        alert('Failed to generate description')
                      }
                    }}
                    className="px-3 py-1 bg-gray-800 text-xs text-gray-200 rounded hover:bg-gray-700 border border-gray-600"
                  >
                    {formData.description ? 'Regenerate Description' : 'Generate Description'}
                  </button>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Location Address *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Longitude</label>
                <input
                  type="text"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-300 mb-2">Google Maps Link</label>
                <input
                  type="url"
                  value={formData.mapLink}
                  onChange={(e) => setFormData({ ...formData, mapLink: e.target.value })}
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Pricing</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Price *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Security Deposit</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.securityDeposit}
                  onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                />
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
                  {propertyTypes.map((type, index) => (
                    <option key={`${type.value}-${index}`} value={type.value}>{type.label}</option>
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

          {/* Amenities */}
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

          {/* Display Order */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Display Order</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Display Order</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                    placeholder="0"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, displayOrder: Math.max(0, formData.displayOrder - 1) })}
                    className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    title="Decrease order"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, displayOrder: formData.displayOrder + 1 })}
                    className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    title="Increase order"
                  >
                    ↓
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Lower numbers appear first. Use arrows to adjust.</p>
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
              disabled={saving}
              className="px-6 py-2 bg-[#FF5200] text-white rounded-lg hover:bg-[#E4002B] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Update Property Requirements'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}

