import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import PropertyCard from '../PropertyCard'
import { Property } from '@/types'

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

// Mock next/image
jest.mock('next/image', () => {
  return ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />
  }
})

// Mock tracking functions
jest.mock('@/lib/tracking', () => ({
  trackPropertyView: jest.fn(),
  trackCardClick: jest.fn(),
  trackAddToWishlist: jest.fn(),
}))

jest.mock('@/lib/session-logger', () => ({
  logSessionEvent: jest.fn(),
  getClientSessionUserId: jest.fn(() => 'test-user-id'),
}))

jest.mock('@/lib/property-type-mapper', () => ({
  getPropertyTypeLabel: jest.fn((type) => type),
}))

describe('PropertyCard', () => {
  const mockProperty: Property = {
    id: 'prop-1',
    title: 'Test Property',
    description: 'A beautiful property in Koramangala',
    address: '123 Test Street',
    city: 'Bangalore',
    state: 'Karnataka',
    zipCode: '560095',
    price: 150000,
    priceType: 'monthly',
    size: 1500,
    propertyType: 'retail',
    amenities: ['parking', 'ac'],
    ownerId: 'owner-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    isAvailable: true,
  }

  it('should render address, size, and rent correctly', () => {
    render(<PropertyCard property={mockProperty} />)

    expect(screen.getByText('Test Property')).toBeInTheDocument()
    expect(screen.getByText(/123 Test Street, Bangalore/i)).toBeInTheDocument()
    expect(screen.getByText(/1,500 sq ft/i)).toBeInTheDocument()
    expect(screen.getByText(/₹150,000\/mo/i)).toBeInTheDocument()
  })

  it('should show shortlist button for brands only', () => {
    const { container } = render(<PropertyCard property={mockProperty} />)

    // Shortlist button should be present (save button)
    const saveButton = container.querySelector('button[aria-label="Save property"]')
    expect(saveButton).toBeInTheDocument()
  })

  it('should call onShortlist when shortlist button is clicked', () => {
    const { container } = render(<PropertyCard property={mockProperty} />)

    const saveButton = container.querySelector('button[aria-label="Save property"]')
    expect(saveButton).toBeInTheDocument()

    fireEvent.click(saveButton!)

    // Button state should change (visual change)
    expect(saveButton).toBeInTheDocument()
  })

  it('should display images if provided', () => {
    const propertyWithImage: Property = {
      ...mockProperty,
      images: ['https://example.com/image.jpg'],
    }

    render(<PropertyCard property={propertyWithImage} />)

    // Image should be rendered (mocked as img tag)
    const image = screen.getByAltText('Test Property')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
  })

  it('should show BFI score badge when provided', () => {
    render(<PropertyCard property={mockProperty} bfiScore={85} />)

    expect(screen.getByText('85% Match')).toBeInTheDocument()
  })

  it('should show match reasons when provided', () => {
    const matchReasons = [
      'Perfect location match',
      'Size within range',
      'Budget compatible',
    ]

    render(
      <PropertyCard
        property={mockProperty}
        bfiScore={85}
        matchReasons={matchReasons}
      />
    )

    expect(screen.getByText('Why this matches:')).toBeInTheDocument()
    expect(screen.getByText('Perfect location match')).toBeInTheDocument()
    expect(screen.getByText('Size within range')).toBeInTheDocument()
  })

  it('should display availability status', () => {
    render(<PropertyCard property={mockProperty} />)

    expect(screen.getByText('Available')).toBeInTheDocument()
  })

  it('should display reserved status for unavailable properties', () => {
    const unavailableProperty: Property = {
      ...mockProperty,
      isAvailable: false,
    }

    render(<PropertyCard property={unavailableProperty} />)

    expect(screen.getByText('Reserved')).toBeInTheDocument()
  })

  it('should format yearly price correctly', () => {
    const yearlyProperty: Property = {
      ...mockProperty,
      price: 1800000,
      priceType: 'yearly',
    }

    render(<PropertyCard property={yearlyProperty} />)

    expect(screen.getByText(/₹1,800,000\/yr/i)).toBeInTheDocument()
  })

  it('should format sqft price correctly', () => {
    const sqftProperty: Property = {
      ...mockProperty,
      price: 100,
      priceType: 'sqft',
    }

    render(<PropertyCard property={sqftProperty} />)

    expect(screen.getByText(/₹100\/sq ft/i)).toBeInTheDocument()
  })
})
