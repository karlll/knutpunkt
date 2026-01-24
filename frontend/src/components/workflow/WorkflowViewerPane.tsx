import { useState } from 'react'
import { WorkflowBrowser, Workflow, useWorkflowDefinition } from '@dirigent/workflow-viewer'
import '@dirigent/workflow-viewer/dist/index.css'

interface WorkflowViewerPaneProps {
  apiBaseUrl?: string
}

export function WorkflowViewerPane({ apiBaseUrl = 'http://127.0.0.1:8081' }: WorkflowViewerPaneProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)

  // Fetch selected workflow definition
  const { yaml, loading } = useWorkflowDefinition(selectedWorkflow || '', apiBaseUrl)

  return (
    <div className="flex flex-col h-full border-l pl-6">
      {/* Workflow Browser at top */}
      <div className="mb-4">
        <WorkflowBrowser
          apiBaseUrl={apiBaseUrl}
          selectedWorkflow={selectedWorkflow || undefined}
          onSelect={(workflowName) => setSelectedWorkflow(workflowName)}
          mode="dropdown"
        />
      </div>

      {/* Workflow Viewer fills remaining space */}
      <div className="flex-1 min-h-0" style={{ position: 'relative' }}>
        {yaml ? (
          <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <Workflow yaml={yaml} direction="LR" colorMode="system" />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {loading ? 'Loading workflow...' : selectedWorkflow ? 'Loading...' : 'Select a workflow to view'}
          </div>
        )}
      </div>
    </div>
  )
}
