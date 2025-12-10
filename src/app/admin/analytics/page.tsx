'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import AnalyticsCharts from '@/components/admin/AnalyticsCharts'
import { useAuth } from '@/contexts/AuthContext'

interface Analytics {
  userRegistrations: { date: string; count: number }[]
  propertyListings: { date: string; count: number }[]
  inquiryCreation: { date: string; count: number }[]
  topLocations: { location: string; count: number }[]
  propertyTypes: { type: string; count: number }[]
  brandOwnerRatio: {
    brands: number
    owners: number
    admins: number
  }
  searchAnalytics: {
    totalSearches: number
    buttonFlow: number
    textSearch: number
    averageResults: number
    conversionRate: number
  }
  inquiriesByStatus?: Record<string, number>
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | 'all'>('30d')

  useEffect(() => {
    if (user?.id && user?.email) {
      fetchAnalytics()
    }
  }, [user, dateRange])

  const fetchAnalytics = async () => {
    if (!user?.id || !user?.email) return

    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?range=${dateRange}&userId=${user.id}&userEmail=${encodeURIComponent(user.email)}`)
      
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
            <p className="text-gray-400">Detailed platform analytics and insights</p>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="flex flex-wrap gap-2">
          {(['today', '7d', '30d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateRange === range
                  ? 'bg-[#FF5200] text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === 'today' ? 'Today' : 'All Time'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5200]"></div>
          </div>
        ) : analytics ? (
          <AnalyticsCharts
            userRegistrations={analytics.userRegistrations}
            propertyListings={analytics.propertyListings}
            inquiryCreation={analytics.inquiryCreation}
            topLocations={analytics.topLocations}
            propertyTypes={analytics.propertyTypes}
            brandOwnerRatio={analytics.brandOwnerRatio}
            searchAnalytics={analytics.searchAnalytics}
            inquiriesByStatus={analytics.inquiriesByStatus}
          />
        ) : (
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
            <div className="text-center py-12 text-gray-400">
              <p>No analytics data available</p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

