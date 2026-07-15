import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('APA Operations portal', () => {
  it('filters the project portfolio', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Search projects'), { target: { value: 'invoice' } })
    expect(screen.getAllByText('Invoice exception routing').length).toBeGreaterThan(0)
    expect(screen.queryByText('Claims intake automation')).not.toBeInTheDocument()
  })

  it('creates a typed dynamic column', () => {
    render(<App />)
    fireEvent.click(screen.getByText('Add column'))
    fireEvent.change(screen.getByPlaceholderText('e.g. Governance decision'), { target: { value: 'Decision owner' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add column' }))
    expect(screen.getByText('Decision owner')).toBeInTheDocument()
  })
})
