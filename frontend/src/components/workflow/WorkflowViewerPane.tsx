import { useState } from 'react'
import { InstanceBrowser, InstanceMonitor } from '@dirigent/workflow-viewer'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/stores/themeStore'
import '@dirigent/workflow-viewer/dist/index.css'

interface WorkflowViewerPaneProps {
  apiBaseUrl?: string
}

export function WorkflowViewerPane({ apiBaseUrl = 'http://127.0.0.1:8081' }: WorkflowViewerPaneProps) {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null)
  const theme = useThemeStore((state) => state.theme)

  return (
    <div className="flex flex-col h-full border-l pl-6">
      {selectedInstanceId ? (
        // Detail View: Show InstanceMonitor with back button
        <>
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedInstanceId(null)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Instances
            </Button>
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            <InstanceMonitor
              instanceId={selectedInstanceId}
              apiBaseUrl={apiBaseUrl}
              direction="LR"
              colorMode={theme}
            />
          </div>
        </>
      ) : (
        // List View: Show InstanceBrowser
        <div className="flex-1 min-h-0 overflow-hidden">
          <InstanceBrowser
            apiBaseUrl={apiBaseUrl}
            onSelect={(instanceId) => setSelectedInstanceId(instanceId)}
            refreshInterval={5000}
            showMetadata
            colorMode={theme}
          />
        </div>
      )}
    </div>
  )
}
