'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import FileUpload from '@/components/admin/FileUpload'
import { useAuth } from '@/contexts/AuthContext'

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
    state: '',
    zipCode: '',
    latitude: '',
    longitude: '',
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
    ownerId: '',
    availability: true,
    isFeatured: false,
    displayOrder: 0,
  })

  const propertyTypes = [
    { label: 'Office', value: 'office' },
    { label: 'Retail Space', value: 'retail' },
    { label: 'Warehouse', value: 'warehouse' },
    { label: 'Restaurant', value: 'restaurant' },
    { label: 'Other', value: 'other' }
  ]
  const locations = ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR', 'Jayanagar', 'BTM', 'MG Road', 'Brigade Road', 'Marathahalli', 'Hebbal', 'Banashankari', 'Sarjapur Road', 'Electronic City', 'Bellandur', 'Other']
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
      const response = await fetch(`/api/properties/${propertyId}`)
      if (response.ok) {
        const data = await response.json()
        const prop = data.property || data
        setFormData({
          title: prop.title || '',
          description: prop.description || '',
          address: prop.address || '',
          city: prop.city || '',
          state: prop.state || '',
          zipCode: prop.zipCode || '',
          latitude: prop.latitude?.toString() || '',
          longitude: prop.longitude?.toString() || '',
          price: prop.price?.toString() || '',
          priceType: prop.priceType || 'monthly',
          securityDeposit: prop.securityDeposit?.toString() || '',
          rentEscalation: prop.rentEscalation?.toString() || '',
          size: prop.size?.toString() || '',
          propertyType: prop.propertyType || 'office',
          storePowerCapacity: prop.storePowerCapacity || '',
          powerBackup: prop.powerBackup || false,
          waterFacility: prop.waterFacility || false,
          amenities: (prop.amenities as string[]) || [],
          ownerId: prop.ownerId || prop.owner?.id || '',
          availability: prop.availability !== undefined ? prop.availability : true,
          isFeatured: prop.isFeatured || false,
          displayOrder: prop.displayOrder || 0,
        })
        setImages((prop.images as string[]) || [])
      } else {
        alert('Property not found')
        router.push('/admin/properties')
      }
    } catch (error) {
      console.error('Error fetching property:', error)
      alert('Failed to load property')
    } finally {
      setLoading(false)
    }
  }

  const fetchOwners = async () => {
    try {
      const response = await fetch('/api/admin/owners')
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
      const response = await fetch(`/api/admin/properties?userId=${user.id}&userEmail=${encodeURIComponent(user.email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
          propertyId,
          ...formData,
          price: parseFloat(formData.price || '0'),
          securityDeposit: formData.securityDeposit ? parseFloat(formData.securityDeposit) : null,
          rentEscalation: formData.rentEscalation ? parseFloat(formData.rentEscalation) : null,
          size: parseInt(formData.size || '0'),
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF5200] mx-auto mb-4"></div>
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
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                >
                  <option value="">Select city</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
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
                  {propertyTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
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

          {/* Owner & Status */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Owner & Status</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Owner *</label>
                <select
                  required
                  value={formData.ownerId}
                  onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                >
                  <option value="">Select Owner</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name} ({owner.email})
                    </option>
                  ))}
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

