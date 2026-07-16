import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { milestoneNames } from './types'

function openProject(name = 'Invoice exception routing') {
  fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
  const search = screen.getByPlaceholderText('Search project, issue key, PEATS, account or manager')
  fireEvent.change(search, { target: { value: name } })
  fireEvent.click(screen.getByRole('button', { name: new RegExp(name, 'i') }))
  return screen.getByRole('dialog', { name })
}

describe('APA Tracker command center', () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(cleanup)

  it('filters the register by a documented source identifier', async () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Search projects'), { target: { value: 'PEATS-10391' } })

    await waitFor(() => expect(screen.getByText('1 project')).toBeInTheDocument())
  })

  it('locks the operating lifecycle to the eight architecture milestones', () => {
    expect(milestoneNames).toEqual([
      'Assessment',
      'ARP',
      'Funding',
      'Technical ARP',
      'Data Eng',
      'AA Dev',
      'E2E Testing',
      'Deployment',
    ])
    expect(milestoneNames).not.toContain('Intake')
  })

  it('creates a typed portal field without changing the source schema', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Add field' }))
    const dialog = screen.getByRole('dialog', { name: 'Create a field' })
    fireEvent.change(within(dialog).getByPlaceholderText('e.g. Governance decision'), { target: { value: 'Decision owner' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create field' }))
    fireEvent.click(screen.getByText('Custom fields'))

    expect(screen.getByText('Decision owner')).toBeInTheDocument()
  })

  it('opens a project record with architecture-backed source fields', () => {
    render(<App />)
    const drawer = openProject()

    expect(within(drawer).getByText('Root issue key')).toBeInTheDocument()
    expect(within(drawer).getAllByText('PEATS-10391').length).toBeGreaterThan(0)
    expect(within(drawer).getByText('Budget code')).toBeInTheDocument()
    expect(within(drawer).getByText('CP4 name')).toBeInTheDocument()
    expect(within(drawer).getAllByText('Quoted price').length).toBeGreaterThan(0)
  })

  it('keeps Assessment read only while manual milestones remain editable', () => {
    render(<App />)
    const drawer = openProject()
    fireEvent.click(within(drawer).getByRole('tab', { name: 'Milestones · 8' }))

    expect(within(drawer).queryByLabelText('Assessment status')).not.toBeInTheDocument()
    expect(within(drawer).queryByLabelText('Assessment start date')).not.toBeInTheDocument()
    const arpStartDate = within(drawer).getByLabelText('ARP start date')
    fireEvent.change(arpStartDate, { target: { value: '2026-05-22' } })
    expect(arpStartDate).toHaveValue('2026-05-22')
    const fundingStatus = within(drawer).getByLabelText('Funding status')
    fireEvent.change(fundingStatus, { target: { value: 'done' } })
    expect(fundingStatus).toHaveValue('done')
    expect(screen.getByRole('status')).toHaveTextContent('Funding updated in the demo overlay')
  })
})
