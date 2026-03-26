'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import AdminLayout from '@/components/admin/AdminLayout'

export default function NewBrandPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    brandName: '',      // renamed from companyName → brand name
    industry: '',
    businessType: '',
    businessTypeOther: '',
    sizeRange: '',
    preferredLocations: [] as string[],
    preferredLocationsOther: '',
    budgetMin: '',
    budgetMax: '',
    timeline: '',
    storeType: '',
    storeTypeOther: '',
    targetAudience: '',
    additionalRequirements: '',
  })

  const businessTypes = [
    'Café/QSR',
    'Restaurant',
    'Bar/Brewery',
    'Retail',
    'Gym',
    'Sports Facility',
    'Entertainment',
    'Fashion & Apparel',
    'Electronics & Technology',
    'Grocery & Supermarket',
    'Pharmacy & Health',
    'Salon & Spa',
    'Jewellery',
    'Home Décor & Furniture',
    'Books & Stationery',
    'Kids & Baby',
    'Automotive',
    'Travel & Hospitality',
    'Education & Coaching',
    'Co-working / Office',
    'Others',
  ]

  const sizeRanges = [
    '< 100 sqft',
    '100–300 sqft',
    '300–500 sqft',
    '500–1,000 sqft',
    '1,000–2,000 sqft',
    '2,000–5,000 sqft',
    '5,000–10,000 sqft',
    '10,000+ sqft',
    'Custom',
  ]

  // Comprehensive Bangalore location list
  const locationGroups: { group: string; places: string[] }[] = [
    {
      group: 'Central & CBD',
      places: [
        'MG Road',
        'Brigade Road',
        'Commercial Street',
        'Church Street',
        'Infantry Road',
        'St Mark\'s Road',
        'Museum Road',
        'Lavelle Road',
        'Residency Road',
        'Richmond Road',
        'UB City / Vittal Mallya Road',
        'Cunningham Road',
        'Majestic / KSR',
      ],
    },
    {
      group: 'South Bangalore',
      places: [
        'Koramangala',
        'HSR Layout',
        'BTM Layout',
        'Jayanagar',
        'JP Nagar',
        'Banashankari',
        'Bannerghatta Road',
        'Kanakapura Road',
        'Basavanagudi',
        'Uttarahalli',
        'Padmanabhanagar',
      ],
    },
    {
      group: 'East Bangalore',
      places: [
        'Indiranagar',
        'Domlur',
        'Old Airport Road',
        'HAL / Old Madras Road',
        'CV Raman Nagar',
        'Banaswadi',
        'Kammanahalli',
        'HRBR Layout',
        'KR Puram',
        'Ramamurthy Nagar',
        'Hoodi',
        'Whitefield',
        'ITPL',
        'Marathahalli',
        'Bellandur',
        'Sarjapur Road',
        'Varthur',
        'Panathur',
      ],
    },
    {
      group: 'North Bangalore',
      places: [
        'Hebbal',
        'Manyata Tech Park',
        'Sahakara Nagar',
        'HBR Layout',
        'RT Nagar',
        'Nagawara',
        'Jakkur',
        'Yelahanka',
        'Devanahalli',
        'Airport Road',
        'Kalyan Nagar',
        'Frazer Town',
        'Benson Town',
        'Cox Town',
        'Shivajinagar / Seshadripuram',
        'Rajajinagar',
        'Sadashivanagar',
        'Malleswaram',
      ],
    },
    {
      group: 'West Bangalore',
      places: [
        'Rajajinagar Industrial Area',
        'Peenya',
        'Yeshwanthpur',
        'Tumkur Road',
        'Dasarahalli',
        'Magadi Road',
        'Kengeri',
        'Vijaynagar',
      ],
    },
    {
      group: 'South-East Corridor',
      places: [
        'Electronic City Phase 1',
        'Electronic City Phase 2',
        'Bommanahalli',
        'Hongasandra',
        'Anekal',
      ],
    },
    {
      group: 'Outer Ring Road (ORR)',
      places: [
        'ORR – Marathahalli',
        'ORR – Bellandur',
        'ORR – Kadubeesanahalli',
        'ORR – Sarjapur Junction',
        'ORR – Hebbal',
        'ORR – Tin Factory',
      ],
    },
  ]

  const allLocations = locationGroups.flatMap(g => g.places)

  const timelines = ['Immediate', '1 month', '1–2 months', '2–3 months', '3–6 months', 'Flexible']

  const storeTypes = [
    'Quick Service Restaurant (QSR)',
    'Café',
    'Retail Store',
    'Bar / Pub',
    'Fitness Studio',
    'Salon / Spa',
    'Showroom',
    'Kiosk',
    'Food Court Unit',
    'Mall Anchor',
    'Dark Kitchen / Cloud Kitchen',
    'Other',
  ]

  const toggleLocation = (loc: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      preferredLocations: checked
        ? [...prev.preferredLocations, loc]
        : prev.preferredLocations.filter(l => l !== loc),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let minSize = 0
      let maxSize = 100000
      if (formData.sizeRange) {
        const nums = formData.sizeRange.replace(/[^0-9,]/g, ' ').trim().split(/\s+/).map(Number).filter(Boolean)
        if (nums.length >= 2) { minSize = nums[0]; maxSize = nums[1] }
        else if (nums.length === 1) { minSize = nums[0]; maxSize = 100000 }
      }

      const businessType =
        formData.businessType === 'Others' && formData.businessTypeOther
          ? formData.businessTypeOther
          : formData.businessType

      const preferredLocations = formData.preferredLocations.includes('Others')
        ? [
            ...formData.preferredLocations.filter(l => l !== 'Others'),
            ...(formData.preferredLocationsOther ? [formData.preferredLocationsOther] : []),
          ]
        : formData.preferredLocations

      // Pass userEmail so the API can fall back to DB-based admin auth
      const queryParams = user?.email
        ? `?userEmail=${encodeURIComponent(user.email)}`
        : ''

      const response = await fetch(`/api/admin/brands${queryParams}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          companyName: formData.brandName,
          industry: formData.industry || businessType,
          budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : null,
          budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : null,
          minSize,
          maxSize,
          preferredLocations,
        }),
      })

      if (response.ok) {
        router.push('/admin/brands')
      } else {
        const err = await response.json()
        setError(err.error || 'Failed to create brand')
      }
    } catch (err: any) {
      console.error('Error creating brand:', err)
      setError(err.message || 'Failed to create brand')
    } finally {
      setLoading(false)
    }
  }

  const input = 'w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FF5200]'
  const sectionTitle = 'text-xl font-semibold text-white mb-4'

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Add New Brand</h1>
          <p className="text-gray-400">Create a new brand account</p>
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-500 text-red-300 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 space-y-8">

          {/* ── Basic Information ─────────────────────────────────────── */}
          <section>
            <h2 className={sectionTitle}>Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className={input}
                  placeholder="Contact person's full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className={input}
                  placeholder="brand@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className={`${input} pr-12`}
                    placeholder="Min 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className={input}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </section>

          {/* ── Brand / Company Information ───────────────────────────── */}
          <section>
            <h2 className={sectionTitle}>Brand Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Brand Name</label>
                <input
                  type="text"
                  value={formData.brandName}
                  onChange={e => setFormData({ ...formData, brandName: e.target.value })}
                  className={input}
                  placeholder="e.g. Eluno Eyewear"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Industry / Category</label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={e => setFormData({ ...formData, industry: e.target.value })}
                  className={input}
                  placeholder="e.g. Premium Eyewear & Optometry"
                />
              </div>
            </div>
          </section>

          {/* ── Business Details ──────────────────────────────────────── */}
          <section>
            <h2 className={sectionTitle}>Business Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Business Type *</label>
                <select
                  required
                  value={formData.businessType}
                  onChange={e => setFormData({ ...formData, businessType: e.target.value, businessTypeOther: e.target.value !== 'Others' ? '' : formData.businessTypeOther })}
                  className={input}
                >
                  <option value="">Select business type</option>
                  {businessTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {formData.businessType === 'Others' && (
                  <input
                    type="text"
                    value={formData.businessTypeOther}
                    onChange={e => setFormData({ ...formData, businessTypeOther: e.target.value })}
                    placeholder="Specify business type…"
                    className={`${input} mt-2`}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Store Type *</label>
                <select
                  required
                  value={formData.storeType}
                  onChange={e => setFormData({ ...formData, storeType: e.target.value, storeTypeOther: e.target.value !== 'other' ? '' : formData.storeTypeOther })}
                  className={input}
                >
                  <option value="">Select store type</option>
                  {storeTypes.map(t => <option key={t} value={t.toLowerCase().replace(/\s+/g, '-')}>{t}</option>)}
                </select>
                {formData.storeType === 'other' && (
                  <input
                    type="text"
                    value={formData.storeTypeOther}
                    onChange={e => setFormData({ ...formData, storeTypeOther: e.target.value })}
                    placeholder="Specify store type…"
                    className={`${input} mt-2`}
                  />
                )}
              </div>
            </div>
          </section>

          {/* ── Size Requirements ─────────────────────────────────────── */}
          <section>
            <h2 className={sectionTitle}>Size Requirements</h2>
            <div className="max-w-sm">
              <label className="block text-sm font-medium text-gray-300 mb-1">Size Range *</label>
              <select
                required
                value={formData.sizeRange}
                onChange={e => setFormData({ ...formData, sizeRange: e.target.value })}
                className={input}
              >
                <option value="">Select size range</option>
                {sizeRanges.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </section>

          {/* ── Preferred Locations ───────────────────────────────────── */}
          <section>
            <h2 className={sectionTitle}>Preferred Locations *</h2>
            <div className="space-y-5">
              {locationGroups.map(group => (
                <div key={group.group}>
                  <p className="text-xs font-semibold text-[#FF5200] uppercase tracking-widest mb-2">{group.group}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {group.places.map(loc => (
                      <label key={loc} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.preferredLocations.includes(loc)}
                          onChange={e => toggleLocation(loc, e.target.checked)}
                          className="w-4 h-4 accent-[#FF5200] rounded"
                        />
                        <span className="text-gray-300 text-sm group-hover:text-white transition-colors">{loc}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Others */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.preferredLocations.includes('Others')}
                    onChange={e => toggleLocation('Others', e.target.checked)}
                    className="w-4 h-4 accent-[#FF5200] rounded"
                  />
                  <span className="text-gray-300 text-sm group-hover:text-white transition-colors">Others</span>
                </label>
                {formData.preferredLocations.includes('Others') && (
                  <input
                    type="text"
                    value={formData.preferredLocationsOther}
                    onChange={e => setFormData({ ...formData, preferredLocationsOther: e.target.value })}
                    placeholder="Specify other locations…"
                    className={`${input} mt-2 max-w-lg`}
                  />
                )}
              </div>
            </div>

            {formData.preferredLocations.filter(l => l !== 'Others').length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {formData.preferredLocations.filter(l => l !== 'Others').map(loc => (
                  <span key={loc} className="inline-flex items-center gap-1 px-2 py-1 bg-[#FF5200]/20 text-[#FF5200] rounded text-xs font-medium">
                    {loc}
                    <button type="button" onClick={() => toggleLocation(loc, false)} className="hover:text-white">✕</button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* ── Budget ───────────────────────────────────────────────── */}
          <section>
            <h2 className={sectionTitle}>Budget (Monthly Rent) *</h2>
            <div className="grid grid-cols-2 gap-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Budget Min (₹)</label>
                <input
                  type="number"
                  required
                  value={formData.budgetMin}
                  onChange={e => setFormData({ ...formData, budgetMin: e.target.value })}
                  className={input}
                  placeholder="50000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Budget Max (₹)</label>
                <input
                  type="number"
                  required
                  value={formData.budgetMax}
                  onChange={e => setFormData({ ...formData, budgetMax: e.target.value })}
                  className={input}
                  placeholder="400000"
                />
              </div>
            </div>
          </section>

          {/* ── Timeline ─────────────────────────────────────────────── */}
          <section>
            <h2 className={sectionTitle}>Timeline *</h2>
            <div className="max-w-sm">
              <select
                required
                value={formData.timeline}
                onChange={e => setFormData({ ...formData, timeline: e.target.value })}
                className={input}
              >
                <option value="">Select timeline</option>
                {timelines.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </section>

          {/* ── Additional Information ────────────────────────────────── */}
          <section>
            <h2 className={sectionTitle}>Additional Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Target Audience</label>
                <textarea
                  value={formData.targetAudience}
                  onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                  rows={3}
                  className={input}
                  placeholder="Describe target customers (age, income level, preferences…)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Additional Requirements</label>
                <textarea
                  value={formData.additionalRequirements}
                  onChange={e => setFormData({ ...formData, additionalRequirements: e.target.value })}
                  rows={3}
                  className={input}
                  placeholder="Specific requirements (parking, foot traffic, visibility…)"
                />
              </div>
            </div>
          </section>

          {/* ── Actions ───────────────────────────────────────────────── */}
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
              className="px-6 py-2 bg-[#FF5200] text-white rounded-lg hover:bg-[#E04800] transition-colors disabled:opacity-50 font-semibold"
            >
              {loading ? 'Creating…' : 'Create Brand Entry'}
            </button>
          </div>

        </form>
      </div>
    </AdminLayout>
  )
}
