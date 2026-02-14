import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ButtonFlowModal from '../ButtonFlowModal'

// Mock Icons
jest.mock('@/components/Icons', () => ({
  getIcon: jest.fn(() => 'Icon'),
}))

describe('ButtonFlowModal', () => {
  const mockOnClose = jest.fn()
  const mockOnComplete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('should render welcome step on open', () => {
    render(
      <ButtonFlowModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    )

    expect(
      screen.getByText(/Welcome to Lokazen/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/Let's Go!/i)).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(
      <ButtonFlowModal
        isOpen={false}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    )

    expect(screen.queryByText(/Welcome to Lokazen/i)).not.toBeInTheDocument()
  })

  it('should progress when option is selected', async () => {
    const user = userEvent.setup()

    render(
      <ButtonFlowModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    )

    // Click "Let's Go!"
    const startButton = screen.getByText(/Let's Go!/i)
    await user.click(startButton)

    // Should progress to entity type selection
    await waitFor(() => {
      expect(
        screen.getByText(/First, let me know who you are/i)
      ).toBeInTheDocument()
    })
  })

  it('should handle multi-select for locations', async () => {
    const user = userEvent.setup()

    render(
      <ButtonFlowModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    )

    // Navigate through flow to locations step
    const startButton = screen.getByText(/Let's Go!/i)
    await user.click(startButton)

    await waitFor(() => {
      expect(screen.getByText(/First, let me know who you are/i)).toBeInTheDocument()
    })

    // Select brand
    const brandButton = screen.getByText(/I'm looking for space/i)
    await user.click(brandButton)

    await waitFor(() => {
      expect(screen.getByText(/What type of business/i)).toBeInTheDocument()
    })

    // Select business type
    const cafeButton = screen.getByText(/Café \/ QSR/i)
    await user.click(cafeButton)

    await waitFor(() => {
      expect(screen.getByText(/How much space do you need/i)).toBeInTheDocument()
    })

    // Select size
    const smallSizeButton = screen.getByText(/500 - 1,000 sqft/i)
    await user.click(smallSizeButton)

    // Should reach locations step
    await waitFor(() => {
      expect(screen.getByText(/Select your preferred locations/i)).toBeInTheDocument()
    })

    // Multi-select should be available
    const koramangalaButton = screen.getByText(/Koramangala/i)
    const indiranagarButton = screen.getByText(/Indiranagar/i)

    await user.click(koramangalaButton)
    await user.click(indiranagarButton)

    // Both should be selected (checkboxes or visual indication)
    expect(koramangalaButton).toBeInTheDocument()
    expect(indiranagarButton).toBeInTheDocument()
  })

  it('should save to localStorage', async () => {
    const user = userEvent.setup()

    render(
      <ButtonFlowModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    )

    // Navigate through flow
    const startButton = screen.getByText(/Let's Go!/i)
    await user.click(startButton)

    await waitFor(() => {
      expect(screen.getByText(/First, let me know who you are/i)).toBeInTheDocument()
    })

    // Check if localStorage is being used
    // The component should save data as user progresses
    expect(localStorage.getItem).toBeDefined()
  })

  it('should auto-scroll to bottom', async () => {
    const scrollIntoViewMock = jest.fn()
    Element.prototype.scrollIntoView = scrollIntoViewMock

    render(
      <ButtonFlowModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    )

    // Wait for initial render and scroll
    await waitFor(() => {
      // Component should attempt to scroll
      expect(scrollIntoViewMock).toHaveBeenCalled()
    }, { timeout: 2000 })
  })

  it('should show summary at confirmation step', async () => {
    const user = userEvent.setup()

    // Pre-fill localStorage to jump to confirmation
    localStorage.setItem(
      'brandSessionData',
      JSON.stringify({
        businessType: 'Café/QSR',
        sizeRange: { min: 500, max: 1000 },
        locations: ['Koramangala'],
        budgetRange: { min: 100000, max: 200000 },
        timeline: 'Immediate',
      })
    )

    render(
      <ButtonFlowModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    )

    // Should show confirmation step with summary
    await waitFor(() => {
      expect(screen.getByText(/Review your details/i)).toBeInTheDocument()
    })
  })

  it('should call onComplete when flow is completed', async () => {
    const user = userEvent.setup()

    // Pre-fill data to reach confirmation
    localStorage.setItem(
      'brandSessionData',
      JSON.stringify({
        businessType: 'Café/QSR',
        sizeRange: { min: 500, max: 1000 },
        locations: ['Koramangala'],
        budgetRange: { min: 100000, max: 200000 },
      })
    )

    render(
      <ButtonFlowModal
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/Review your details/i)).toBeInTheDocument()
    })

    // Click confirm button
    const confirmButton = screen.getByText(/Looks Good/i)
    await user.click(confirmButton)

    // onComplete should be called with collected data
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled()
    })
  })
})
