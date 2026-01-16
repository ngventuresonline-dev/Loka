'use client'

import { useState } from 'react'

interface SchedulePickerProps {
  value: string
  onChange: (value: string) => void
  minDate?: Date
  className?: string
}

// Generate time slots: 30-minute intervals from 10:00 AM to 6:00 PM
const generateTimeSlots = () => {
  const slots: string[] = []
  for (let hour = 10; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      slots.push(timeString)
    }
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

const formatTimeDisplay = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

export default function SchedulePicker({ value, onChange, minDate, className = '' }: SchedulePickerProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (value) {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0]
        }
      } catch (e) {
        // Invalid date, use today
      }
    }
    const today = minDate || new Date()
    return today.toISOString().split('T')[0]
  })

  const [selectedTime, setSelectedTime] = useState<string>(() => {
    if (value) {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          const hours = date.getHours().toString().padStart(2, '0')
          const minutes = date.getMinutes().toString().padStart(2, '0')
          const timeString = `${hours}:${minutes}`
          // Find closest matching slot
          const closestSlot = TIME_SLOTS.find(slot => slot >= timeString) || TIME_SLOTS[0]
          return closestSlot
        }
      } catch (e) {
        // Invalid date, use first slot
      }
    }
    return TIME_SLOTS[0]
  })

  const [isOpen, setIsOpen] = useState(false)

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    updateDateTime(date, selectedTime)
  }

  const handleTimeChange = (time: string) => {
    setSelectedTime(time)
    updateDateTime(selectedDate, time)
    setIsOpen(false)
  }

  const updateDateTime = (date: string, time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const dateTime = new Date(`${date}T${time}:00`)
    onChange(dateTime.toISOString())
  }

  const getMinDate = () => {
    const today = minDate || new Date()
    return today.toISOString().split('T')[0]
  }

  const getDisplayValue = () => {
    if (!value) return ''
    try {
      const date = new Date(value)
      if (isNaN(date.getTime())) return ''
      const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      const timeStr = formatTimeDisplay(selectedTime)
      return `${dateStr} at ${timeStr}`
    } catch (e) {
      return ''
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5200] bg-white text-left flex items-center justify-between"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {value ? getDisplayValue() : 'Select date and time'}
        </span>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-full max-w-sm">
            {/* Date Picker */}
            <div className="mb-4">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={getMinDate()}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5200]"
              />
            </div>

            {/* Time Picker */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                Select Time (30-minute slots)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {TIME_SLOTS.filter((time) => {
                  // Check if this time slot should be shown
                  const now = new Date()
                  const selectedDateObj = new Date(selectedDate)
                  const isToday = selectedDateObj.toDateString() === now.toDateString()
                  
                  if (!isToday) {
                    // For future dates, show all slots
                    return true
                  }
                  
                  // For today's date, filter out past times and enforce 1-hour minimum gap
                  const [hours, minutes] = time.split(':').map(Number)
                  const slotTime = new Date(now)
                  slotTime.setHours(hours, minutes, 0, 0)
                  
                  // Add 1 hour to current time (minimum booking time)
                  const minBookingTime = new Date(now.getTime() + 60 * 60 * 1000)
                  
                  // Only show slots that are at least 1 hour from now
                  return slotTime >= minBookingTime
                }).map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleTimeChange(time)}
                    className={`px-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors ${
                      selectedTime === time
                        ? 'bg-[#FF5200] text-white border-[#FF5200]'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-[#FF5200]/50 hover:bg-[#FF5200]/5'
                    }`}
                  >
                    {formatTimeDisplay(time)}
                  </button>
                ))}
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-[#FF5200] hover:text-[#E4002B] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

