# StreamProbe Browser Extension - Agent Guide

## Build/Test/Lint Commands
- `npm run dev` - Start development server on port 3000
- `npm run build` - TypeScript compilation + Vite build
- `npm run build:extension` - Full extension build with icons and manifest
- `npm run watch` - Development build with watch mode
- TypeScript check: `tsc --noEmit`

## Architecture
Chrome extension with React popup for video streaming performance monitoring:
- **popup/**: React UI popup (main interface)
- **content/**: Content scripts for video detection (videoDetector.ts)
- **components/**: React components (StreamProbe main component)
- **hooks/**: Custom hooks (useNetworkSimulation, useWaveAnimation)
- **types/**: TypeScript type definitions
- Build outputs to `dist/` with proper Chrome extension structure

## Code Style
- React with TypeScript (strict mode enabled)
- Imports: Relative paths, React hooks from "react"
- Types: Strict TypeScript, interface naming (VideoStats, NetworkMetrics)
- Naming: camelCase for variables/functions, PascalCase for components
- Chrome APIs: Use chrome.tabs, chrome.runtime, chrome.scripting
- State: useState for component state, useRef for DOM/port references
- Error handling: console.error for debugging, try/catch for async operations
