import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TerminalStore {
  pinnedSessions: Set<string>
  pinSession: (sessionId: string) => void
  unpinSession: (sessionId: string) => void
  togglePin: (sessionId: string) => void
  isPinned: (sessionId: string) => boolean
}

export const useTerminalStore = create<TerminalStore>()(
  persist(
    (set, get) => ({
      pinnedSessions: new Set<string>(),

      pinSession: (sessionId: string) => {
        set((state) => {
          const newPinned = new Set(state.pinnedSessions)
          newPinned.add(sessionId)
          return { pinnedSessions: newPinned }
        })
      },

      unpinSession: (sessionId: string) => {
        set((state) => {
          const newPinned = new Set(state.pinnedSessions)
          newPinned.delete(sessionId)
          return { pinnedSessions: newPinned }
        })
      },

      togglePin: (sessionId: string) => {
        const { pinnedSessions, pinSession, unpinSession } = get()
        if (pinnedSessions.has(sessionId)) {
          unpinSession(sessionId)
        } else {
          pinSession(sessionId)
        }
      },

      isPinned: (sessionId: string) => {
        return get().pinnedSessions.has(sessionId)
      },
    }),
    {
      name: 'terminal-storage',
      // Custom storage to handle Set serialization
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          const { state } = JSON.parse(str)
          return {
            state: {
              ...state,
              pinnedSessions: new Set(state.pinnedSessions || []),
            },
          }
        },
        setItem: (name, value) => {
          const { state } = value
          const serialized = {
            state: {
              ...state,
              pinnedSessions: Array.from(state.pinnedSessions),
            },
          }
          localStorage.setItem(name, JSON.stringify(serialized))
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
)
