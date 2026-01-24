import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { WorkflowViewerPane } from './WorkflowViewerPane'

// Mock the @dirigent/workflow-viewer module
vi.mock('@dirigent/workflow-viewer', () => ({
  WorkflowBrowser: ({ apiBaseUrl, selectedWorkflow, onSelect, mode }: any) => {
    return (
      <div data-testid="workflow-browser">
        <div data-testid="workflow-browser-api-url">{apiBaseUrl}</div>
        <div data-testid="workflow-browser-mode">{mode}</div>
        <button
          onClick={() => onSelect && onSelect('test-workflow')}
          data-testid="select-workflow-button"
        >
          Select Workflow
        </button>
        {selectedWorkflow && <div data-testid="selected-workflow">{selectedWorkflow}</div>}
      </div>
    )
  },
  Workflow: ({ yaml, direction, colorMode }: any) => (
    <div data-testid="workflow-viewer">
      <div data-testid="workflow-yaml">{yaml}</div>
      <div data-testid="workflow-direction">{direction}</div>
      <div data-testid="workflow-color-mode">{colorMode}</div>
    </div>
  ),
  useWorkflowDefinition: vi.fn(),
}))

import { useWorkflowDefinition } from '@dirigent/workflow-viewer'

describe('WorkflowViewerPane', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    vi.mocked(useWorkflowDefinition).mockReturnValue({
      yaml: null,
      workflow: null,
      loading: false,
      error: null,
    } as any)

    render(<WorkflowViewerPane />)
    expect(screen.getByTestId('workflow-browser')).toBeInTheDocument()
  })

  it('passes correct API URL to WorkflowBrowser', () => {
    vi.mocked(useWorkflowDefinition).mockReturnValue({
      yaml: null,
      workflow: null,
      loading: false,
      error: null,
    } as any)

    render(<WorkflowViewerPane />)
    expect(screen.getByTestId('workflow-browser-api-url')).toHaveTextContent('http://127.0.0.1:8081')
  })

  it('uses dropdown mode for WorkflowBrowser', () => {
    vi.mocked(useWorkflowDefinition).mockReturnValue({
      yaml: null,
      workflow: null,
      loading: false,
      error: null,
    } as any)

    render(<WorkflowViewerPane />)
    expect(screen.getByTestId('workflow-browser-mode')).toHaveTextContent('dropdown')
  })

  it('displays placeholder message when no workflow is selected', () => {
    vi.mocked(useWorkflowDefinition).mockReturnValue({
      yaml: null,
      workflow: null,
      loading: false,
      error: null,
    } as any)

    render(<WorkflowViewerPane />)
    expect(screen.getByText('Select a workflow to view')).toBeInTheDocument()
  })

  it('displays loading message when workflow is loading', () => {
    vi.mocked(useWorkflowDefinition).mockReturnValue({
      yaml: null,
      workflow: null,
      loading: true,
      error: null,
    } as any)

    const { rerender } = render(<WorkflowViewerPane />)

    // Select a workflow
    const selectButton = screen.getByTestId('select-workflow-button')
    userEvent.click(selectButton)

    rerender(<WorkflowViewerPane />)

    expect(screen.getByText('Loading workflow...')).toBeInTheDocument()
  })

  it('displays workflow viewer when workflow YAML is loaded', async () => {
    const mockYaml = 'name: test-workflow\nversion: 1\nstart: first_step'

    const useWorkflowDefinitionMock = vi.mocked(useWorkflowDefinition)
    useWorkflowDefinitionMock.mockReturnValue({
      yaml: mockYaml,
      workflow: null,
      loading: false,
      error: null,
    } as any)

    render(<WorkflowViewerPane />)

    await waitFor(() => {
      expect(screen.getByTestId('workflow-viewer')).toBeInTheDocument()
      const yamlElement = screen.getByTestId('workflow-yaml')
      expect(yamlElement.textContent).toContain('name: test-workflow')
      expect(yamlElement.textContent).toContain('version: 1')
      expect(yamlElement.textContent).toContain('start: first_step')
      expect(screen.getByTestId('workflow-direction')).toHaveTextContent('LR')
      expect(screen.getByTestId('workflow-color-mode')).toHaveTextContent('system')
    })
  })

  it('uses custom API base URL when provided', () => {
    const customApiUrl = 'http://custom-api:9000'

    vi.mocked(useWorkflowDefinition).mockReturnValue({
      yaml: null,
      workflow: null,
      loading: false,
      error: null,
    } as any)

    render(<WorkflowViewerPane apiBaseUrl={customApiUrl} />)

    expect(screen.getByTestId('workflow-browser-api-url')).toHaveTextContent(customApiUrl)
  })

  it('uses default API base URL when not provided', () => {
    vi.mocked(useWorkflowDefinition).mockReturnValue({
      yaml: null,
      workflow: null,
      loading: false,
      error: null,
    } as any)

    render(<WorkflowViewerPane />)

    expect(screen.getByTestId('workflow-browser-api-url')).toHaveTextContent('http://127.0.0.1:8081')
  })
})
