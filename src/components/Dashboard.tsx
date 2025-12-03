'use client'

import { useState, useEffect } from 'react'
import { BrandProfile, OwnerProfile, Property, MatchResult } from '@/types/workflow'
import { MatchingEngine } from '@/lib/matching-engine'

interface DashboardProps {
  userType: 'brand' | 'owner'
  userProfile: BrandProfile | OwnerProfile
  properties?: Property[]
}

export default function Dashboard({ userType, userProfile, properties = [] }: DashboardProps) {
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null)

  useEffect(() => {
    const generateMatches = async () => {
      setLoading(true)
      try {
        const matchingEngine = new MatchingEngine()
        
        if (userType === 'brand' && properties.length > 0) {
          const brandMatches = matchingEngine.findTopMatches(userProfile as BrandProfile, properties)
          setMatches(brandMatches)
        } else if (userType === 'owner') {
          // For demo purposes, we'll create some mock brand profiles
          const mockBrands: BrandProfile[] = [
            {
              companyName: 'Urban Coffee Co.',
              industry: 'Food & Beverage',
              companySize: 'small',
              preferredLocations: ['New York', 'Manhattan'],
              budgetRange: { min: 5000, max: 15000, currency: 'USD' },
              locationFlexibility: 'flexible',
              requirements: {
                minSize: 1200,
                maxSize: 2500,
                propertyTypes: ['retail', 'restaurant'],
                mustHaveAmenities: ['Kitchen', 'Parking'],
                niceToHaveAmenities: ['Outdoor Seating']
              },
              targetDemographics: ['young professionals', 'students'],
              crmRecord: {
                id: 'crm-001',
                userId: 'brand-001',
                userType: 'brand',
                details: {},
                timestamp: new Date(),
    
                   activity: 'onboarding'
               
              },
              // Required fields
              email: 'contact@urbancoffee.com',
              phone: '+1-555-0123',
              contactPerson: 'John Smith',
              leaseLength: 'long_term',
              expectedFootfall: 'high',
              operatingHours: '7 AM - 10 PM',
              accessibility: true
            }
          ]
          
          const ownerProperties = (userProfile as OwnerProfile).properties || []
          if (ownerProperties.length > 0) {
            const propertyMatches = matchingEngine.calculatePropertyFitIndex(ownerProperties[0], mockBrands)
            setMatches(propertyMatches)
          }
        }
      } catch (error) {
        console.error('Error generating matches:', error)
      } finally {
        setLoading(false)
      }
    }

    generateMatches()
  }, [userType, userProfile, properties])

  const handleContactBrand = (match: MatchResult) => {
    // In a real app, this would open a contact form or messaging system
    alert(`Contacting brand for match ${match.id}`)
  }

  const handleSaveProperty = (match: MatchResult) => {
    // In a real app, this would save to user's favorites
    alert(`Property saved! Match score: ${match.score}%`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-blue-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Finding your perfect matches...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-blue-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                {userType === 'brand' ? 'Property Matches' : 'Brand Matches'}
              </h1>
              <p className="text-gray-400 mt-2">
                {userType === 'brand' 
                  ? 'Properties that match your requirements' 
                  : 'Brands interested in your properties'
                }
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{matches.length}</div>
              <div className="text-sm text-gray-400">Top Matches</div>
            </div>
          </div>
        </div>

        {matches.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No matches found</h3>
            <p className="text-gray-400 mb-6">
              {userType === 'brand' 
                ? 'No properties match your current criteria. Try adjusting your preferences.'
                : 'No brands are currently looking for properties like yours.'
              }
            </p>
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all">
              Update Preferences
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {matches.map((match, index) => (
              <div key={match.id} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all group">
                {/* Match Score Badge */}
                <div className="relative">
                  <div className="absolute top-4 right-4 z-10">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      match.score >= 80 
                        ? 'bg-green-500 text-white' 
                        : match.score >= 60 
                        ? 'bg-yellow-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}>
                      {match.score}% Match
                    </div>
                  </div>
                  
                  {/* Rank Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      #{index + 1}
                    </div>
                  </div>

                  {/* Property/Brand Image Placeholder */}
                  <div className="h-48 bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <svg className="w-16 h-16 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {userType === 'brand' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      )}
                    </svg>
                  </div>
                </div>

                <div className="p-6">
                  {/* Property/Brand Info */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {userType === 'brand' 
                        ? `Property ${match.propertyId}` 
                        : 'Urban Coffee Co.'
                      }
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {userType === 'brand' 
                        ? 'Prime retail location in downtown Manhattan'
                        : 'Looking for 1200-2500 sq ft restaurant space'
                      }
                    </p>
                  </div>

                  {/* Match Breakdown */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Location</span>
                      <div className="flex items-center">
                        <div className="w-16 bg-white/10 rounded-full h-2 mr-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                            style={{ width: `${match.breakdown.locationMatch}%` }}
                          />
                        </div>
                        <span className="text-sm text-white w-8">{match.breakdown.locationMatch}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Budget</span>
                      <div className="flex items-center">
                        <div className="w-16 bg-white/10 rounded-full h-2 mr-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                            style={{ width: `${match.breakdown.budgetMatch}%` }}
                          />
                        </div>
                        <span className="text-sm text-white w-8">{match.breakdown.budgetMatch}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Size</span>
                      <div className="flex items-center">
                        <div className="w-16 bg-white/10 rounded-full h-2 mr-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                            style={{ width: `${match.breakdown.sizeMatch}%` }}
                          />
                        </div>
                        <span className="text-sm text-white w-8">{match.breakdown.sizeMatch}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Match Reasons */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Why it's a great match:</h4>
                    <ul className="space-y-1">
                      {match.reasons.slice(0, 3).map((reason, idx) => (
                        <li key={idx} className="text-xs text-gray-400 flex items-start">
                          <svg className="w-3 h-3 text-green-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => userType === 'brand' ? handleSaveProperty(match) : handleContactBrand(match)}
                      className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all text-sm font-medium"
                    >
                      {userType === 'brand' ? 'Save Property' : 'Contact Brand'}
                    </button>
                    <button
                      onClick={() => setSelectedMatch(match)}
                      className="py-2 px-4 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-all text-sm font-medium"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Premium Upgrade CTA */}
        <div className="mt-12 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Unlock Unlimited Matches
            </h3>
            <p className="text-gray-400 mb-6">
              Get access to our full database of {userType === 'brand' ? 'properties' : 'brands'}, 
              advanced filtering, and direct messaging.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all font-medium">
                Upgrade to Premium
              </button>
              <button className="px-8 py-3 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-all font-medium">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Match Details Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-white/10 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-white">Match Details</h3>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-white mb-2">Overall Match Score</h4>
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {selectedMatch.score}%
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-white mb-3">Detailed Breakdown</h4>
                  <div className="space-y-3">
                    {Object.entries(selectedMatch.breakdown).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-white/10 rounded-full h-2 mr-3">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                              style={{ width: `${value}%` }}
                            />
                          </div>
                          <span className="text-white w-10">{value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-white mb-3">Match Reasons</h4>
                  <ul className="space-y-2">
                    {selectedMatch.reasons.map((reason, idx) => (
                      <li key={idx} className="text-gray-400 flex items-start">
                        <svg className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
                <button
                  onClick={() => userType === 'brand' ? handleSaveProperty(selectedMatch) : handleContactBrand(selectedMatch)}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all font-medium"
                >
                  {userType === 'brand' ? 'Save Property' : 'Contact Brand'}
                </button>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="py-3 px-6 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-all font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}