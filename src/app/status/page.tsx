'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'
import { motion } from 'framer-motion'

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-fraunces',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-plusjakarta',
})

interface StatusCheck {
  name: string
  status: 'operational' | 'degraded' | 'down'
  message: string
  responseTime?: number
  uptime?: number
}

interface FeatureStatus {
  name: string
  status: 'implemented' | 'in-progress' | 'planned'
  description: string
}

interface ApiEndpoint {
  method: string
  endpoint: string
  status: 'active' | 'in-progress' | 'planned'
  description: string
  responseTime?: number
}

interface DatabaseStats {
  totalUsers: number
  totalProperties: number
  totalInquiries: number
  totalMatches: number
  databaseSize?: string
  activeConnections?: number
}

interface PlatformStatusData {
  status: 'operational' | 'degraded' | 'down'
  timestamp: string
  coreSystems: {
    database: StatusCheck
    aiEngine: StatusCheck
    authentication: StatusCheck
  }
  features: FeatureStatus[]
  apiEndpoints: ApiEndpoint[]
  databaseStats: DatabaseStats
  techStack: {
    nextjs: string
    react: string
    typescript: string
    prisma: string
    postgresql: string
    nodejs: string
    anthropic: string
    framerMotion: string
    tailwindcss: string
  }
  deployment: {
    environment: string
    buildVersion: string
    lastDeployment: string
    gitCommit: string
    vercel: string
  }
  system: {
    nodeVersion: string
    platform: string
    uptime: number
    memory: {
      used: number
      total: number
      limit: number
    }
    timestamp: string
  }
  responseTime: number
}

export default function StatusPage() {
  const [statusData, setStatusData] = useState<PlatformStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/platform-status')
      const data = await response.json()
      
      if (response.ok) {
        setStatusData(data)
        setLastUpdated(new Date())
      } else {
        setError(data.error || 'Failed to fetch status')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
      case 'implemented':
      case 'active':
        return 'bg-green-500'
      case 'degraded':
      case 'in-progress':
        return 'bg-yellow-500'
      case 'down':
      case 'planned':
        return status === 'down' ? 'bg-red-500' : 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational':
        return 'Operational'
      case 'degraded':
        return 'Degraded'
      case 'down':
        return 'Down'
      case 'implemented':
        return 'Implemented'
      case 'in-progress':
        return 'In Progress'
      case 'planned':
        return 'Planned'
      case 'active':
        return 'Active'
      default:
        return 'Unknown'
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className={`${fraunces.variable} ${plusJakarta.variable} min-h-screen bg-white`}>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#FF5200]/10 to-[#E4002B]/10 border border-[#FF5200]/30 rounded-full mb-6 backdrop-blur-xl">
            <span className="w-2 h-2 bg-gradient-to-r from-[#FF5200] to-[#E4002B] rounded-full mr-3 animate-pulse shadow-[0_0_10px_rgba(255,82,0,1)]"></span>
            <span className="text-sm font-semibold bg-gradient-to-r from-[#FF5200] to-[#E4002B] bg-clip-text text-transparent">Platform Status</span>
          </div>
          
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-gray-900"
            style={{ fontFamily: fraunces.style.fontFamily }}
          >
            Platform Status
          </h1>
          <p className="text-lg text-gray-600 mb-6" style={{ fontFamily: plusJakarta.style.fontFamily }}>
            Real-time system health and feature availability
          </p>
          
          {/* Overall Status Badge */}
          {statusData && (
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className={`w-4 h-4 rounded-full ${getStatusColor(statusData.status)} animate-pulse`}></div>
              <span className="text-xl font-semibold text-gray-900" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                {statusData.status === 'operational' ? 'All Systems Operational' : statusData.status === 'degraded' ? 'Some Issues Detected' : 'System Down'}
              </span>
            </div>
          )}
          
          {lastUpdated && (
            <p className="text-sm text-gray-500" style={{ fontFamily: plusJakarta.style.fontFamily }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </motion.div>

        {/* Refresh Button */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <motion.button
            onClick={fetchStatus}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ fontFamily: plusJakarta.style.fontFamily }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Status
              </>
            )}
          </motion.button>
          
          <motion.a
            href="mailto:support@ngventures.com?subject=Platform Issue Report"
            className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-[#FF5200] hover:text-[#FF5200] transition-all flex items-center gap-2"
            style={{ fontFamily: plusJakarta.style.fontFamily }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Report Issue
          </motion.a>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <p className="text-red-700 font-medium" style={{ fontFamily: plusJakarta.style.fontFamily }}>
              Error: {error}
            </p>
          </div>
        )}

        {loading && !statusData && (
          <div className="flex items-center justify-center py-20">
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-[#FF5200] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-[#E4002B] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {statusData && (
          <div className="space-y-8">
            {/* Core Systems Status */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: fraunces.style.fontFamily }}>
                Core Systems Status
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.values(statusData.coreSystems).map((system, index) => (
                  <motion.div
                    key={system.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                        {system.name}
                      </h3>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(system.status)}`}></div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                      {system.message}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      {system.responseTime && (
                        <span>Response: {system.responseTime}ms</span>
                      )}
                      {system.uptime && (
                        <span>Uptime: {system.uptime.toFixed(1)}%</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Features Status */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: fraunces.style.fontFamily }}>
                Features Status
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {statusData.features.map((feature, index) => (
                  <motion.div
                    key={feature.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="bg-white border-2 border-gray-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getStatusColor(feature.status)}`}></div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 mb-1" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                          {feature.name}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                          {feature.description}
                        </p>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          feature.status === 'implemented' ? 'bg-green-100 text-green-700' :
                          feature.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {getStatusText(feature.status)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* API Endpoints Status */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: fraunces.style.fontFamily }}>
                API Endpoints Status
              </h2>
              <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                          Endpoint
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {statusData.apiEndpoints.map((endpoint, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                              endpoint.method === 'POST' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {endpoint.method}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-sm text-gray-900">
                            {endpoint.endpoint}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(endpoint.status)}`}></div>
                              <span className="text-sm text-gray-700">{getStatusText(endpoint.status)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {endpoint.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Database Statistics */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: fraunces.style.fontFamily }}>
                Database Statistics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: statusData.databaseStats.totalUsers },
                  { label: 'Total Properties', value: statusData.databaseStats.totalProperties },
                  { label: 'Total Inquiries', value: statusData.databaseStats.totalInquiries },
                  { label: 'Total Matches', value: statusData.databaseStats.totalMatches }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="bg-gradient-to-br from-[#FF5200]/10 to-[#E4002B]/10 border-2 border-[#FF5200]/20 rounded-xl p-6 text-center"
                  >
                    <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]" style={{ fontFamily: fraunces.style.fontFamily }}>
                      {stat.value.toLocaleString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Tech Stack Info */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: fraunces.style.fontFamily }}>
                Tech Stack Information
              </h2>
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {Object.entries(statusData.techStack).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-lg font-semibold text-gray-900" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Deployment Info */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: fraunces.style.fontFamily }}>
                Deployment Information
              </h2>
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(statusData.deployment).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-base font-semibold text-gray-900" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                        {key === 'lastDeployment' ? formatDate(value as string) : value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Performance Metrics */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: fraunces.style.fontFamily }}>
                Performance Metrics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                  <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                    API Response Time
                  </p>
                  <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]" style={{ fontFamily: fraunces.style.fontFamily }}>
                    {statusData.responseTime}ms
                  </p>
                </div>
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                  <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                    System Uptime
                  </p>
                  <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]" style={{ fontFamily: fraunces.style.fontFamily }}>
                    {formatUptime(statusData.system.uptime)}
                  </p>
                </div>
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                  <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: plusJakarta.style.fontFamily }}>
                    Memory Usage
                  </p>
                  <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]" style={{ fontFamily: fraunces.style.fontFamily }}>
                    {statusData.system.memory.used}MB
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
