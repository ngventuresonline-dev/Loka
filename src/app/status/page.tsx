'use client'

import { useState, useEffect } from 'react'

interface StatusCheck {
  name: string
  status: 'operational' | 'degraded' | 'down'
  message: string
  responseTime?: number
}

interface StatusData {
  status: 'operational' | 'degraded' | 'down'
  timestamp: string
  checks: {
    openai: StatusCheck
    database: StatusCheck
    environment: StatusCheck
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
  const [statusData, setStatusData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/status')
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
        return 'bg-green-500'
      case 'degraded':
        return 'bg-yellow-500'
      case 'down':
        return 'bg-red-500'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">System Status</h1>
          <p className="text-gray-400">Real-time status of all system components</p>
        </div>

        {/* Refresh Button */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-lg hover:shadow-[0_0_20px_rgba(255,82,0,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Refreshing...' : 'Refresh Status'}
          </button>
          {lastUpdated && (
            <span className="text-gray-400 text-sm">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        {loading && !statusData && (
          <div className="flex items-center justify-center py-12">
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-[#FF5200] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-[#E4002B] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {statusData && (
          <>
            {/* Overall Status */}
            <div className="mb-8 p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Overall Status</h2>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${getStatusColor(statusData.status)}`}></div>
                  <span className="text-xl font-semibold">{getStatusText(statusData.status)}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Response Time:</span>
                  <span className="ml-2 text-white">{statusData.responseTime}ms</span>
                </div>
                <div>
                  <span className="text-gray-400">Last Check:</span>
                  <span className="ml-2 text-white">{new Date(statusData.timestamp).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400">Uptime:</span>
                  <span className="ml-2 text-white">{formatUptime(statusData.system.uptime)}</span>
                </div>
              </div>
            </div>

            {/* Service Checks */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Service Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* OpenAI Status */}
                <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">OpenAI API</h3>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(statusData.checks.openai.status)}`}></div>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{statusData.checks.openai.message}</p>
                  {statusData.checks.openai.responseTime && (
                    <p className="text-xs text-gray-500">Response: {statusData.checks.openai.responseTime}ms</p>
                  )}
                </div>

                {/* Database Status */}
                <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">Database</h3>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(statusData.checks.database.status)}`}></div>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{statusData.checks.database.message}</p>
                  {statusData.checks.database.responseTime && (
                    <p className="text-xs text-gray-500">Response: {statusData.checks.database.responseTime}ms</p>
                  )}
                </div>

                {/* Environment Status */}
                <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">Environment</h3>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(statusData.checks.environment.status)}`}></div>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{statusData.checks.environment.message}</p>
                </div>
              </div>
            </div>

            {/* System Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">System Information</h2>
              <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">Node Version:</span>
                    <span className="ml-2 text-white">{statusData.system.nodeVersion}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Platform:</span>
                    <span className="ml-2 text-white">{statusData.system.platform}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Memory Used:</span>
                    <span className="ml-2 text-white">
                      {statusData.system.memory.used}MB / {statusData.system.memory.total}MB
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">RSS Memory:</span>
                    <span className="ml-2 text-white">{statusData.system.memory.limit}MB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Legend */}
            <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
              <h3 className="text-lg font-semibold mb-3">Status Legend</h3>
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Operational - Service is working normally</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Degraded - Service is working but with issues</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Down - Service is not available</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

