'use client'

import React, { useState, useEffect } from 'react'
import { ButtonFlowState, FlowStep, ButtonOption, FLOW_STEPS, isRecommended } from '@/lib/ai-search/button-flow'
import { getIcon } from '@/components/Icons'
import { sendButtonFlowCompletionWebhook } from '@/lib/pabbly-webhook'
// import PropertyCard from './PropertyCard' // Will be used when displaying properties

interface ButtonFlowModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: ButtonFlowState['data']) => void
}

interface ChatMessage {
  id: string
  role: 'assistant' | 'user'
  content: string
  timestamp: Date
  buttons?: ButtonOption[]
  properties?: any[]
}

export default function ButtonFlowModal({ isOpen, onClose, onComplete }: ButtonFlowModalProps) {
  const [state, setState] = useState<ButtonFlowState>({
    currentStep: 'step_0_welcome',
    data: {},
    history: []
  })

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [formData, setFormData] = useState({
    brandName: '',
    contactPerson: '',
    phone: '',
    email: '',
    additionalNotes: ''
  })
  
  // Auto-scroll ref
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 100)
  }

  const currentStepConfig = FLOW_STEPS[state.currentStep]

  // Pre-fill from brandSessionData (if available) when modal opens for brand flow
  useEffect(() => {
    if (!isOpen) return
    if (typeof window === 'undefined') return
    // Avoid overriding if user already interacted in this session
    if (state.data && Object.keys(state.data).length > 0) return

    try {
      const saved = window.localStorage.getItem('brandSessionData')
      if (!saved) return
      const session = JSON.parse(saved) as {
        businessType?: string[] | string
        sizeRange?: { min: number; max: number }
        locations?: string[]
        budgetRange?: { min: number; max: number }
        timeline?: string | null
        contactInfo?: { email?: string; phone?: string }
      }

      // Map display business type to internal enum
      const rawBusinessType = Array.isArray(session.businessType)
        ? session.businessType[0]
        : session.businessType

      const businessTypeMap: Record<string, ButtonFlowState['data']['businessType']> = {
        'Café/QSR': 'cafe_qsr',
        'Cafe/QSR': 'cafe_qsr',
        'Restaurant': 'restaurant',
        'Bar/Brewery': 'bar_brewery',
        'Retail': 'retail_other',
        'Gym': 'gym_wellness',
        'Entertainment': 'entertainment',
        'Others': 'other',
      }

      const mappedBusinessType =
        (rawBusinessType && businessTypeMap[rawBusinessType]) || undefined

      // Map human timeline label to enum
      const timelineMap: Record<string, ButtonFlowState['data']['timeline']> = {
        Immediate: 'immediate',
        '1 month': '1_month',
        '1-2 months': '2_months',
        '2-3 months': '3_months',
        Flexible: 'flexible',
      }

      const mappedTimeline =
        (session.timeline && timelineMap[session.timeline]) || undefined

      setState({
        currentStep: 'step_9_confirmation',
        data: {
          entityType: 'brand',
          businessType: mappedBusinessType,
          sizeRange: session.sizeRange,
          selectedAreas: session.locations || [],
          budgetRange: session.budgetRange,
          timeline: mappedTimeline,
          phone: session.contactInfo?.phone || '',
          email: session.contactInfo?.email || '',
        },
        history: ['step_1_entity_type', 'step_2_business_type', 'step_3_size_range', 'step_4_all_locations', 'step_6_budget_range', 'step_7_timeline'],
      })

      setFormData(prev => ({
        ...prev,
        phone: session.contactInfo?.phone?.replace(/^\+91/, '') || '',
        email: session.contactInfo?.email || '',
      }))
    } catch (e) {
      console.error('[ButtonFlow] Failed to load brandSessionData', e)
    }
  }, [isOpen])

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0 && state.currentStep === 'step_0_welcome') {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Welcome to Lokazen! 👋\n\nI\'ll help you find the perfect commercial space in Bangalore.\n\nLet\'s get started with a few quick questions.',
        timestamp: new Date(),
        buttons: FLOW_STEPS.step_0_welcome.buttons
      }])
    }
  }, [isOpen, state.currentStep])

  // Handle owner flow start message separately
  useEffect(() => {
    if (isOpen && state.currentStep === 'owner_flow_start') {
      const hasOwnerStartMessage = messages.some(msg => msg.id === 'owner_flow_start')
      if (!hasOwnerStartMessage) {
        setMessages(prev => [...prev, {
          id: 'owner_flow_start',
          role: 'assistant',
          content: FLOW_STEPS.owner_flow_start.question.content,
          timestamp: new Date(),
          buttons: FLOW_STEPS.owner_flow_start.buttons
        }])
        setTimeout(() => scrollToBottom(), 300)
      }
    }
  }, [state.currentStep, isOpen])

  // Update messages when step changes (excluding welcome, confirmation, and owner_flow_start)
  useEffect(() => {
    const skipSteps = ['step_0_welcome', 'step_9_confirmation', 'owner_flow_start', 'owner_step_7_confirmation']
    
    if (currentStepConfig && !skipSteps.includes(state.currentStep)) {
      const lastMessage = messages[messages.length - 1]
      if (!lastMessage || lastMessage.role !== 'assistant' || !lastMessage.buttons) {
        setMessages(prev => [...prev, {
          id: state.currentStep,
          role: 'assistant',
          content: currentStepConfig.question.content + (currentStepConfig.question.subtitle ? `\n\n${currentStepConfig.question.subtitle}` : ''),
          timestamp: new Date(),
          buttons: currentStepConfig.buttons
        }])
        // Auto-scroll when new question appears
        setTimeout(() => scrollToBottom(), 300)
      } else {
        // Update existing message
        setMessages(prev => prev.map((msg, idx) => 
          idx === prev.length - 1 ? {
            ...msg,
            content: currentStepConfig.question.content + (currentStepConfig.question.subtitle ? `\n\n${currentStepConfig.question.subtitle}` : ''),
            buttons: currentStepConfig.buttons
          } : msg
        ))
        setTimeout(() => scrollToBottom(), 200)
      }
    }
  }, [state.currentStep, currentStepConfig])

  const handleButtonClick = (button: ButtonOption) => {
    const fieldKey = getFieldKeyForStep(state.currentStep)
    const newData = { ...state.data }

    // Add user message
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      role: 'user',
      content: button.label,
      timestamp: new Date()
    }])
    
    // Auto-scroll after user selection
    scrollToBottom()

    // Special handling: When entity type is selected, clear messages and start fresh flow
    if (state.currentStep === 'step_1_entity_type') {
      newData.entityType = button.value as 'brand' | 'owner'
      const nextStep = button.next || 'step_1_entity_type'
      
      // Clear messages and selected areas when switching flows
      setMessages([])
      setSelectedAreas([])
      
      setState(prev => ({
        ...prev,
        data: newData,
        currentStep: nextStep,
        history: [prev.currentStep] // Start fresh history
      }))
      
      setTimeout(() => scrollToBottom(), 200)
      return
    }

    // Handle multi-select for locations - allow multiple selections (brand flow)
    if (state.currentStep === 'step_4_all_locations') {
      const area = button.value as string
      let updated: string[]
      if (selectedAreas.includes(area)) {
        updated = selectedAreas.filter(a => a !== area)
        setSelectedAreas(updated)
      } else {
        updated = [...selectedAreas, area]
        setSelectedAreas(updated)
      }
      newData.selectedAreas = updated
      setState(prev => ({ ...prev, data: newData }))
      scrollToBottom()
      return
    }

    // Handle multi-select for owner locations
    if (state.currentStep === 'owner_step_2_location') {
      const area = button.value as string
      let updated: string[]
      if (selectedAreas.includes(area)) {
        updated = selectedAreas.filter(a => a !== area)
        setSelectedAreas(updated)
      } else {
        updated = [...selectedAreas, area]
        setSelectedAreas(updated)
      }
      newData.selectedAreas = updated
      setState(prev => ({ ...prev, data: newData }))
      scrollToBottom()
      return
    }

    // Handle multi-select for owner features
    if (state.currentStep === 'owner_step_5_features') {
      const feature = button.value as string
      const currentFeatures = newData.propertyFeatures || []
      let updated: string[]
      if (currentFeatures.includes(feature)) {
        updated = currentFeatures.filter(f => f !== feature)
      } else {
        updated = [...currentFeatures, feature]
      }
      newData.propertyFeatures = updated
      setState(prev => ({ ...prev, data: newData }))
      scrollToBottom()
      return
    }

    // Handle other selections
    if (fieldKey) {
      (newData as any)[fieldKey] = button.value
    }

    const nextStep = button.next || 'step_1_entity_type'

    setState(prev => ({
      ...prev,
      data: newData,
      currentStep: nextStep,
      history: [...prev.history, prev.currentStep]
    }))
    
    // Auto-scroll after button click
    setTimeout(() => scrollToBottom(), 200)
  }

  const handleContinueWithAreas = () => {
    if (selectedAreas.length === 0) return
    
    // Determine next step based on entity type
    const nextStep = state.data.entityType === 'owner' ? 'owner_step_3_size' : 'step_6_budget_range'
    
    setState(prev => ({
      ...prev,
      data: { ...prev.data, selectedAreas },
      currentStep: nextStep,
      history: [...prev.history, prev.currentStep]
    }))
    setTimeout(() => scrollToBottom(), 200)
  }

  const handleBack = () => {
    if (state.history.length > 0) {
      const previousStep = state.history[state.history.length - 1]
      setState(prev => ({
        ...prev,
        currentStep: previousStep,
        history: prev.history.slice(0, -1)
      }))
      if (previousStep !== 'step_4_all_locations') {
        setSelectedAreas([])
      }
      // Remove last user message
      setMessages(prev => prev.slice(0, -1))
    }
  }

  const handleFormSubmit = () => {
    const finalData = {
      ...state.data,
      brandName: formData.brandName,
      contactPerson: formData.contactPerson,
      phone: formData.phone,
      email: formData.email,
      additionalNotes: formData.additionalNotes
    }

    setState(prev => ({
      ...prev,
      data: finalData,
      currentStep: 'step_9_confirmation',
      history: [...prev.history, prev.currentStep]
    }))

    setMessages(prev => [...prev, {
      id: 'form-submitted',
      role: 'user',
      content: `Brand: ${formData.brandName}\nContact: ${formData.contactPerson} (${formData.phone})`,
      timestamp: new Date()
    }])
  }

  const handleConfirm = () => {
    // Send webhook to Pabbly
    sendButtonFlowCompletionWebhook({
      // Spread raw state first so we can override any conflicting fields below
      ...state.data,
      entityType: state.data.entityType || 'brand',
      businessType: state.data.businessType,
      selectedAreas: state.data.selectedAreas || selectedAreas,
      // Ensure we only send structured range objects, not string literals like "custom" / "land"
      sizeRange: (
        state.data.sizeRange && typeof state.data.sizeRange === 'object'
          ? { min: (state.data.sizeRange as any).min, max: (state.data.sizeRange as any).max }
          : undefined
      ) as { min: number; max: number } | undefined,
      budgetRange: (
        state.data.budgetRange && typeof state.data.budgetRange === 'object'
          ? { min: (state.data.budgetRange as any).min, max: (state.data.budgetRange as any).max }
          : undefined
      ) as { min: number; max: number } | undefined,
      brandName: formData.brandName,
      contactPerson: formData.contactPerson,
      phone: formData.phone,
      email: formData.email,
      additionalNotes: formData.additionalNotes,
    }).catch(err => console.warn('Failed to send button flow webhook:', err))
    
    // Handle owner flow completion
    if (state.data.entityType === 'owner') {
      onComplete(state.data)
      return
    }
    // Handle brand flow completion
    onComplete(state.data)
  }

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setState({
        currentStep: 'step_0_welcome',
        data: {},
        history: []
      })
      setSelectedAreas([])
      setMessages([])
      setFormData({
        brandName: '',
        contactPerson: '',
        phone: '',
        email: '',
        additionalNotes: ''
      })
    }
  }, [isOpen])

  if (!isOpen) return null

  // Render confirmation for brand flow
  if (state.currentStep === 'step_9_confirmation') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="relative w-full max-w-5xl h-[90vh] mx-4 bg-gradient-to-br from-gray-900 via-gray-900 to-black rounded-2xl shadow-2xl border border-[#FF5200]/30 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#FF5200]/20 bg-black/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] flex items-center justify-center shadow-[0_0_20px_rgba(255,82,0,0.5)]">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Find your perfect match</h2>
                <p className="text-sm text-slate-400">AI-powered property discovery</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-[#FF5200]/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                )}
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                  <div className={`rounded-2xl px-4 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-[#FF5200] to-[#E4002B] text-white' 
                      : 'bg-gray-800/50 text-gray-100 border border-gray-700'
                  }`}>
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 order-3">
                    <span className="text-white text-xs">U</span>
                  </div>
                )}
              </div>
            ))}

            {/* Summary */}
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="max-w-[80%] bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4">Review Your Details:</h3>
                <div className="space-y-3">
                  <SummarySection label="Business Type" value={getBusinessTypeLabel(state.data.businessType)} />
                  <SummarySection label="Space Size" value={getSizeLabel(state.data.sizeRange)} />
                  <SummarySection label="Locations" value={state.data.selectedAreas?.join(', ') || 'Not selected'} />
                  <SummarySection label="Budget" value={getBudgetLabel(state.data.budgetRange)} />
                  <SummarySection label="Timeline" value={getTimelineLabel(state.data.timeline)} />
                </div>
                  <div className="flex gap-4 pt-6">
                    <button
                      onClick={handleConfirm}
                      className="flex-1 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white py-3 rounded-lg font-semibold hover:shadow-[0_0_20px_rgba(255,82,0,0.5)] transition-all"
                    >
                      Looks Good! Find Matches
                    </button>
                    <button
                      onClick={() => setState(prev => ({ ...prev, currentStep: 'step_1_entity_type', history: [] }))}
                      className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                    >
                      Make Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
  }

  // Render confirmation for owner flow
  if (state.currentStep === 'owner_step_7_confirmation') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="relative w-full max-w-5xl h-[90vh] mx-4 bg-gradient-to-br from-gray-900 via-gray-900 to-black rounded-2xl shadow-2xl border border-[#FF5200]/30 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#FF5200]/20 bg-black/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] flex items-center justify-center shadow-[0_0_20px_rgba(255,82,0,0.5)]">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">List Your Property</h2>
                <p className="text-sm text-slate-400">AI-powered property listing</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-[#FF5200]/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                )}
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                  <div className={`rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-[#FF5200] to-[#E4002B] text-white'
                      : 'bg-gray-800/50 text-gray-100 border border-gray-700'
                  }`}>
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 order-3">
                    <span className="text-white text-xs">U</span>
                  </div>
                )}
              </div>
            ))}

            {/* Summary */}
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF5200] to-[#E4002B] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="max-w-[80%] bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4">Review Your Property Details:</h3>
                <div className="space-y-3">
                  <SummarySection label="Property Type" value={getPropertyTypeLabel(state.data.propertyType)} />
                  <SummarySection label="Property Size" value={getSizeLabel(state.data.sizeRange)} />
                  <SummarySection label="Locations" value={state.data.selectedAreas?.join(', ') || 'Not selected'} />
                  <SummarySection label="Expected Rent" value={getBudgetLabel(state.data.budgetRange)} />
                  <SummarySection label="Features" value={state.data.propertyFeatures?.join(', ') || 'None selected'} />
                  <SummarySection label="Availability" value={getTimelineLabel(state.data.availability)} />
                </div>
                <div className="flex gap-4 pt-6">
                  <button
                    onClick={handleConfirm}
                    className="flex-1 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white py-3 rounded-lg font-semibold hover:shadow-[0_0_20px_rgba(255,82,0,0.5)] transition-all"
                  >
                    Looks Good! List Property
                  </button>
                  <button
                    onClick={() => setState(prev => ({ ...prev, currentStep: 'owner_flow_start', history: [] }))}
                    className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                  >
                    Make Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main chat interface - Futuristic Platform Performance style
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      {/* Animated scan line effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#FF5200]/50 to-transparent animate-[scan_4s_ease-in-out_infinite]"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#E4002B]/50 to-transparent animate-[scan_4s_ease-in-out_infinite_2s]"></div>
      </div>
      
      <div className="relative w-full max-w-5xl h-[90vh] mx-4 bg-gradient-to-br from-gray-800/60 via-gray-900/60 to-black/80 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-[#FF5200]/30 flex flex-col overflow-hidden">
        {/* Animated glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200]/10 via-[#E4002B]/5 to-transparent opacity-50"></div>
        
        {/* Header - Futuristic */}
        <div className="relative flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-[#FF5200]/20 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#FF5200] to-[#E4002B] flex items-center justify-center shadow-[0_0_20px_rgba(255,82,0,0.6)] group-hover:scale-110 transition-transform">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#FF5200]/40 to-transparent animate-pulse"></div>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF5200] to-[#E4002B]">Find your perfect match</h2>
              <p className="text-[10px] sm:text-xs text-gray-400 font-medium">AI-powered property discovery</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-[#FF5200]/20 hover:border border-[#FF5200]/30">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Chat Messages - Glassmorphism style */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 relative z-10">
          {messages.map((msg, idx) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF5200] to-[#E4002B] flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(255,82,0,0.5)]">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#FF5200]/40 to-transparent animate-pulse"></div>
                  <svg className="w-3.5 h-3.5 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              )}
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                <div className={`rounded-xl px-3 py-2 backdrop-blur-sm ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-[#FF5200] to-[#E4002B] text-white shadow-[0_0_20px_rgba(255,82,0,0.4)] border border-[#FF5200]/50' 
                    : 'bg-gray-800/40 text-gray-100 border border-[#FF5200]/20 backdrop-blur-xl'
                }`}>
                  <p className="whitespace-pre-line text-sm leading-relaxed">{msg.content}</p>
                </div>
                {msg.buttons && msg.buttons.length > 0 && (
                  <div className={`mt-2 grid gap-2 ${
                    state.currentStep === 'step_4_all_locations' || state.currentStep === 'owner_step_2_location'
                      ? 'grid-cols-1 sm:grid-cols-2' 
                      : state.currentStep === 'step_2_business_type' || state.currentStep === 'owner_step_1_property_type'
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : state.currentStep === 'owner_step_5_features'
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-1'
                  }`}>
                    {msg.buttons.map(btn => {
                      const recommended = isRecommended(btn, state.data.businessType)
                      const isSelected = 
                        (state.currentStep === 'step_4_all_locations' && selectedAreas.includes(btn.value as string)) ||
                        (state.currentStep === 'owner_step_2_location' && selectedAreas.includes(btn.value as string)) ||
                        (state.currentStep === 'owner_step_5_features' && state.data.propertyFeatures?.includes(btn.value as string))
                      return (
                        <button
                          key={btn.id}
                          onClick={() => handleButtonClick(btn)}
                          className={`relative w-full px-4 py-3 rounded-lg text-left transition-all duration-300 group overflow-hidden ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white shadow-[0_0_15px_rgba(255,82,0,0.6)] border-2 border-[#FF5200]'
                              : recommended
                              ? 'bg-gradient-to-r from-gray-800/60 to-gray-700/60 backdrop-blur-sm border-2 border-[#FF5200]/40 text-white hover:border-[#FF5200] hover:shadow-[0_0_15px_rgba(255,82,0,0.4)]'
                              : 'bg-gradient-to-r from-gray-800/40 to-gray-700/40 backdrop-blur-sm border border-[#FF5200]/20 text-white hover:border-[#FF5200]/50 hover:shadow-[0_0_10px_rgba(255,82,0,0.3)]'
                          }`}
                        >
                          {/* Animated glow on hover */}
                          <div className="absolute inset-0 bg-gradient-to-br from-[#FF5200]/20 via-[#E4002B]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative z-10 flex items-center gap-2">
                            {btn.icon && (() => {
                              const IconComponent = getIcon(btn.icon)
                              return <IconComponent className={`w-4 h-4 group-hover:scale-110 transition-transform flex-shrink-0 ${isSelected ? 'animate-pulse' : ''}`} />
                            })()}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm flex items-center gap-1.5 whitespace-nowrap">
                                <span>{btn.label}</span>
                                {isSelected && (
                                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              {btn.sublabel && <div className={`text-xs mt-0.5 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>{btn.sublabel}</div>}
                              {recommended && !isSelected && (
                                <svg className="w-3 h-3 text-[#FF5200] mt-0.5 inline-block" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              )}
                            </div>
                          </div>
                          {/* Pulse ring effect */}
                          {isSelected && (
                            <div className="absolute inset-0 rounded-lg border-2 border-[#FF5200] animate-ping opacity-20"></div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-gray-700/60 backdrop-blur-sm border border-gray-600/50 flex items-center justify-center flex-shrink-0 order-3">
                  <span className="text-white text-xs font-medium">U</span>
                </div>
              )}
            </div>
          ))}
          
            {/* Continue button for multi-select locations (brand flow) */}
            {state.currentStep === 'step_4_all_locations' && selectedAreas.length > 0 && (
              <div className="flex justify-start">
                <div className="w-8 h-8 flex-shrink-0"></div>
                <div className="max-w-[75%]">
                  <button
                    onClick={handleContinueWithAreas}
                    className="bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white py-2.5 px-6 rounded-lg font-semibold hover:shadow-[0_0_20px_rgba(255,82,0,0.6)] transition-all text-sm"
                  >
                    Continue with {selectedAreas.length} {selectedAreas.length === 1 ? 'location' : 'locations'}
                  </button>
                </div>
              </div>
            )}

            {/* Continue button for multi-select locations (owner flow) */}
            {state.currentStep === 'owner_step_2_location' && selectedAreas.length > 0 && (
              <div className="flex justify-start">
                <div className="w-8 h-8 flex-shrink-0"></div>
                <div className="max-w-[75%]">
                  <button
                    onClick={handleContinueWithAreas}
                    className="bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white py-2.5 px-6 rounded-lg font-semibold hover:shadow-[0_0_20px_rgba(255,82,0,0.6)] transition-all text-sm"
                  >
                    Continue with {selectedAreas.length} {selectedAreas.length === 1 ? 'location' : 'locations'}
                  </button>
                </div>
              </div>
            )}

            {/* Continue button for multi-select features (owner flow) */}
            {state.currentStep === 'owner_step_5_features' && (state.data.propertyFeatures?.length || 0) > 0 && (
              <div className="flex justify-start">
                <div className="w-8 h-8 flex-shrink-0"></div>
                <div className="max-w-[75%]">
                  <button
                    onClick={() => {
                      setState(prev => ({
                        ...prev,
                        currentStep: 'owner_step_6_availability',
                        history: [...prev.history, prev.currentStep]
                      }))
                      setTimeout(() => scrollToBottom(), 200)
                    }}
                    className="bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white py-2.5 px-6 rounded-lg font-semibold hover:shadow-[0_0_20px_rgba(255,82,0,0.6)] transition-all text-sm"
                  >
                    Continue with {state.data.propertyFeatures?.length || 0} {state.data.propertyFeatures?.length === 1 ? 'feature' : 'features'}
                  </button>
                </div>
              </div>
            )}
          
          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} className="h-1" />

          {/* Back button */}
          {state.history.length > 0 && (
            <div className="flex justify-start gap-2 sm:gap-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0"></div>
              <div className="max-w-[85%] sm:max-w-[80%]">
                <button
                  onClick={handleBack}
                  className="text-[#FF5200] hover:text-[#E4002B] flex items-center gap-2 transition-colors text-xs sm:text-sm"
                >
                  ← Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SummarySection({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-300">{label}</span>
      </div>
      <span className="text-white font-semibold">{value}</span>
    </div>
  )
}

function getFieldKeyForStep(step: string): string | null {
  const mapping: Record<string, string> = {
    'step_1_entity_type': 'entityType',
    'step_2_business_type': 'businessType',
    'step_3_size_range': 'sizeRange',
    'step_4_all_locations': 'selectedAreas',
    'step_6_budget_range': 'budgetRange',
    'step_7_timeline': 'timeline',
    // Owner flow mappings
    'owner_step_1_property_type': 'propertyType',
    'owner_step_2_location': 'selectedAreas',
    'owner_step_3_size': 'sizeRange',
    'owner_step_4_rent': 'budgetRange',
    'owner_step_5_features': 'propertyFeatures',
    'owner_step_6_availability': 'availability'
  }
  return mapping[step] || null
}

function getBusinessTypeLabel(type?: string): string {
  const labels: Record<string, string> = {
    'cafe_qsr': 'Café / QSR',
    'restaurant': 'Restaurant',
    'bar_brewery': 'Bar / Brewery',
    'cloud_kitchen': 'Cloud Kitchen',
    'retail_fashion': 'Fashion Retail',
    'retail_other': 'Other Retail',
    'gym_wellness': 'Gym / Wellness',
    'entertainment': 'Entertainment',
    'other': 'Other'
  }
  return labels[type || ''] || 'Not selected'
}

function getSizeLabel(size?: any): string {
  if (!size) return 'Not selected'
  if (typeof size === 'object' && size.min && size.max) {
    return `${size.min.toLocaleString()} - ${size.max.toLocaleString()} sqft`
  }
  return 'Custom'
}

function getBudgetLabel(budget?: any): string {
  if (!budget) return 'Not selected'
  if (budget === 'flexible') return 'Flexible / Negotiable'
  if (typeof budget === 'object' && budget.min && budget.max) {
    const format = (n: number) => {
      if (n >= 1000000) return `₹${n / 100000}L`
      if (n >= 1000) return `₹${n / 1000}K`
      return `₹${n}`
    }
    return `${format(budget.min)} - ${format(budget.max)} per month`
  }
  return 'Not selected'
}

function getTimelineLabel(timeline?: string): string {
  const labels: Record<string, string> = {
    'immediate': 'Immediately',
    '1_month': 'Within 1 month',
    '2_months': '1-2 months',
    '3_months': '2-3 months',
    'flexible': 'Flexible timeline'
  }
  return labels[timeline || ''] || 'Not selected'
}

function getPropertyTypeLabel(type?: string): string {
  const labels: Record<string, string> = {
    'retail': 'Retail Space',
    'restaurant': 'Restaurant Space',
    'office': 'Office Space',
    'warehouse': 'Warehouse / Storage',
    'mixed': 'Mixed Use',
    'land': 'Land / Plot'
  }
  return labels[type || ''] || 'Not selected'
}
