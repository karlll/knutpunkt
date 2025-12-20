# Knutpunkt Frontend

Kanban task board built with React, TypeScript, and Vite.

## Tech Stack

- **React 19** - UI framework
- **TypeScript 5** - Type safety
- **Vite** - Build tool and dev server
- **TanStack Query (React Query)** - Server state management
- **Zustand** - Client state management
- **@dnd-kit** - Drag and drop
- **ShadCN UI** - Component library (Radix UI + Tailwind)
- **Tailwind CSS** - Styling
- **CodeMirror** - Markdown editor with Vim mode
- **Vitest** - Unit testing
- **Storybook** - Component development
- **MSW (Mock Service Worker)** - API mocking

## Features

- Drag-and-drop Kanban board with three columns (planned/ongoing/done)
- Real-time updates via Server-Sent Events (SSE)
- Markdown editor with Vim mode support
- Task filtering by status, assignee, category, priority
- Dark mode with theme persistence
- Task archiving
- Backend settings viewer
- Optimistic UI updates

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend server running on `http://127.0.0.1:8080` (or use MSW for development)

### Installation

```bash
npm install
```

### Development

```bash
# With API mocking (no backend required)
npm run dev

# Without mocking (backend required)
npm run dev:local

# Open browser at http://127.0.0.1:5173
```

### Building

```bash
# Build for production (includes type checking)
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run tests with type checking
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm test:coverage
```

### Storybook

```bash
# Start Storybook
npm run storybook

# Build Storybook for deployment
npm run build-storybook
```

## Project Structure

```
src/
├── components/
│   ├── kanban/               # Kanban components
│   │   ├── KanbanBoard.tsx
│   │   ├── KanbanColumn.tsx
│   │   ├── TaskCard.tsx
│   │   ├── TaskDialog.tsx
│   │   └── ArchiveDialog.tsx
│   ├── ui/                   # ShadCN UI components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── markdown-editor.tsx
│   │   └── ...
│   ├── BackendSettingsDialog.tsx
│   ├── Header.tsx
│   ├── SettingsDialog.tsx
│   └── ThemeToggle.tsx
├── contexts/                 # React contexts
├── hooks/                    # Custom hooks
│   ├── useSettings.ts
│   └── useTaskEvents.ts
├── lib/
│   ├── api.ts               # API client
│   └── utils.ts             # Utility functions
├── mocks/                   # MSW setup
│   ├── browser.ts
│   ├── handlers.ts
│   └── data.ts
├── stores/                  # Zustand stores
│   ├── settingsStore.ts
│   └── themeStore.ts
├── stories/                 # Storybook stories
├── test/                    # Test utilities
├── types/
│   └── api.ts              # Generated types from OpenAPI
├── App.tsx
├── main.tsx
└── index.css
```

## API Mocking with MSW

The app uses [MSW](https://mswjs.io/) to mock API requests during development.

### Enable/Disable Mocking

```bash
# Enable mocking (default for `npm run dev`)
VITE_USE_MOCKS=true npm run dev

# Disable mocking (use real backend)
npm run dev:local
```

### Troubleshooting MSW

**Service worker not found:**
```bash
npx msw init public/ --save
```

**MSW not working in dev tools:**
- Network Tab: Uncheck "Disable cache"
- Application → Service Workers: Uncheck "Bypass for network"
- Status should show "activated and is running"

**Verify MSW is active:**
Check browser console for:
```
[MSW] Mocking enabled.
```

## Generating API Types

Generate TypeScript types from OpenAPI specification:

```bash
npm run generate-types
```

This reads `../api/openapi.yaml` and generates `src/types/api.ts`.

## Drag and Drop

Uses [@dnd-kit](https://dndkit.com/) for drag and drop:

- Drag cards within columns to reorder
- Drag cards between columns to change status
- Visual feedback shows drop zones
- Optimistic updates with server sync

## State Management

**Server State:** TanStack Query handles API data, caching, and synchronization

**Client State:** Zustand stores manage:
- Theme preferences (light/dark mode)
- Backend settings cache

**Real-time Updates:** SSE connection updates tasks automatically when changed externally

## Environment Variables

Create `.env` file:

```env
VITE_API_BASE_URL=http://127.0.0.1:8080/api/v1
VITE_USE_MOCKS=false
```
