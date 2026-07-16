import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('Relay operations CRM', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(cleanup)

  it('filters the portfolio across project content', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Search projects'), { target: { value: 'invoice' } })
    expect(screen.getAllByText('Invoice exception routing').length).toBeGreaterThan(0)
    expect(screen.queryByText('Claims intake automation')).not.toBeInTheDocument()
  })

  it('creates a typed workspace field', () => {
    render(<App />)
    fireEvent.click(screen.getByText('Fields'))
    fireEvent.click(screen.getByRole('button', { name: 'Create workspace field' }))
    const dialog = screen.getByRole('dialog', { name: 'Create a field' })
    fireEvent.change(within(dialog).getByPlaceholderText('e.g. Governance decision'), { target: { value: 'Decision owner' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create field' }))
    expect(screen.getAllByText('Decision owner').length).toBeGreaterThan(0)
  })

  it('switches to the eight-stage lifecycle board', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Board view' }))
    const board = screen.getByLabelText('Lifecycle board')
    expect(within(board).getAllByText('Assessment').length).toBeGreaterThan(0)
    expect(within(board).getAllByText('Deployment').length).toBeGreaterThan(0)
  })

  it('creates a new working initiative in Assessment', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'New initiative' }))
    const dialog = screen.getByRole('dialog', { name: 'Add to the portfolio' })
    fireEvent.change(within(dialog).getByPlaceholderText('e.g. Customer dispute triage'), { target: { value: 'Customer dispute triage' } })
    fireEvent.change(within(dialog).getByPlaceholderText('Customer operations'), { target: { value: 'Service operations' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add initiative' }))
    expect(screen.getByRole('dialog', { name: 'Customer dispute triage' })).toBeInTheDocument()
  })
})
