'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'

export default function NewBrandPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    email: '',
    password: '',
    phone: '',
    companyName: '',
    industry: '',
    // From Brand Filter
    businessType: '',
    businessTypeOther: '',
    sizeRange: '',
    preferredLocations: [] as string[],
    preferredLocationsOther: '',
    budgetMin: '',
    budgetMax: '',
    timeline: '',
    // From Brand Onboarding
    storeType: '',
    storeTypeOther: '',
    targetAudience: '',
    additionalRequirements: '',
  })

  const businessTypes = ['Café/QSR', 'Restaurant', 'Bar/Brewery', 'Retail', 'Gym', 'Entertainment', 'Others']
  const sizeRanges = ['100-500 sqft', '500-1,000 sqft', '1,000-2,000 sqft', '2,000-5,000 sqft', '5,000-10,000 sqft', '10,000+ sqft', 'Custom']
  const locations = ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR', 'Jayanagar', 'BTM', 'MG Road', 'Brigade Road', 'Marathahalli', 'Hebbal', 'Others']
  const timelines = ['Immediate', '1 month', '1-2 months', '2-3 months', 'Flexible']
  const storeTypes = ['Quick Service Restaurant (QSR)', 'Café', 'Retail Store', 'Bar/Pub', 'Fitness Studio', 'Salon/Spa', 'Other']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Parse size range to min/max
      let minSize = 0
      let maxSize = 100000
      if (formData.sizeRange) {
        if (formData.sizeRange.includes('-')) {
          const [min, max] = formData.sizeRange.split('-').map(v => parseInt(v.replace(/[^0-9]/g, '')))
          minSize = min || 0
          maxSize = max || 100000
        } else if (formData.sizeRange.includes('+')) {
          minSize = parseInt(formData.sizeRange.replace(/[^0-9]/g, '')) || 0
          maxSize = 100000
        }
      }

      // Use custom "Other" values if provided
      const businessType = formData.businessType === 'Others' && formData.businessTypeOther 
        ? formData.businessTypeOther 
        : formData.businessType
      const preferredLocations = formData.preferredLocations.includes('Others') && formData.preferredLocationsOther
        ? [...formData.preferredLocations.filter(l => l !== 'Others'), formData.preferredLocationsOther]
        : formData.preferredLocations

      const response = await fetch('/api/admin/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          companyName: formData.companyName,
          industry: formData.industry || businessType,
          budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : null,
          budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : null,
          minSize,
          maxSize,
          preferredLocations: preferredLocations,
        }),
      })

      if (response.ok) {
        router.push('/admin/brands')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create brand')
      }
    } catch (error) {
      console.error('Error creating brand:', error)
      alert('Failed to create brand')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Add New Brand</h1>
          <p className="text-gray-400">Create a new brand account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                />
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Company Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Industry</label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                />
              </div>
            </div>
          </div>

          {/* Business Type & Store Type (from Filter & Onboarding) */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Business Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Business Type *</label>
                <select
                  required
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
                <label className="block text-sm font-medium text-gray-300 mb-2">Store Type *</label>
                <select
                  required
                  value={formData.storeType}
                  onChange={(e) => setFormData({ ...formData, storeType: e.target.value, storeTypeOther: e.target.value !== 'other' ? '' : formData.storeTypeOther })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                >
                  <option value="">Select store type</option>
                  {storeTypes.map(type => (
                    <option key={type} value={type.toLowerCase().replace(/\s+/g, '-')}>{type}</option>
                  ))}
                </select>
                {formData.storeType === 'other' && (
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

          {/* Size Range (from Filter) */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Size Requirements</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Size Range *</label>
                <select
                  required
                  value={formData.sizeRange}
                  onChange={(e) => setFormData({ ...formData, sizeRange: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                >
                  <option value="">Select size range</option>
                  {sizeRanges.map(range => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Preferred Locations (from Filter - multi-select) */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Preferred Locations *</h2>
            <div className="grid grid-cols-3 gap-3">
              {locations.map(location => (
                <label key={location} className="flex items-center gap-2 cursor-pointer">
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
                    className="w-4 h-4 rounded"
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

          {/* Budget (from Filter) */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Budget (Monthly Rent) *</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Budget Min (₹)</label>
                <input
                  type="number"
                  required
                  value={formData.budgetMin}
                  onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                  placeholder="e.g., 50000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Budget Max (₹)</label>
                <input
                  type="number"
                  required
                  value={formData.budgetMax}
                  onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                  placeholder="e.g., 200000"
                />
              </div>
            </div>
          </div>

          {/* Timeline (from Filter) */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Timeline *</h2>
            <div>
              <select
                required
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
          </div>

          {/* Target Audience & Additional Requirements (from Onboarding) */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Additional Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Target Audience</label>
                <textarea
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                  placeholder="Describe your target customers (age, income level, preferences, etc.)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Additional Requirements</label>
                <textarea
                  value={formData.additionalRequirements}
                  onChange={(e) => setFormData({ ...formData, additionalRequirements: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200]"
                  placeholder="Any specific requirements (parking, foot traffic, visibility, etc.)"
                />
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
              {loading ? 'Creating...' : 'Create Brand Entry'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}

