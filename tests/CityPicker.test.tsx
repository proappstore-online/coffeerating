import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@proappstore/sdk', () => ({
  initPro: () => ({}),
}))

import { CityPicker } from '../src/components/CityPicker'

describe('CityPicker', () => {
  it('renders all 12 city buttons', () => {
    render(<CityPicker current={null} onPick={() => {}} />)
    expect(screen.getByText('Sydney CBD')).toBeInTheDocument()
    expect(screen.getByText('Singapore')).toBeInTheDocument()
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(12)
  })

  it('highlights the current city', () => {
    render(<CityPicker current="sydney" onPick={() => {}} />)
    const sydney = screen.getByText('Sydney CBD').closest('button')!
    expect(sydney.className).toContain('border-[var(--accent)]')
  })

  it('does not highlight non-current cities', () => {
    render(<CityPicker current="sydney" onPick={() => {}} />)
    const melbourne = screen.getByText('Melbourne CBD').closest('button')!
    expect(melbourne.className).toContain('border-[var(--line)]')
  })

  it('calls onPick when a city is clicked', () => {
    const onPick = vi.fn()
    render(<CityPicker current={null} onPick={onPick} />)
    fireEvent.click(screen.getByText('London'))
    expect(onPick).toHaveBeenCalledWith('london')
  })

  it('shows Cancel button when onClose is provided', () => {
    render(<CityPicker current="sydney" onPick={() => {}} onClose={() => {}} />)
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('hides Cancel button when onClose is not provided', () => {
    render(<CityPicker current={null} onPick={() => {}} />)
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
  })

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn()
    render(<CityPicker current="sydney" onPick={() => {}} onClose={onClose} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalled()
  })
})
