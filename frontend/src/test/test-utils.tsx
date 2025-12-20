import { type ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * Creates a new QueryClient for each test to ensure isolation
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
        gcTime: 0, // Disable garbage collection time
      },
      mutations: {
        retry: false,
      },
    },
  })
}

interface AllTheProvidersProps {
  children: React.ReactNode
}

/**
 * Wrapper component that includes all necessary providers for testing
 */
function AllTheProviders({ children }: AllTheProvidersProps) {
  const testQueryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  )
}

/**
 * Custom render function that wraps components with necessary providers
 * Use this instead of @testing-library/react's render for components that use React Query
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react'

// Override the default render with our custom render
export { customRender as render }

// Export helper for creating test query clients
export { createTestQueryClient }
