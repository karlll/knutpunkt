import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface WorkflowPaneStore {
  isExpanded: boolean
  setExpanded: (expanded: boolean) => void
  toggleExpanded: () => void
}

export const useWorkflowPaneStore = create<WorkflowPaneStore>()(
  persist(
    (set) => ({
      isExpanded: true,
      setExpanded: (expanded) => set({ isExpanded: expanded }),
      toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
    }),
    {
      name: 'knutpunkt-workflow-pane',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
