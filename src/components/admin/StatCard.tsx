'use client'

import { motion } from 'framer-motion'

interface StatCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'orange' | 'blue' | 'green' | 'purple' | 'red'
}

export default function StatCard({ title, value, icon, trend, color = 'orange' }: StatCardProps) {
  const colorClasses = {
    orange: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    red: 'from-red-500/20 to-rose-500/20 border-red-500/30'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm border rounded-xl p-6 shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-300 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  )
}

