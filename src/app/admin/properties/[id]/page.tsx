'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import FileUpload from '@/components/admin/FileUpload'
import AreaSelectCombobox from '@/components/admin/AreaSelectCombobox'
import { useAuth } from '@/contexts/AuthContext'
import LokazenNodesLoader from '@/components/LokazenNodesLoader'
import { getNearestPincodeFromCoords } from '@/lib/location-intelligence/bangalore-areas'
import { extractLatLngFromMapLink } from '@/lib/property-coordinates'

export default function EditPropertyPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const propertyId = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
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
    status: 'pending' as 'pending' | 'approved' | 'rejected',
    availability: true,
    isFeatured: false,
    displayOrder: 0,
    roadTypeConfirmed: '',
    isCornerUnit: false,
    frontageWidthFt: '',
    nearbyOfficesCount: '',
    nearbyCoworkingCount: '',
    nearbyResidentialUnits: '',
    nearbyCollegesCount: '',
    nearbyGymsClinics: '',
    floorLevel: 'ground',
    hasSignalNearby: false,
    dailyFootfallEstimate: '',
    peakHours: '',
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

      // Extract amenities array and map_link from the stored amenities JSON
      let amenitiesArr: string[] = []
      let mapLinkVal = ''
      if (prop.amenities) {
        if (Array.isArray(prop.amenities)) {
          amenitiesArr = prop.amenities
        } else if (typeof prop.amenities === 'object' && prop.amenities !== null) {
          const am = prop.amenities as Record<string, unknown>
          amenitiesArr = Array.isArray(am.features) ? (am.features as string[]) : []
          mapLinkVal = typeof am.map_link === 'string' ? am.map_link : ''
        }
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
        mapLink: prop.mapLink || mapLinkVal,
        price: prop.price ? Number(prop.price).toString() : '',
        priceType: prop.priceType || 'monthly',
        securityDeposit: prop.securityDeposit ? Number(prop.securityDeposit).toString() : '',
        rentEscalation: prop.rentEscalation ? Number(prop.rentEscalation).toString() : '',
        size: prop.size ? Number(prop.size).toString() : '',
        propertyType: getPropertyTypeValue(prop.propertyType || 'office', prop.title, prop.description),
        storePowerCapacity: prop.storePowerCapacity || '',
        powerBackup: prop.powerBackup || false,
        waterFacility: prop.waterFacility || false,
        amenities: amenitiesArr,
        addedBy: prop.owner?.userType === 'admin' || prop.ownerId === user?.id ? 'admin' : 'owner',
        ownerId: prop.ownerId || prop.owner?.id || '',
        status: (prop.status as 'pending' | 'approved' | 'rejected') || 'pending',
        availability: prop.availability !== undefined ? prop.availability : true,
        isFeatured: prop.isFeatured || false,
        displayOrder: prop.displayOrder || 0,
        roadTypeConfirmed: prop.roadTypeConfirmed || '',
        isCornerUnit: prop.isCornerUnit ?? false,
        frontageWidthFt: prop.frontageWidthFt != null ? String(prop.frontageWidthFt) : '',
        nearbyOfficesCount: prop.nearbyOfficesCount != null ? String(prop.nearbyOfficesCount) : '',
        nearbyCoworkingCount: prop.nearbyCoworkingCount != null ? String(prop.nearbyCoworkingCount) : '',
        nearbyResidentialUnits: prop.nearbyResidentialUnits != null ? String(prop.nearbyResidentialUnits) : '',
        nearbyCollegesCount: prop.nearbyCollegesCount != null ? String(prop.nearbyCollegesCount) : '',
        nearbyGymsClinics: prop.nearbyGymsClinics != null ? String(prop.nearbyGymsClinics) : '',
        floorLevel: prop.floorLevel || 'ground',
        hasSignalNearby: prop.hasSignalNearby ?? false,
        dailyFootfallEstimate: prop.dailyFootfallEstimate != null ? String(prop.dailyFootfallEstimate) : '',
        peakHours: prop.peakHours || '',
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

  // Derive zipCode from map link or lat/lng when in Bangalore
  useEffect(() => {
    if (formData.city !== 'Bangalore') return
    let lat: number | null = null
    let lng: number | null = null
    if (formData.mapLink) {
      const coords = extractLatLngFromMapLink(formData.mapLink)
      if (coords) {
        lat = coords.lat
        lng = coords.lng
      }
    }
    if (lat == null && formData.latitude && formData.longitude) {
      const la = parseFloat(formData.latitude)
      const lo = parseFloat(formData.longitude)
      if (!Number.isNaN(la) && !Number.isNaN(lo)) {
        lat = la
        lng = lo
      }
    }
    if (lat != null && lng != null) {
      const pincode = getNearestPincodeFromCoords(lat, lng)
      setFormData((prev) => ({ ...prev, zipCode: pincode }))
    }
  }, [formData.city, formData.mapLink, formData.latitude, formData.longitude])

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
      setSaveError('You must be logged in to update properties')
      return
    }

    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      // Combine address with area if area is selected
      const fullAddress = formData.address
      const addressWithArea = formData.area
        ? `${fullAddress}${fullAddress ? ', ' : ''}${formData.area}`
        : fullAddress

      // Convert display property type value to database enum value
      const selectedType = propertyTypes.find(pt => pt.value === formData.propertyType)
      const dbPropertyType = selectedType ? selectedType.dbValue : formData.propertyType

      const response = await fetch(
        `/api/admin/properties?userId=${user.id}&userEmail=${encodeURIComponent(user.email)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertyId,
            title: formData.title,
            description: formData.description,
            address: addressWithArea,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            latitude: formData.latitude ? parseFloat(formData.latitude) : null,
            longitude: formData.longitude ? parseFloat(formData.longitude) : null,
            mapLink: formData.mapLink || null,
            price: parseFloat(formData.price || '0'),
            priceType: formData.priceType,
            securityDeposit: formData.securityDeposit ? parseFloat(formData.securityDeposit) : null,
            rentEscalation: formData.rentEscalation ? parseFloat(formData.rentEscalation) : null,
            size: parseInt(formData.size || '0'),
            propertyType: dbPropertyType,
            storePowerCapacity: formData.storePowerCapacity,
            powerBackup: formData.powerBackup,
            waterFacility: formData.waterFacility,
            amenities: formData.amenities,
            status: formData.status,
            availability: formData.availability,
            isFeatured: formData.isFeatured,
            displayOrder: parseInt(String(formData.displayOrder)) || null,
            ownerId: formData.ownerId,
            images,
            roadTypeConfirmed: formData.roadTypeConfirmed || null,
            isCornerUnit: formData.isCornerUnit,
            frontageWidthFt:
              formData.frontageWidthFt === ''
                ? null
                : Number.isFinite(parseInt(formData.frontageWidthFt, 10))
                  ? parseInt(formData.frontageWidthFt, 10)
                  : null,
            nearbyOfficesCount:
              formData.nearbyOfficesCount === ''
                ? null
                : Number.isFinite(parseInt(formData.nearbyOfficesCount, 10))
                  ? parseInt(formData.nearbyOfficesCount, 10)
                  : null,
            nearbyCoworkingCount:
              formData.nearbyCoworkingCount === ''
                ? null
                : Number.isFinite(parseInt(formData.nearbyCoworkingCount, 10))
                  ? parseInt(formData.nearbyCoworkingCount, 10)
                  : null,
            nearbyResidentialUnits:
              formData.nearbyResidentialUnits === ''
                ? null
                : Number.isFinite(parseInt(formData.nearbyResidentialUnits, 10))
                  ? parseInt(formData.nearbyResidentialUnits, 10)
                  : null,
            nearbyCollegesCount:
              formData.nearbyCollegesCount === ''
                ? null
                : Number.isFinite(parseInt(formData.nearbyCollegesCount, 10))
                  ? parseInt(formData.nearbyCollegesCount, 10)
                  : null,
            nearbyGymsClinics:
              formData.nearbyGymsClinics === ''
                ? null
                : Number.isFinite(parseInt(formData.nearbyGymsClinics, 10))
                  ? parseInt(formData.nearbyGymsClinics, 10)
                  : null,
            floorLevel: formData.floorLevel,
            hasSignalNearby: formData.hasSignalNearby,
            dailyFootfallEstimate:
              formData.dailyFootfallEstimate === ''
                ? null
                : Number.isFinite(parseInt(formData.dailyFootfallEstimate, 10))
                  ? parseInt(formData.dailyFootfallEstimate, 10)
                  : null,
            peakHours: formData.peakHours || null,
          }),
        }
      )

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setSaveSuccess(true)
          window.scrollTo({ top: 0, behavior: 'smooth' })
          setTimeout(() => {
            router.push('/admin/properties')
          }, 1500)
        } else {
          setSaveError(result.error || 'Failed to update property')
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update property' }))
        setSaveError(errorData.error || `Server error (${response.status})`)
      }
    } catch (error: any) {
      console.error('Error updating property:', error)
      setSaveError(error?.message || 'Network error — please try again')
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

        {saveSuccess && (
          <div className="flex items-center gap-3 px-4 py-3 bg-green-900/60 border border-green-600 rounded-lg text-green-300">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Property updated successfully! Redirecting…</span>
          </div>
        )}

        {saveError && (
          <div className="flex items-start gap-3 px-4 py-3 bg-red-900/60 border border-red-600 rounded-lg text-red-300">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{saveError}</span>
          </div>
        )}

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
                {formData.city === 'Bangalore' ? (
                  <AreaSelectCombobox
                    value={formData.area}
                    onChange={(area, pincode) => setFormData({ ...formData, area, zipCode: pincode })}
                    disabled={!formData.city}
                    placeholder="Type or select area"
                  />
                ) : (
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
                )}
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

          <details className="border border-gray-700 rounded-lg p-4 group">
            <summary className="text-lg font-semibold text-white cursor-pointer list-none flex items-center gap-2 [&::-webkit-details-marker]:hidden">
              <span className="text-gray-400 group-open:rotate-90 transition-transform inline-block">▸</span>
              📍 Location Profile (Site Visit)
            </summary>
            <p className="text-xs text-amber-200/80 mt-2 mb-4">
              This data improves revenue model accuracy. Fill after site visit.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Road Type</label>
                <select
                  value={formData.roadTypeConfirmed}
                  onChange={(e) => setFormData({ ...formData, roadTypeConfirmed: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                >
                  <option value="">Not specified (infer from listing)</option>
                  <option value="main_road">Main Road</option>
                  <option value="cross_road">Cross Road (off main)</option>
                  <option value="lane">Internal Lane</option>
                  <option value="highway">Highway-facing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Floor Level</label>
                <select
                  value={formData.floorLevel}
                  onChange={(e) => setFormData({ ...formData, floorLevel: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                >
                  <option value="ground">Ground</option>
                  <option value="basement">Basement</option>
                  <option value="first_floor">1st Floor</option>
                  <option value="upper">2nd Floor+</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isCornerUnit}
                    onChange={(e) => setFormData({ ...formData, isCornerUnit: e.target.checked })}
                    className="rounded border-gray-600"
                  />
                  Corner unit
                </label>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasSignalNearby}
                    onChange={(e) => setFormData({ ...formData, hasSignalNearby: e.target.checked })}
                    className="rounded border-gray-600"
                  />
                  Traffic signal within ~100m (good for QSR impulse)
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Frontage width (feet)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.frontageWidthFt}
                  onChange={(e) => setFormData({ ...formData, frontageWidthFt: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                  placeholder="e.g. 25"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Offices / buildings within 500m (approx)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.nearbyOfficesCount}
                  onChange={(e) => setFormData({ ...formData, nearbyOfficesCount: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Co-working spaces within 500m</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.nearbyCoworkingCount}
                  onChange={(e) => setFormData({ ...formData, nearbyCoworkingCount: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Apartment units within 1km (approx)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.nearbyResidentialUnits}
                  onChange={(e) => setFormData({ ...formData, nearbyResidentialUnits: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Colleges / schools within 500m</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.nearbyCollegesCount}
                  onChange={(e) => setFormData({ ...formData, nearbyCollegesCount: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Gyms / clinics within ~300m (approx)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.nearbyGymsClinics}
                  onChange={(e) => setFormData({ ...formData, nearbyGymsClinics: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Your daily footfall estimate (site visit)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.dailyFootfallEstimate}
                  onChange={(e) => setFormData({ ...formData, dailyFootfallEstimate: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                  placeholder="e.g. 1200"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Peak hours</label>
                <input
                  type="text"
                  value={formData.peakHours}
                  onChange={(e) => setFormData({ ...formData, peakHours: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                  placeholder="e.g. 12–2pm, 7–10pm"
                />
              </div>
            </div>
          </details>

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
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Approval Status *</label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as 'pending' | 'approved' | 'rejected'
                    setFormData({
                      ...formData,
                      status: newStatus,
                      // Keep availability in sync with status change
                      availability: newStatus === 'approved' ? true : newStatus === 'rejected' ? false : formData.availability,
                    })
                  }}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="flex flex-col gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="availability"
                    checked={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor="availability" className="text-sm font-medium text-gray-300">Available</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor="isFeatured" className="text-sm font-medium text-gray-300">Featured</label>
                </div>
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

