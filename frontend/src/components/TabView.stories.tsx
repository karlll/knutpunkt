import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { TabView, type Tab } from './TabView'

const meta = {
  title: 'Components/TabView',
  component: TabView,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TabView>

export default meta
type Story = StoryObj<typeof meta>

// Sample content components for demonstration
const SampleContent = ({ title, color }: { title: string; color: string }) => (
  <div className="flex flex-col items-center justify-center h-full p-8 gap-4">
    <div
      className="w-32 h-32 rounded-lg flex items-center justify-center text-white text-2xl font-bold"
      style={{ backgroundColor: color }}
    >
      {title}
    </div>
    <h2 className="text-2xl font-semibold">{title}</h2>
    <p className="text-muted-foreground max-w-md text-center">
      This is the content for {title}. When you switch tabs, this content remains mounted in the DOM
      to preserve component state.
    </p>
  </div>
)

const StatefulContent = ({ tabName }: { tabName: string }) => {
  const [count, setCount] = useState(0)
  const [text, setText] = useState('')

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 gap-6">
      <h2 className="text-2xl font-semibold">{tabName} - State Preservation Demo</h2>

      <div className="flex flex-col gap-4 w-full max-w-md">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Counter (preserved when switching tabs)</label>
          <div className="flex gap-2">
            <button
              onClick={() => setCount((c) => c - 1)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded"
            >
              -
            </button>
            <span className="flex items-center justify-center flex-1 text-2xl font-bold">
              {count}
            </span>
            <button
              onClick={() => setCount((c) => c + 1)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Text Input (preserved when switching tabs)</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type something..."
            className="px-3 py-2 border rounded"
          />
        </div>

        <p className="text-sm text-muted-foreground">
          Try changing these values, then switch to another tab and back. The state will be
          preserved!
        </p>
      </div>
    </div>
  )
}

// Story: Single Tab (No Tab Bar)
export const SingleTab: Story = {
  args: {
    tabs: [
      {
        id: 'kanban',
        label: 'Kanban Board',
        content: <SampleContent title="Kanban Board" color="#3b82f6" />,
      },
    ],
    defaultActiveTab: 'kanban',
  },
  parameters: {
    docs: {
      description: {
        story:
          'When only one tab exists, the tab bar is hidden and the content is displayed directly. This is the default behavior for the application.',
      },
    },
  },
}

// Story: Multiple Tabs
export const MultipleTabs: Story = {
  args: {
    tabs: [
      {
        id: 'kanban',
        label: 'Kanban Board',
        content: <SampleContent title="Kanban Board" color="#3b82f6" />,
      },
      {
        id: 'terminal1',
        label: 'Terminal - Agent 1',
        content: <SampleContent title="Terminal - Agent 1" color="#10b981" />,
      },
      {
        id: 'terminal2',
        label: 'Terminal - Agent 2',
        content: <SampleContent title="Terminal - Agent 2" color="#f59e0b" />,
      },
    ],
    defaultActiveTab: 'kanban',
  },
  parameters: {
    docs: {
      description: {
        story:
          'When multiple tabs exist, a tab bar appears below the header. Users can click tabs to switch between different views.',
      },
    },
  },
}

// Story: State Preservation
export const StatePreservation: Story = {
  args: {
    tabs: [
      {
        id: 'tab1',
        label: 'Tab 1',
        content: <StatefulContent tabName="Tab 1" />,
      },
      {
        id: 'tab2',
        label: 'Tab 2',
        content: <StatefulContent tabName="Tab 2" />,
      },
      {
        id: 'tab3',
        label: 'Tab 3',
        content: <StatefulContent tabName="Tab 3" />,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'All tab contents remain mounted in the DOM when switching tabs. This preserves component state, scroll position, and form values.',
      },
    },
  },
}

// Story: With Callback
export const WithCallback = {
  render: () => {
    const [activeTabId, setActiveTabId] = useState('kanban')

    const tabs: Tab[] = [
      {
        id: 'kanban',
        label: 'Kanban Board',
        content: (
          <div className="flex flex-col items-center justify-center h-full p-8 gap-4">
            <h2 className="text-2xl font-semibold">Active Tab: {activeTabId}</h2>
            <p className="text-muted-foreground">The onTabChange callback updates the parent state</p>
          </div>
        ),
      },
      {
        id: 'terminal',
        label: 'Terminal',
        content: (
          <div className="flex flex-col items-center justify-center h-full p-8 gap-4">
            <h2 className="text-2xl font-semibold">Active Tab: {activeTabId}</h2>
            <p className="text-muted-foreground">The onTabChange callback updates the parent state</p>
          </div>
        ),
      },
    ]

    return <TabView tabs={tabs} defaultActiveTab="kanban" onTabChange={setActiveTabId} />
  },
  parameters: {
    docs: {
      description: {
        story:
          'The TabView component calls onTabChange callback when the active tab changes, allowing parent components to react to tab switches.',
      },
    },
  },
}

// Story: Many Tabs
export const ManyTabs: Story = {
  args: {
    tabs: Array.from({ length: 8 }, (_, i) => ({
      id: `tab${i + 1}`,
      label: `Tab ${i + 1}`,
      content: (
        <SampleContent
          title={`Tab ${i + 1}`}
          color={`hsl(${(i * 45) % 360}, 70%, 50%)`}
        />
      ),
    })),
  },
  parameters: {
    docs: {
      description: {
        story: 'The tab bar handles many tabs gracefully with horizontal scrolling if needed.',
      },
    },
  },
}
