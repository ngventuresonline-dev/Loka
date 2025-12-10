'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import RecentActivity from '@/components/admin/RecentActivity'
import { useAuth } from '@/contexts/AuthContext'

export default function ActivityPage() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id && user?.email) {
      fetchActivity()
    }
  }, [user])

  const fetchActivity = async () => {
    if (!user?.id || !user?.email) return

    try {
      setLoading(true)
      const response = await fetch(`/api/admin/stats?range=all&userId=${user.id}&userEmail=${encodeURIComponent(user.email)}`)
      
      if (response.ok) {
        const data = await response.json()
        
        // Format activity data
        const formattedActivities: any[] = []
        
        // User registrations
        data.recentActivity?.users?.slice(0, 10).forEach((u: any) => {
          formattedActivities.push({
            id: `user-${u.id}`,
            type: 'user_registration',
            description: `${u.name} (${u.email}) registered as ${u.userType}`,
            timestamp: u.createdAt,
            user: { name: u.name, email: u.email }
          })
        })
        
        // Property listings
        data.recentActivity?.properties?.slice(0, 10).forEach((p: any) => {
          formattedActivities.push({
            id: `property-${p.id}`,
            type: 'property_listing',
            description: `Property "${p.title}" listed in ${p.city}`,
            timestamp: p.createdAt,
            property: { title: p.title }
          })
        })
        
        // Inquiries
        data.recentActivity?.inquiries?.slice(0, 10).forEach((i: any) => {
          formattedActivities.push({
            id: `inquiry-${i.id}`,
            type: 'inquiry_created',
            description: `${i.brand?.name || 'Brand'} inquired about "${i.property?.title || 'Property'}"`,
            timestamp: i.createdAt
          })
        })
        
        // Sort by timestamp and limit to 20
        setActivities(
          formattedActivities
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 20)
        )
      }
    } catch (error) {
      console.error('Error fetching activity:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Activity Log</h1>
          <p className="text-gray-400">View all platform activity and events</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5200]"></div>
          </div>
        ) : (
          <RecentActivity activities={activities} />
        )}
      </div>
    </AdminLayout>
  )
}

