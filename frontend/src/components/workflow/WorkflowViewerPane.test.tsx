import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { WorkflowViewerPane } from './WorkflowViewerPane'
import { useWorkflowPaneStore } from '@/stores/workflowPaneStore'

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

// Mock the workflowPaneStore
const mockToggleExpanded = vi.fn()
const mockSetExpanded = vi.fn()

const mockStoreState = {
  isExpanded: true,
  toggleExpanded: mockToggleExpanded,
  setExpanded: mockSetExpanded,
}

vi.mock('@/stores/workflowPaneStore', () => ({
  useWorkflowPaneStore: vi.fn((selector) => {
    if (selector) {
      return selector(mockStoreState)
    }
    return mockStoreState
  }),
}))

describe('WorkflowViewerPane', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    // Reset to default: expanded state
    mockStoreState.isExpanded = true
    vi.mocked(useWorkflowPaneStore).mockImplementation((selector: any) => {
      if (selector) {
        return selector(mockStoreState)
      }
      return mockStoreState
    })
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

describe('Collapsible behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStoreState.isExpanded = true
    vi.mocked(useWorkflowPaneStore).mockImplementation((selector: any) => {
      if (selector) {
        return selector(mockStoreState)
      }
      return mockStoreState
    })
  })

  it('renders in expanded state by default', () => {
    render(<WorkflowViewerPane />)
    // Get the outer container (goes up 3 levels now with fixed positioning)
    const pane = screen.getByTestId('instance-browser').parentElement?.parentElement?.parentElement
    expect(pane).toHaveClass('fixed')
    expect(pane).toHaveClass('translate-x-0')
  })

  it('shows close button when expanded', () => {
    render(<WorkflowViewerPane />)
    expect(screen.getByLabelText('Close workflow viewer')).toBeInTheDocument()
  })

  it('collapses when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<WorkflowViewerPane />)

    const closeButton = screen.getByLabelText('Close workflow viewer')
    await user.click(closeButton)

    expect(mockToggleExpanded).toHaveBeenCalledTimes(1)
  })

  it('applies correct CSS classes when expanded', () => {
    render(<WorkflowViewerPane />)
    // Get the outer container (goes up 3 levels now with fixed positioning)
    const pane = screen.getByTestId('instance-browser').parentElement?.parentElement?.parentElement

    expect(pane).toHaveClass('fixed')
    expect(pane).toHaveClass('right-0')
    expect(pane).toHaveClass('translate-x-0')
    expect(pane).toHaveClass('transition-transform')
  })

  it('applies correct CSS classes when collapsed', () => {
    mockStoreState.isExpanded = false
    vi.mocked(useWorkflowPaneStore).mockImplementation((selector: any) => {
      if (selector) {
        return selector(mockStoreState)
      }
      return mockStoreState
    })

    render(<WorkflowViewerPane />)
    // Get the outer container (goes up 3 levels now with fixed positioning)
    const pane = screen.getByTestId('instance-browser').parentElement?.parentElement?.parentElement

    expect(pane).toHaveClass('fixed')
    expect(pane).toHaveClass('right-0')
    expect(pane).toHaveClass('translate-x-full')
  })

  it('hides close button when collapsed', () => {
    mockStoreState.isExpanded = false
    vi.mocked(useWorkflowPaneStore).mockImplementation((selector: any) => {
      if (selector) {
        return selector(mockStoreState)
      }
      return mockStoreState
    })

    render(<WorkflowViewerPane />)
    expect(screen.queryByLabelText('Close workflow viewer')).not.toBeInTheDocument()
  })
})

describe('Keyboard accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStoreState.isExpanded = true
    vi.mocked(useWorkflowPaneStore).mockImplementation((selector: any) => {
      if (selector) {
        return selector(mockStoreState)
      }
      return mockStoreState
    })
  })

  it('closes on Escape key when expanded', async () => {
    const user = userEvent.setup()
    render(<WorkflowViewerPane />)

    await user.keyboard('{Escape}')

    expect(mockSetExpanded).toHaveBeenCalledWith(false)
  })

  it('does not close on Escape when already collapsed', async () => {
    mockStoreState.isExpanded = false
    vi.mocked(useWorkflowPaneStore).mockImplementation((selector: any) => {
      if (selector) {
        return selector(mockStoreState)
      }
      return mockStoreState
    })

    const user = userEvent.setup()
    render(<WorkflowViewerPane />)

    await user.keyboard('{Escape}')

    expect(mockSetExpanded).not.toHaveBeenCalled()
  })
})

describe('Responsive behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStoreState.isExpanded = true
    vi.mocked(useWorkflowPaneStore).mockImplementation((selector: any) => {
      if (selector) {
        return selector(mockStoreState)
      }
      return mockStoreState
    })
  })

  it('auto-collapses when window resized below 900px', () => {
    render(<WorkflowViewerPane />)

    // Simulate window resize
    global.innerWidth = 800
    window.dispatchEvent(new Event('resize'))

    expect(mockSetExpanded).toHaveBeenCalledWith(false)
  })

  it('does not auto-collapse when window is large enough', () => {
    render(<WorkflowViewerPane />)

    // Simulate window resize to large screen
    global.innerWidth = 1200
    window.dispatchEvent(new Event('resize'))

    expect(mockSetExpanded).not.toHaveBeenCalled()
  })
})
