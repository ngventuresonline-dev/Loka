'use client'

import { useState, useRef, useEffect } from 'react'
import PropertyCard from './PropertyCard'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  properties?: any[]
  timestamp: Date
  isStreaming?: boolean
}

interface AiSearchModalProps {
  isOpen: boolean
  onClose: () => void
  initialQuery?: string
}

export default function AiSearchModal({ isOpen, onClose, initialQuery = '' }: AiSearchModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && initialQuery && messages.length === 0) {
      handleSearch(initialQuery)
    }
  }, [isOpen, initialQuery])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const handleSearch = async (query: string) => {
    if (!query.trim()) return

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Add a "thinking" message
    const thinkingMessage: Message = {
      id: `thinking-${Date.now()}`,
      role: 'assistant',
      content: 'Let me help you with that...',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, thinkingMessage])

    try {
      // Get user type from session if available
      let userType: 'brand' | 'owner' | null = null
      try {
        const sessionJson = localStorage.getItem('ngventures_session')
        if (sessionJson) {
          const session = JSON.parse(sessionJson)
          if (session.userType === 'brand' || session.userType === 'owner') {
            userType = session.userType
          }
        }
      } catch (e) {
        // Ignore errors getting user type
      }

      // Build conversation history for context (only actual messages, not thinking/loading states)
      const conversationHistory = messages
        .filter(m => (m.role === 'assistant' || m.role === 'user') && !m.id.includes('thinking'))
        .map(m => `${m.role}: ${m.content}`)
        .join('\n')
      
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query, 
          userId: userType ? `user-${userType}` : 'guest',
          userType: userType,
          conversationHistory 
        })
      })

      const data = await response.json()

      // Remove thinking message
      setMessages(prev => prev.filter(m => m.id !== thinkingMessage.id))

      // Create assistant message with streaming
      const assistantMessageId = `assistant-${Date.now()}`
      const fullText = data.message || data.error || 'No response from server'
      const properties = data.properties || []

      // Add empty message that will be streamed
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true
      }])
      setStreamingMessageId(assistantMessageId)

      // Stream text character by character
      let currentText = ''
      for (let i = 0; i < fullText.length; i++) {
        currentText += fullText[i]
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: currentText }
            : msg
        ))
        // Adjust delay for streaming speed (lower = faster)
        await new Promise(resolve => setTimeout(resolve, 15))
      }

      // After streaming is complete, add properties
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, properties, isStreaming: false }
          : msg
      ))
      setStreamingMessageId(null)

    } catch (error) {
      console.error('Search error:', error)
      // Remove thinking message
      setMessages(prev => prev.filter(m => m.id !== thinkingMessage.id))
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(inputValue)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl h-[85vh] mx-4 bg-gradient-to-br from-gray-900 via-gray-900 to-black rounded-2xl shadow-2xl border border-[#FF5200]/30 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#FF5200]/20 bg-black/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] flex items-center justify-center shadow-[0_0_20px_rgba(255,82,0,0.5)]">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Property Search</h2>
              <p className="text-sm text-slate-400">Find your perfect commercial space</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-[#FF5200]/20"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(255,82,0,0.6)]">
                <span className="text-4xl">🏢</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Start Your Search</h3>
              <p className="text-gray-400 max-w-md">
                Tell me what you're looking for. I can help you find retail spaces, restaurants, offices, and more!
              </p>
              <div className="mt-6 space-y-2">
                <button
                  onClick={() => handleSearch('Show me retail spaces in Bangalore')}
                  className="block w-full px-4 py-2 bg-gray-800/50 hover:bg-[#FF5200]/20 border border-gray-700 hover:border-[#FF5200]/50 text-white rounded-lg transition-all text-sm"
                >
                  💡 Show me retail spaces in Bangalore
                </button>
                <button
                  onClick={() => handleSearch('Looking for restaurant space in Koramangala')}
                  className="block w-full px-4 py-2 bg-gray-800/50 hover:bg-[#FF5200]/20 border border-gray-700 hover:border-[#FF5200]/50 text-white rounded-lg transition-all text-sm"
                >
                  💡 Looking for restaurant space in Koramangala
                </button>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                {/* Message Bubble */}
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-[#FF5200] to-[#E4002B] text-white shadow-[0_0_20px_rgba(255,82,0,0.3)]'
                      : 'bg-gray-800/80 text-white border border-gray-700/50'
                  }`}
                >
                  <div 
                    className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: message.content }}
                  />
                </div>

                {/* Property Cards */}
                {message.properties && message.properties.length > 0 && !message.isStreaming && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {message.properties.map((property) => (
                      <div
                        key={property.id}
                        className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 hover:border-[#FF5200] hover:shadow-[0_0_20px_rgba(255,82,0,0.2)] transition-all group"
                      >
                        {/* Property Image */}
                        <div className="relative h-48 bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden">
                          {property.images && property.images.length > 0 ? (
                            <img 
                              src={property.images[0]} 
                              alt={property.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=60'
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-6xl opacity-30">🏢</span>
                            </div>
                          )}
                          <div className="absolute top-3 right-3">
                            <span className="px-3 py-1 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white text-xs rounded-full font-semibold shadow-[0_0_10px_rgba(255,82,0,0.6)]">
                              {property.propertyType}
                            </span>
                          </div>
                          {property.isFeatured && (
                            <div className="absolute top-3 left-3">
                              <span className="px-2 py-1 bg-yellow-500 text-black text-xs rounded-full font-bold">
                                ⭐ Featured
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Property Details */}
                        <div className="p-4">
                          <h4 className="text-lg font-bold text-white mb-2 line-clamp-1">{property.title}</h4>
                          <p className="text-sm text-gray-400 mb-3 line-clamp-2">{property.description}</p>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                            <div className="text-gray-300 flex items-center gap-1">
                              <span>📍</span>
                              <span className="truncate">{property.city}</span>
                            </div>
                            <div className="text-gray-300 flex items-center gap-1">
                              <span>📏</span>
                              <span>{property.size} sqft</span>
                            </div>
                            <div className="text-[#FF6B35] font-bold flex items-center gap-1 col-span-2">
                              <span>💰</span>
                              <span>₹{property.price.toLocaleString()}/{property.priceType}</span>
                            </div>
                          </div>

                          {property.amenities && property.amenities.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-1">
                              {property.amenities.slice(0, 3).map((amenity: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-gray-700/50 text-gray-300 text-xs rounded border border-gray-600/50"
                                >
                                  {amenity}
                                </span>
                              ))}
                              {property.amenities.length > 3 && (
                                <span className="px-2 py-0.5 text-gray-400 text-xs">
                                  +{property.amenities.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          <button className="w-full px-4 py-2 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-lg hover:shadow-[0_0_20px_rgba(255,82,0,0.5)] transition-all text-sm font-semibold">
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800/80 border border-gray-700/50 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[#FF5200] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-[#E4002B] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-[#FF6B35] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-gray-400">Searching properties...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 border-t border-[#FF5200]/20 bg-black/50">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Describe what you're looking for..."
              className="flex-1 px-4 py-3 bg-gray-900/50 text-white rounded-xl border border-gray-700 focus:border-[#FF5200] focus:outline-none focus:ring-2 focus:ring-[#FF5200]/20 transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="px-6 py-3 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(255,82,0,0.5)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Search'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
