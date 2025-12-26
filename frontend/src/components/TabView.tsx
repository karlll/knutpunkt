import { useState, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export interface Tab {
  id: string
  label: string
  content: React.ReactNode
  closable?: boolean
}

export interface TabViewProps {
  tabs: Tab[]
  activeTab?: string // For controlled mode
  defaultActiveTab?: string
  onTabChange?: (tabId: string) => void
  onTabClose?: (tabId: string) => void
}

export function TabView({ tabs, activeTab: controlledActiveTab, defaultActiveTab, onTabChange, onTabClose }: TabViewProps) {
  const firstTabId = tabs[0]?.id
  const [internalActiveTab, setInternalActiveTab] = useState(defaultActiveTab || firstTabId)

  // Use controlled value if provided, otherwise use internal state
  const activeTab = controlledActiveTab ?? internalActiveTab

  const showTabBar = tabs.length > 1

  const handleTabChange = (tabId: string) => {
    // Update internal state if not controlled
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tabId)
    }
    onTabChange?.(tabId)
  }

  const handleTabClose = (tabId: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent tab activation when clicking close button

    // If closing the active tab, switch to another tab first
    if (tabId === activeTab) {
      const currentIndex = tabs.findIndex((tab) => tab.id === tabId)
      const nextTab = tabs[currentIndex + 1] || tabs[currentIndex - 1]
      if (nextTab) {
        // Update internal state if not controlled
        if (controlledActiveTab === undefined) {
          setInternalActiveTab(nextTab.id)
        }
        // Always call the callback so parent can update controlled state
        onTabChange?.(nextTab.id)
      }
    }

    onTabClose?.(tabId)
  }

  // Ensure activeTab is valid
  const validActiveTab = useMemo(() => {
    return tabs.some((tab) => tab.id === activeTab) ? activeTab : firstTabId
  }, [activeTab, tabs, firstTabId])

  if (tabs.length === 0) {
    return null
  }

  // Single tab - render directly without tab bar
  if (!showTabBar) {
    return <div className="flex-1 flex flex-col overflow-hidden">{tabs[0].content}</div>
  }

  // Multiple tabs - render with tab bar
  return (
    <Tabs
      value={validActiveTab}
      onValueChange={handleTabChange}
      className="flex-1 flex flex-col overflow-hidden"
    >
      <TabsList className="w-full rounded-none border-b bg-background h-12 justify-start px-4">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none relative pr-8"
          >
            <span>{tab.label}</span>
            {tab.closable && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 h-6 w-6 p-0 hover:bg-muted"
                onClick={(e) => handleTabClose(tab.id, e)}
                aria-label={`Close ${tab.label}`}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent
          key={tab.id}
          value={tab.id}
          className="flex-1 flex flex-col mt-0 data-[state=inactive]:hidden overflow-hidden"
          forceMount
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
