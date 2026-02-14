'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  children?: NavItem[]
  badge?: number
}

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [expandedItems, setExpandedItems] = useState<string[]>(['properties', 'brands'])
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (user?.id && user?.email) {
      fetchPendingCount()
    }
  }, [user])

  const fetchPendingCount = async () => {
    try {
      const url = `/api/admin/properties?limit=1000&page=1&status=pending&userId=${user?.id}&userEmail=${encodeURIComponent(user?.email || '')}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        const pending = (data.properties || []).filter(
          (p: any) => (p.status || (p.availability === false ? 'pending' : 'approved')) === 'pending'
        )
        setPendingCount(pending.length)
      }
    } catch (error) {
      console.error('Error fetching pending count:', error)
    }
  }

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Properties',
      href: '/admin/properties',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      children: [
        { name: 'All Properties', href: '/admin/properties', icon: null },
        { name: 'Pending Approvals', href: '/admin/properties/pending', icon: null, badge: pendingCount },
        { name: 'Add New', href: '/admin/properties/new', icon: null },
      ]
    },
    {
      name: 'Brands',
      href: '/admin/brands',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      children: [
        { name: 'All Brands', href: '/admin/brands', icon: null },
        { name: 'Add New', href: '/admin/brands/new', icon: null },
      ]
    },
    {
      name: 'Inquiries',
      href: '/admin/inquiries',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      name: 'BFI & PFI Matches',
      href: '/admin/matches',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ]

  const toggleExpand = (name: string) => {
    setExpandedItems(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name]
    )
  }

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname?.startsWith(href)
  }

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 min-h-screen fixed left-0 top-0 pt-16 overflow-y-auto">
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Admin</h2>
          <p className="text-gray-400 text-sm">Lokazen CRM</p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <div key={item.name}>
              <button
                onClick={() => {
                  if (item.children) {
                    toggleExpand(item.name.toLowerCase())
                  } else {
                    router.push(item.href)
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-[#FF5200] text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="flex-1 text-left font-medium">{item.name}</span>
                {item.children && (
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      expandedItems.includes(item.name.toLowerCase()) ? 'rotate-90' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>

              {item.children && expandedItems.includes(item.name.toLowerCase()) && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <button
                      key={child.name}
                      onClick={() => router.push(child.href)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                        pathname === child.href
                          ? 'bg-gray-800 text-[#FF5200]'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                      }`}
                    >
                      <span>{child.name}</span>
                      {child.badge !== undefined && child.badge > 0 && (
                        <span className="px-2 py-0.5 bg-[#FF5200] text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                          {child.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}
