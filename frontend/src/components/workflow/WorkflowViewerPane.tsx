import { useState, useEffect } from 'react'
import { InstanceBrowser, InstanceMonitor } from '@dirigent/workflow-viewer'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/stores/themeStore'
import { useWorkflowPaneStore } from '@/stores/workflowPaneStore'
import { cn } from '@/lib/utils'
import '@xyflow/react/dist/style.css'
import '@dirigent/workflow-viewer/dist/index.css'

interface WorkflowViewerPaneProps {
  apiBaseUrl?: string
}

export function WorkflowViewerPane({ apiBaseUrl = 'http://127.0.0.1:8081' }: WorkflowViewerPaneProps) {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null)
  const theme = useThemeStore((state) => state.theme)
  const isExpanded = useWorkflowPaneStore((state) => state.isExpanded)
  const setExpanded = useWorkflowPaneStore((state) => state.setExpanded)
  const toggleExpanded = useWorkflowPaneStore((state) => state.toggleExpanded)

  // Auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 900 && isExpanded) {
        setExpanded(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isExpanded, setExpanded])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setExpanded(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded, setExpanded])

  return (
    <div
      className={cn(
        'fixed top-16 right-0 h-[calc(100vh-4rem)] z-40',
        'flex flex-col border-l bg-background shadow-2xl',
        'w-1/2',
        'transition-transform duration-300 ease-in-out',
        isExpanded ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {/* Close button on left edge of pane (only when expanded) */}
      {isExpanded && (
        <button
          onClick={toggleExpanded}
          className={cn(
            'absolute -left-10 top-1/2 -translate-y-1/2',
            'w-10 h-16 bg-background border border-r-0 rounded-l-lg shadow-lg',
            'flex items-center justify-center',
            'hover:bg-accent transition-colors duration-200',
            'group'
          )}
          aria-label="Close workflow viewer"
        >
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      )}

      <div className="flex-1 flex flex-col h-full px-6 overflow-hidden">
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
    </div>
  )
}
