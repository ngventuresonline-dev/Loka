'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAuth } from '@/contexts/AuthContext'

// Remove duplicated tag prefixes from a stored target audience string
function sanitizeTargetAudience(text: string, tags: string[]) {
  const tagPrefix = tags.length ? tags.join(', ') : ''
  let clean = text?.trim() || ''

  if (tagPrefix) {
    const lowerPrefix = tagPrefix.toLowerCase()
    if (clean.toLowerCase().startsWith(lowerPrefix)) {
      clean = clean.slice(tagPrefix.length).trim()
      if (clean.startsWith('-')) clean = clean.slice(1).trim()
      if (clean.startsWith(',')) clean = clean.slice(1).trim()
    }
  }

  return clean
}

export default function EditBrandPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    email: '',
    phone: '',
    companyName: '',
    displayOrder: 0,
    // From Filter Page
    businessType: '',
    businessTypeOther: '',
    sizeMin: '',
    sizeMax: '',
    preferredLocations: [] as string[],
    preferredLocationsOther: '',
    budgetMin: '',
    budgetMax: '',
    timeline: '',
    // From Onboarding Page
    storeType: '',
    storeTypeOther: '',
    targetAudience: '',
    targetAudienceTags: [] as string[],
    additionalRequirements: '',
    // Badges - multiple selection
    badges: [] as string[],
  })

  // Available audience tags
  const audienceTags = [
    'Families',
    'Young Professionals',
    'Students',
    'Corporate Employees',
    'High-Income',
    'Mid-Income',
    'Health Conscious',
    'Foodies',
    'Shoppers'
  ]

  // Available badges
  const availableBadges = [
    'Active',
    'Very Active',
    'Multiple Properties Matched',
    'Property Matched'
  ]

  // Business types from brand filter page
  const businessTypes = [
    'Café/QSR',
    'Restaurant',
    'Bar/Brewery',
    'Retail',
    'Gym',
    'Sports Facility',
    'Entertainment',
    'Others',
  ]
  
  // All locations sorted alphabetically + new areas
  const locations = [
    'Banashankari',
    'Bannerghatta Road',
    'Basavanagudi',
    'Bellandur',
    'Brigade Road',
    'BTM Layout',
    'Church Street',
    'Commercial Street',
    'Devanahalli',
    'Electronic City',
    'Frazer Town',
    'Hebbal',
    'HSR Layout',
    'Indiranagar',
    'JP Nagar',
    'Kamanahalli',
    'Kanakapura Road',
    'Kalyan Nagar',
    'Kengeri',
    'Koramangala',
    'KR Puram',
    'Lavelle Road',
    'Magadi Road',
    'Malleshwaram',
    'Manyata Tech Park',
    'Marathahalli',
    'MG Road',
    'Mysore Road',
    'New Bel Road',
    'Old Madras Road',
    'Peenya',
    'Raja Rajeshwari Nagar',
    'Rajajinagar',
    'Richmond Town',
    'RR Nagar',
    'RT Nagar',
    'Sadashivanagar',
    'Sahakar Nagar',
    'Sarjapur Road',
    'UB City',
    'Ulsoor',
    'Vijayanagar',
    'Whitefield',
    'Yelahanka',
    'Yeshwanthpur',
    'Others'
  ]
  
  const timelines = ['Immediate', '1 month', '1-2 months', '2-3 months', 'Flexible']
  
  // Property types from owner filter page - used as Store Types
  const storeTypes = [
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

  useEffect(() => {
    const fetchBrand = async () => {
      const id = params.id as string
      
      // Fetch from database
      if (user?.id && user?.email) {
        try {
          const response = await fetch(`/api/admin/brands/${id}?userId=${user.id}&userEmail=${encodeURIComponent(user.email)}`)
          if (response.ok) {
            const data = await response.json()
            console.log('API Response:', JSON.stringify(data, null, 2))
            const brand = data.brand
            const profile = brand?.brandProfile || {}
            
            console.log('Brand data:', brand)
            console.log('Profile data:', profile)
            
            // Ensure all fields are properly pre-filled with existing data
            const formDataToSet = {
              name: brand?.name || '',
              email: brand?.email || '',
              phone: brand?.phone || '',
              companyName: brand?.companyName || '',
              displayOrder: brand?.displayOrder || 0,
              businessType: brand?.industry || '',
              businessTypeOther: '',
              sizeMin: profile?.minSize != null && profile.minSize !== null ? String(profile.minSize) : '',
              sizeMax: profile?.maxSize != null && profile.maxSize !== null ? String(profile.maxSize) : '',
              preferredLocations: Array.isArray(profile?.preferredLocations) ? profile.preferredLocations : [],
              preferredLocationsOther: '',
              budgetMin: profile?.budgetMin != null && profile.budgetMin !== null ? String(profile.budgetMin) : '',
              budgetMax: profile?.budgetMax != null && profile.budgetMax !== null ? String(profile.budgetMax) : '',
              timeline: profile?.timeline || '',
              storeType: profile?.storeType || '',
              storeTypeOther: '',
              targetAudience: sanitizeTargetAudience(
                profile?.targetAudience || '',
                Array.isArray(profile?.targetAudienceTags) ? profile.targetAudienceTags : []
              ),
              targetAudienceTags: Array.isArray(profile?.targetAudienceTags) 
                ? profile.targetAudienceTags 
                : [],
              additionalRequirements: profile?.additionalRequirements || '',
              badges: Array.isArray(profile?.badges) 
                ? profile.badges 
                : [],
            }
            
            console.log('Setting form data:', formDataToSet)
            setFormData(formDataToSet)
          } else {
            const errorData = await response.json().catch(() => ({ error: response.statusText }))
            console.error('Failed to fetch brand:', response.status, errorData)
            
            if (response.status === 404) {
              alert('Brand not found. This brand may not exist in the database. Please go back and select a valid brand.')
              router.push('/admin/brands')
            } else {
              alert(`Failed to load brand data: ${errorData.error || response.statusText}`)
            }
          }
        } catch (error) {
          console.error('Error fetching brand:', error)
        }
      }
      setFetching(false)
    }

    if (params.id) {
      fetchBrand()
    }
  }, [params.id, user])


  const handleUpdateRequirements = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const id = params.id as string
      
      if (!user?.id || !user?.email) {
        alert('Authentication required')
        setLoading(false)
        return
      }

      // Update brand requirements - ALL fields from filter and onboarding forms
      // Use custom "Other" values if provided
      const businessType = formData.businessType === 'Others' && formData.businessTypeOther 
        ? formData.businessTypeOther 
        : formData.businessType
      const storeType = formData.storeType === 'Other' && formData.storeTypeOther 
        ? formData.storeTypeOther 
        : formData.storeType
      const preferredLocations = formData.preferredLocations.includes('Others') && formData.preferredLocationsOther
        ? [...formData.preferredLocations.filter(l => l !== 'Others'), formData.preferredLocationsOther]
        : formData.preferredLocations
      
      // Combine audience tags with custom text
      const tagText = formData.targetAudienceTags.join(', ')
      const customText = sanitizeTargetAudience(formData.targetAudience, formData.targetAudienceTags)
      const targetAudienceFinal = [tagText, customText].filter(Boolean).join(tagText && customText ? ' - ' : '')

      const response = await fetch(`/api/admin/brands/${id}?userId=${user.id}&userEmail=${encodeURIComponent(user.email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName,
          industry: businessType,
          displayOrder: parseInt(String(formData.displayOrder)) || null,
          budgetMin: parseFloat(formData.budgetMin) || null,
          budgetMax: parseFloat(formData.budgetMax) || null,
          minSize: parseInt(formData.sizeMin) || null,
          maxSize: parseInt(formData.sizeMax) || null,
          preferredLocations: preferredLocations,
          timeline: formData.timeline,
          storeType: storeType,
          targetAudience: targetAudienceFinal,
          targetAudienceTags: formData.targetAudienceTags,
          additionalRequirements: formData.additionalRequirements,
          badges: formData.badges,
        }),
      })

      if (response.ok) {
        alert('Brand requirements updated successfully')
        router.push('/admin/brands')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update requirements')
      }
    } catch (error) {
      console.error('Error updating requirements:', error)
      alert('Failed to update requirements')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5200]"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Edit Brand Requirements</h1>
          <p className="text-gray-400">Update brand requirements and preferences</p>
        </div>

        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Brand Requirements</h2>
              <p className="text-gray-400">Update all brand requirements and preferences</p>
            </div>

            <form onSubmit={handleUpdateRequirements} className="space-y-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Business Type / Industry</label>
                    <select
                      value={formData.businessType}
                      onChange={(e) => setFormData({ ...formData, businessType: e.target.value, businessTypeOther: e.target.value !== 'Others' ? '' : formData.businessTypeOther })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                    >
                      <option value="">Select business type</option>
                      {businessTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {formData.businessType === 'Others' && (
                      <input
                        type="text"
                        value={formData.businessTypeOther}
                        onChange={(e) => setFormData({ ...formData, businessTypeOther: e.target.value })}
                        placeholder="Please specify..."
                        className="w-full mt-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#FF5200]"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Display Order</label>
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

              {/* Size Requirements (from Filter) */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Size Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Minimum Size (sq ft)</label>
                    <input
                      type="number"
                      value={formData.sizeMin}
                      onChange={(e) => setFormData({ ...formData, sizeMin: e.target.value })}
                      placeholder="e.g., 500"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#FF5200]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Maximum Size (sq ft)</label>
                    <input
                      type="number"
                      value={formData.sizeMax}
                      onChange={(e) => setFormData({ ...formData, sizeMax: e.target.value })}
                      placeholder="e.g., 2000"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#FF5200]"
                    />
                  </div>
                </div>
              </div>

              {/* Budget (from Filter) */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Budget Range</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Budget Min (₹/month)</label>
                    <input
                      type="number"
                      value={formData.budgetMin}
                      onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                      placeholder="e.g., 50000"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#FF5200]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Budget Max (₹/month)</label>
                    <input
                      type="number"
                      value={formData.budgetMax}
                      onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                      placeholder="e.g., 200000"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#FF5200]"
                    />
                  </div>
                </div>
              </div>

              {/* Preferred Locations (from Filter) */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Preferred Locations</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {locations.map(location => (
                    <label key={location} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.preferredLocations.includes(location)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, preferredLocations: [...formData.preferredLocations, location] })
                          } else {
                            setFormData({ ...formData, preferredLocations: formData.preferredLocations.filter(l => l !== location) })
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-gray-300 text-sm">{location}</span>
                    </label>
                  ))}
                </div>
                {formData.preferredLocations.includes('Others') && (
                  <input
                    type="text"
                    value={formData.preferredLocationsOther}
                    onChange={(e) => setFormData({ ...formData, preferredLocationsOther: e.target.value })}
                    placeholder="Please specify other locations..."
                    className="w-full mt-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#FF5200]"
                  />
                )}
              </div>

              {/* Timeline & Store Type */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Timeline & Store Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Timeline</label>
                    <select
                      value={formData.timeline}
                      onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                    >
                      <option value="">Select timeline</option>
                      {timelines.map(timeline => (
                        <option key={timeline} value={timeline}>{timeline}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-2">Store Type</label>
                    <select
                      value={formData.storeType}
                      onChange={(e) => setFormData({ ...formData, storeType: e.target.value, storeTypeOther: e.target.value !== 'Other' ? '' : formData.storeTypeOther })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                    >
                      <option value="">Select store type</option>
                      {storeTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {formData.storeType === 'Other' && (
                      <input
                        type="text"
                        value={formData.storeTypeOther}
                        onChange={(e) => setFormData({ ...formData, storeTypeOther: e.target.value })}
                        placeholder="Please specify..."
                        className="w-full mt-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#FF5200]"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Target Audience (from Onboarding) - with clickable tags */}
              <div>
                <label className="block text-gray-300 mb-2">Target Audience</label>
                <div className="mb-3">
                  <p className="text-sm text-gray-400 mb-2">Select audience tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {audienceTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const newTags = formData.targetAudienceTags.includes(tag)
                            ? formData.targetAudienceTags.filter(t => t !== tag)
                            : [...formData.targetAudienceTags, tag]
                          setFormData({ ...formData, targetAudienceTags: newTags })
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          formData.targetAudienceTags.includes(tag)
                            ? 'bg-[#FF5200] text-white border border-[#FF5200]'
                            : 'bg-gray-800 text-gray-300 border border-gray-600 hover:border-[#FF5200] hover:text-white'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  placeholder="Additional audience details (age, income level, preferences, etc.)"
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#FF5200]"
                />
              </div>

              {/* Status Badges - Multiple Selection */}
              <div>
                <label className="block text-gray-300 mb-2">Status Badges</label>
                <p className="text-sm text-gray-400 mb-3">Select one or more badges to display on brand cards</p>
                <div className="flex flex-wrap gap-2">
                  {availableBadges.map(badge => (
                    <label key={badge} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.badges.includes(badge)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, badges: [...formData.badges, badge] })
                          } else {
                            setFormData({ ...formData, badges: formData.badges.filter(b => b !== badge) })
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-gray-300 text-sm">{badge}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Requirements (from Onboarding) */}
              <div>
                <label className="block text-gray-300 mb-2">Additional Requirements</label>
                <textarea
                  value={formData.additionalRequirements}
                  onChange={(e) => setFormData({ ...formData, additionalRequirements: e.target.value })}
                  placeholder="Any specific requirements (parking, foot traffic, visibility, etc.)"
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#FF5200]"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-[#FF5200] text-white rounded-lg hover:bg-[#E4002B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Brand Requirements'}
                </button>
              </div>
            </form>
          </div>
      </div>
    </AdminLayout>
  )
}

