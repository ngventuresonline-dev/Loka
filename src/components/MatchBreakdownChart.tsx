'use client'

import { motion } from 'framer-motion'

interface MatchBreakdown {
  locationScore: number
  sizeScore: number
  budgetScore: number
  typeScore: number
}

interface MatchBreakdownChartProps {
  breakdown: MatchBreakdown
  overallScore: number
}

export default function MatchBreakdownChart({ breakdown, overallScore }: MatchBreakdownChartProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600'
    if (score >= 60) return 'from-yellow-500 to-orange-500'
    return 'from-orange-500 to-red-500'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    return 'Fair'
  }

  const breakdownItems = [
    { key: 'locationScore', label: 'Location Match', weight: 30 },
    { key: 'sizeScore', label: 'Size Match', weight: 25 },
    { key: 'budgetScore', label: 'Budget Match', weight: 25 },
    { key: 'typeScore', label: 'Type Match', weight: 20 },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Overall Score */}
      <div className="text-center">
        <div className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-[#FF5200] to-[#E4002B] bg-clip-text text-transparent mb-1 sm:mb-2 leading-none">
          {overallScore}%
        </div>
        <div className="text-xs sm:text-sm text-gray-600 break-words leading-tight">Overall Brand Fit Index</div>
        <div className="text-xs text-gray-500 mt-1 whitespace-nowrap">{getScoreLabel(overallScore)} Match</div>
      </div>

      {/* Breakdown Bars */}
      <div className="space-y-3 sm:space-y-4">
        {breakdownItems.map((item, index) => {
          const score = breakdown[item.key as keyof MatchBreakdown]
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 break-words leading-tight">{item.label}</span>
                  <span className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">({item.weight}%)</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  <span className="text-xs sm:text-sm font-bold text-gray-900 whitespace-nowrap">{score}%</span>
                  <span className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap ${
                    score >= 80 ? 'bg-green-100 text-green-700' :
                    score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {getScoreLabel(score)}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 + 0.2, ease: 'easeOut' }}
                  className={`h-full bg-gradient-to-r ${getScoreColor(score)} rounded-full`}
                />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Weighted Contribution */}
      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
        <div className="text-xs text-gray-600 mb-2 sm:mb-3 break-words leading-tight">Weighted Contribution to Overall Score:</div>
        <div className="space-y-1.5 sm:space-y-2">
          {breakdownItems.map((item) => {
            const score = breakdown[item.key as keyof MatchBreakdown]
            const contribution = (score * item.weight) / 100
            return (
              <div key={item.key} className="flex items-center justify-between text-xs min-w-0">
                <span className="text-gray-600 break-words pr-2 flex-1 min-w-0">{item.label}:</span>
                <span className="font-medium text-gray-900 flex-shrink-0 whitespace-nowrap">{contribution.toFixed(1)} points</span>
              </div>
            )
          })}
        </div>
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 flex items-center justify-between">
          <span className="text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">Total:</span>
          <span className="text-xs sm:text-sm font-bold text-[#FF5200] whitespace-nowrap">{overallScore}%</span>
        </div>
      </div>
    </div>
  )
}

