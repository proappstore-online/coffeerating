import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Stars } from '../src/components/Stars'

describe('Stars', () => {
  it('renders 5 star buttons', () => {
    render(<Stars value={3} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(5)
  })

  it('marks the correct number of stars as active', () => {
    render(<Stars value={3} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons[0].className).toContain('text-amber-500')
    expect(buttons[1].className).toContain('text-amber-500')
    expect(buttons[2].className).toContain('text-amber-500')
    expect(buttons[3].className).not.toContain('text-amber-500')
    expect(buttons[4].className).not.toContain('text-amber-500')
  })

  it('shows 0 active stars when value is 0', () => {
    render(<Stars value={0} />)
    const buttons = screen.getAllByRole('button')
    for (const b of buttons) {
      expect(b.className).not.toContain('text-amber-500')
    }
  })

  it('calls onChange when interactive', () => {
    const onChange = vi.fn()
    render(<Stars value={2} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('4 stars'))
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('disables buttons when no onChange provided', () => {
    render(<Stars value={3} />)
    const buttons = screen.getAllByRole('button')
    for (const b of buttons) {
      expect(b).toBeDisabled()
    }
  })

  it('enables buttons when onChange is provided', () => {
    render(<Stars value={3} onChange={() => {}} />)
    const buttons = screen.getAllByRole('button')
    for (const b of buttons) {
      expect(b).not.toBeDisabled()
    }
  })

  it('renders radiogroup role when interactive', () => {
    render(<Stars value={1} onChange={() => {}} />)
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })

  it('does not render radiogroup when display-only', () => {
    render(<Stars value={1} />)
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })
})
