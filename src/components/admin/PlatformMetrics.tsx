'use client'

import StatCard from './StatCard'

interface PlatformMetricsProps {
  metrics: {
    averageBFI: number
    averagePFI: number
    totalMatches: number
    matchSuccessRate: number
    aiSearchCount: number
    conversionRate: number
  }
}

export default function PlatformMetrics({ metrics }: PlatformMetricsProps) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Platform Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Average BFI Score"
          value={metrics.averageBFI.toFixed(1)}
          color="blue"
        />
        <StatCard
          title="Average PFI Score"
          value={metrics.averagePFI.toFixed(1)}
          color="green"
        />
        <StatCard
          title="Total Matches Generated"
          value={metrics.totalMatches}
          color="purple"
        />
        <StatCard
          title="Match Success Rate"
          value={`${metrics.matchSuccessRate.toFixed(1)}%`}
          color="orange"
        />
        <StatCard
          title="AI Search Count"
          value={metrics.aiSearchCount}
          color="blue"
        />
        <StatCard
          title="Conversion Rate"
          value={`${metrics.conversionRate.toFixed(1)}%`}
          color="green"
        />
      </div>
    </div>
  )
}

