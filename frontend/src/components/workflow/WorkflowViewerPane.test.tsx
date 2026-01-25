import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { WorkflowViewerPane } from './WorkflowViewerPane'

// Mock the @dirigent/workflow-viewer module
vi.mock('@dirigent/workflow-viewer', () => ({
  InstanceBrowser: ({ apiBaseUrl, onSelect, refreshInterval, showMetadata }: any) => {
    return (
      <div data-testid="instance-browser">
        <div data-testid="instance-browser-api-url">{apiBaseUrl}</div>
        <div data-testid="instance-browser-refresh-interval">{refreshInterval}</div>
        <div data-testid="instance-browser-show-metadata">{showMetadata ? 'true' : 'false'}</div>
        <button
          onClick={() => onSelect && onSelect('test-instance-123')}
          data-testid="select-instance-button"
        >
          Select Instance
        </button>
      </div>
    )
  },
  InstanceMonitor: ({ instanceId, apiBaseUrl, direction }: any) => (
    <div data-testid="instance-monitor">
      <div data-testid="instance-monitor-instance-id">{instanceId}</div>
      <div data-testid="instance-monitor-api-url">{apiBaseUrl}</div>
      <div data-testid="instance-monitor-direction">{direction}</div>
    </div>
  ),
}))

describe('WorkflowViewerPane', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<WorkflowViewerPane />)
    expect(screen.getByTestId('instance-browser')).toBeInTheDocument()
  })

  it('passes correct API URL to InstanceBrowser', () => {
    render(<WorkflowViewerPane />)
    expect(screen.getByTestId('instance-browser-api-url')).toHaveTextContent('http://127.0.0.1:8081')
  })

  it('uses custom API base URL when provided', () => {
    const customApiUrl = 'http://custom-api:9000'
    render(<WorkflowViewerPane apiBaseUrl={customApiUrl} />)
    expect(screen.getByTestId('instance-browser-api-url')).toHaveTextContent(customApiUrl)
  })

  it('configures 5 second refresh interval', () => {
    render(<WorkflowViewerPane />)
    expect(screen.getByTestId('instance-browser-refresh-interval')).toHaveTextContent('5000')
  })

  it('enables metadata display', () => {
    render(<WorkflowViewerPane />)
    expect(screen.getByTestId('instance-browser-show-metadata')).toHaveTextContent('true')
  })

  it('shows InstanceBrowser by default (list view)', () => {
    render(<WorkflowViewerPane />)
    expect(screen.getByTestId('instance-browser')).toBeInTheDocument()
    expect(screen.queryByTestId('instance-monitor')).not.toBeInTheDocument()
    expect(screen.queryByText('Back to Instances')).not.toBeInTheDocument()
  })

  it('switches to detail view when instance is selected', async () => {
    const user = userEvent.setup()
    render(<WorkflowViewerPane />)

    // Click on instance
    const selectButton = screen.getByTestId('select-instance-button')
    await user.click(selectButton)

    // Should show InstanceMonitor and hide InstanceBrowser
    expect(screen.getByTestId('instance-monitor')).toBeInTheDocument()
    expect(screen.queryByTestId('instance-browser')).not.toBeInTheDocument()
    expect(screen.getByText('Back to Instances')).toBeInTheDocument()
  })

  it('displays selected instance in InstanceMonitor', async () => {
    const user = userEvent.setup()
    render(<WorkflowViewerPane />)

    const selectButton = screen.getByTestId('select-instance-button')
    await user.click(selectButton)

    expect(screen.getByTestId('instance-monitor-instance-id')).toHaveTextContent('test-instance-123')
  })

  it('passes correct props to InstanceMonitor', async () => {
    const user = userEvent.setup()
    const customApiUrl = 'http://custom-api:9000'
    render(<WorkflowViewerPane apiBaseUrl={customApiUrl} />)

    const selectButton = screen.getByTestId('select-instance-button')
    await user.click(selectButton)

    expect(screen.getByTestId('instance-monitor-api-url')).toHaveTextContent(customApiUrl)
    expect(screen.getByTestId('instance-monitor-direction')).toHaveTextContent('LR')
  })

  it('returns to list view when back button is clicked', async () => {
    const user = userEvent.setup()
    render(<WorkflowViewerPane />)

    // Select an instance
    const selectButton = screen.getByTestId('select-instance-button')
    await user.click(selectButton)

    expect(screen.getByTestId('instance-monitor')).toBeInTheDocument()

    // Click back button
    const backButton = screen.getByText('Back to Instances')
    await user.click(backButton)

    // Should show InstanceBrowser again
    expect(screen.getByTestId('instance-browser')).toBeInTheDocument()
    expect(screen.queryByTestId('instance-monitor')).not.toBeInTheDocument()
    expect(screen.queryByText('Back to Instances')).not.toBeInTheDocument()
  })

  it('renders back button with ArrowLeft icon', async () => {
    const user = userEvent.setup()
    render(<WorkflowViewerPane />)

    const selectButton = screen.getByTestId('select-instance-button')
    await user.click(selectButton)

    const backButton = screen.getByText('Back to Instances')
    expect(backButton).toBeInTheDocument()
    // Button should be a ghost variant (minimal styling)
    expect(backButton.closest('button')).toHaveClass('gap-2')
  })
})
