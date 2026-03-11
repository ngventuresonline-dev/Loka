'use client'

import { useState, useRef, useEffect } from 'react'
import { BANGALORE_AREAS_ADMIN, type BangaloreAreaOption } from '@/lib/location-intelligence/bangalore-areas'

interface AreaSelectComboboxProps {
  value: string
  onChange: (area: string, pincode: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export default function AreaSelectCombobox ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Type or select area',
  className = '',
}: AreaSelectComboboxProps) {
  const [inputValue, setInputValue] = useState(value)
  const [open, setOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const query = inputValue.trim().toLowerCase()
  const filtered: BangaloreAreaOption[] = query
    ? BANGALORE_AREAS_ADMIN.filter(
        (a) =>
          a.label.toLowerCase().includes(query) || a.value.toLowerCase().includes(query)
      )
    : BANGALORE_AREAS_ADMIN

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    setHighlightIndex(0)
  }, [inputValue])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (opt: BangaloreAreaOption) => {
    setInputValue(opt.label)
    onChange(opt.value, opt.pincode)
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((i) => (i + 1) % Math.max(1, filtered.length))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => (i - 1 + filtered.length) % Math.max(1, filtered.length))
      return
    }
    if (e.key === 'Enter' && filtered[highlightIndex]) {
      e.preventDefault()
      handleSelect(filtered[highlightIndex])
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#FF5200] disabled:opacity-50 disabled:cursor-not-allowed"
        autoComplete="off"
      />
      {open && (
        <ul
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-600 bg-gray-800 shadow-lg py-1"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-2 text-gray-400 text-sm">No matching area</li>
          ) : (
            filtered.map((opt, i) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={i === highlightIndex}
                className={`px-4 py-2 cursor-pointer text-sm ${
                  i === highlightIndex ? 'bg-[#FF5200]/20 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
                onMouseEnter={() => setHighlightIndex(i)}
                onClick={() => handleSelect(opt)}
              >
                {opt.label}
                <span className="text-gray-500 text-xs ml-2">({opt.pincode})</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
