# Knutpunkt Frontend

A Kanban task board built with React, TypeScript, and Vite.

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TanStack Query** - Server state management
- **@dnd-kit** - Drag and drop functionality
- **ShadCN UI** - Component library
- **Tailwind CSS** - Styling
- **MSW (Mock Service Worker)** - API mocking for development
- **Vitest** - Unit testing

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend server running on `http://127.0.0.1:8080` (or MSW for mocking)

### Installation

```bash
npm install
```

### Development

```bash
# Start dev server (with hot reload)
npm run dev

# Open browser at http://127.0.0.1:5173
```

### Building

```bash
# Type check
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run unit tests
npm test

# Run tests with UI
npm test:ui

# Run tests with coverage
npm test:coverage
```

## API Mocking with MSW

The app uses [Mock Service Worker (MSW)](https://mswjs.io/) to mock API requests during development. This allows you to develop the frontend independently of the backend.

### How It Works

1. MSW intercepts network requests at the browser level using a Service Worker
2. Mock handlers in `src/mocks/handlers.ts` define API responses
3. Mock data is stored in `src/mocks/data.ts`

### Troubleshooting MSW

#### "Service worker not found" or "404 errors when dragging cards"

**Solution:** The MSW service worker file might be missing. Run:

```bash
npx msw init public/ --save
```

Then refresh your browser.

#### "MSW stops working when I open Developer Tools"

**Solution:** Browser dev tools can interfere with Service Workers. Check these settings:

1. **Network Tab**
   - Make sure **"Disable cache"** is **UNCHECKED**

2. **Application Tab** → **Service Workers**
   - Find `mockServiceWorker.js`
   - Make sure **"Bypass for network"** is **UNCHECKED**
   - Status should show: "activated and is running"
   - If stopped, click "Update" or refresh the page

3. **Workaround:**
   - Close dev tools
   - Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
   - Open dev tools AFTER page loads

#### Verify MSW is Working

Check the browser console for:
```
[MSW] Mocking enabled.
```

If you see this, MSW is active and will intercept API calls.

## Project Structure

```
src/
├── components/
│   ├── kanban/           # Kanban board components
│   │   ├── KanbanBoard.tsx
│   │   ├── KanbanColumn.tsx
│   │   └── TaskCard.tsx
│   └── ui/               # ShadCN UI components
├── lib/
│   ├── api.ts           # API client
│   └── utils.ts         # Utility functions
├── mocks/
│   ├── browser.ts       # MSW browser setup
│   ├── handlers.ts      # API mock handlers
│   └── data.ts          # Mock data store
├── types/
│   └── api.ts           # Generated TypeScript types from OpenAPI
├── App.tsx
├── main.tsx
└── index.css
```

## Generating API Types

The project uses `openapi-typescript` to generate TypeScript types from the OpenAPI specification:

```bash
npm run generate-types
```

This reads `../api/openapi.yaml` and generates `src/types/api.ts`.

## Drag and Drop

The Kanban board uses [@dnd-kit](https://dndkit.com/) for drag and drop functionality:

- **Within Column**: Drag cards up/down to reorder
- **Between Columns**: Drag cards to different columns to change status
- **Real-time Feedback**: Visual indicators show where cards will drop
- **Optimistic Updates**: UI updates immediately, then syncs with server

## Testing

### Unit Tests

Tests are located next to their components with `.test.tsx` extension:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- KanbanBoard.test.tsx

# Run tests in watch mode
npm test -- --watch
```

### Test Coverage

Key test files:
- `src/mocks/data.test.ts` - MSW data layer tests (reordering logic)
- `src/components/kanban/KanbanBoard.test.tsx` - Board component tests
- `src/components/kanban/TaskCard.test.tsx` - Card component tests

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://127.0.0.1:8080/api/v1
```

## Troubleshooting

### Cards disappear when dragging

1. Check browser console for errors
2. Verify MSW is enabled (see "Troubleshooting MSW" above)
3. Check dev tools Network tab → disable "Bypass for network" in Service Workers

### Hot reload not working

1. Check if Vite dev server is running
2. Check browser console for connection errors
3. Try hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

### Type errors after updating OpenAPI spec

```bash
npm run generate-types
```

## Learn More

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vite.dev)
- [TanStack Query](https://tanstack.com/query/latest)
- [dnd-kit Documentation](https://dndkit.com/)
- [ShadCN UI](https://ui.shadcn.com/)
- [MSW Documentation](https://mswjs.io/)
