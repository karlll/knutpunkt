import { useState, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export interface Tab {
  id: string
  label: string
  content: React.ReactNode
  closable?: boolean // For future use
}

export interface TabViewProps {
  tabs: Tab[]
  defaultActiveTab?: string
  onTabChange?: (tabId: string) => void
}

export function TabView({ tabs, defaultActiveTab, onTabChange }: TabViewProps) {
  const firstTabId = tabs[0]?.id
  const [activeTab, setActiveTab] = useState(defaultActiveTab || firstTabId)

  const showTabBar = tabs.length > 1

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    onTabChange?.(tabId)
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
    return <div className="flex-1 flex flex-col h-screen">{tabs[0].content}</div>
  }

  // Multiple tabs - render with tab bar
  return (
    <Tabs
      value={validActiveTab}
      onValueChange={handleTabChange}
      className="flex-1 flex flex-col h-screen"
    >
      <TabsList className="w-full rounded-none border-b bg-background h-12 justify-start px-4">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent
          key={tab.id}
          value={tab.id}
          className="flex-1 mt-0 data-[state=inactive]:hidden"
          forceMount
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
