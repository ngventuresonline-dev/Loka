'use client'

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface AnalyticsChartsProps {
  userRegistrations: { date: string; count: number }[]
  propertyListings: { date: string; count: number }[]
  inquiryCreation: { date: string; count: number }[]
  topLocations: { location: string; count: number }[]
  propertyTypes: { type: string; count: number }[]
  brandOwnerRatio: { brands: number; owners: number; admins: number }
  searchAnalytics: {
    totalSearches: number
    buttonFlow: number
    textSearch: number
    averageResults: number
    conversionRate: number
  }
  inquiriesByStatus?: Record<string, number>
}

const COLORS = ['#FF5722', '#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#F44336']

export default function AnalyticsCharts({
  userRegistrations,
  propertyListings,
  inquiryCreation,
  topLocations,
  propertyTypes,
  brandOwnerRatio,
  searchAnalytics,
  inquiriesByStatus = {}
}: AnalyticsChartsProps) {
  const pieData = [
    { name: 'Brands', value: brandOwnerRatio.brands },
    { name: 'Owners', value: brandOwnerRatio.owners },
    { name: 'Admins', value: brandOwnerRatio.admins }
  ]

  const inquiryStatusData = [
    { name: 'Pending', value: inquiriesByStatus.pending || 0 },
    { name: 'Responded', value: inquiriesByStatus.responded || 0 },
    { name: 'Closed', value: inquiriesByStatus.closed || 0 }
  ]

  return (
    <div className="space-y-6">
      {/* User Registrations */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">User Registrations Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={userRegistrations}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#FF5722" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Property Listings */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Property Listings Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={propertyListings}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#4CAF50" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Inquiry Creation */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Inquiries Created Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={inquiryCreation}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
            <Legend />
            <Bar dataKey="count" fill="#2196F3" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Locations */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Locations</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topLocations}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="location" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#FF5722" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Brand vs Owner Ratio */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Brand vs Owner Ratio</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inquiries by Status */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Inquiries by Status</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={inquiryStatusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {inquiryStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Search Analytics */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Search Analytics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Total Searches</p>
            <p className="text-2xl font-bold text-white mt-1">{searchAnalytics.totalSearches}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Button Flow</p>
            <p className="text-2xl font-bold text-white mt-1">{searchAnalytics.buttonFlow}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Text Search</p>
            <p className="text-2xl font-bold text-white mt-1">{searchAnalytics.textSearch}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Conversion Rate</p>
            <p className="text-2xl font-bold text-white mt-1">{searchAnalytics.conversionRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}

