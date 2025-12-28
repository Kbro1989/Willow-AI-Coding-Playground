# Deployment Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Project Structure

```
antigravity-engine/
├── public/
│   ├── index.html
│   └── ...
├── src/
│   ├── components/           # React components
│   │   ├── ApiKeyManager.tsx
│   │   ├── BehaviorTreeEditor.tsx
│   │   ├── Chat.tsx
│   │   ├── DiagnosticsPanel.tsx
│   │   ├── Editor.tsx
│   │   ├── ExtensionRegistry.tsx
│   │   ├── Forge.tsx
│   │   ├── GameDashboard.tsx
│   │   ├── PipelineBuilder.tsx
│   │   └── index.ts
│   ├── services/            # AI and orchestration services (universalOrchestrator, etc.)
│   │   ├── modelRouter.ts
│   │   ├── ...               # universalOrchestrator, contextService, etc.
│   │   ├── cloudflareService.ts
│   │   └── index.ts
│   ├── types/               # TypeScript definitions
│   │   └── index.ts
│   ├── App.tsx              # Main app component
│   ├── index.tsx            # Entry point
│   └── index.css            # Global styles
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## Features Implemented

### ✅ Core Components
- **API Key Manager**: Modal for managing AI API keys with security
- **Behavior Tree Editor**: Visual node-based AI behavior editor
- **Chat Interface**: Persistent sidebar with context-aware code selection
- **Intent Orchestrator**: Structured `AIIntent` protocol for global system orchestration
- **Code Editor**: AI-powered editor with completions and refactoring
- **Game Dashboard**: 3D viewport with Three.js integration
- **The Forge**: Multi-modal AI interface (text, code, image, video)
- **Pipeline Builder**: n8n-style visual workflow editor
- **Extension Registry**: Extension management system
- **Diagnostics Panel**: System monitoring and metrics

### ✅ Services Layer
- **Model Router**: Multi-provider AI routing (Gemini, Cloudflare, Local)
- **Gemini Service**: Live Director and video generation
- **Cloudflare Service**: Code completion, auditing, and asset generation
- **Rate Limiting**: Built-in API usage tracking

### ✅ Type System
- Comprehensive TypeScript definitions
- All component props and state properly typed
- Service interfaces and response types

## Configuration

### Environment Variables
Create `.env` file:
```env
REACT_APP_GEMINI_API_KEY=your_key_here
REACT_APP_CLOUDFLARE_API_KEY=your_key_here
```

### AI Providers
- **Google Gemini**: Primary AI provider for text, images, and live interactions
- **Cloudflare Workers AI**: Secondary provider with various models
- **Local Ollama**: Offline AI capabilities

## Usage

### Development Workflow
1. **Code Editor**: Write code with AI assistance
2. **Director Chat**: Get AI help and generate assets
3. **3D Matrix**: Build and test games
4. **Forge**: Generate content with multiple AI models
5. **Pipelines**: Create automated workflows

### Key Features
- **Hot-swap API Keys**: Change AI providers without restart
- **Real-time 3D**: Live game development environment
- **AI Code Intelligence**: Smart completions and refactoring
- **Visual Workflows**: Drag-and-drop AI pipeline builder
- **VR/AR Support**: WebXR integration for immersive development

## Build Issues

If you encounter TypeScript version conflicts:
```bash
npm install --legacy-peer-deps
```

## Production Deployment

1. Build the project: `npm run build`
2. Serve the `dist/` directory with any static file server
3. Configure environment variables for production AI keys (wrangler for Pages)

## Customization

### Adding New AI Providers
Edit `src/services/modelRouter.ts` to add new providers:
```typescript
class NewProvider implements ModelProvider {
  // Implement required methods
}
```

### Custom Components
Create new components in `src/components/` following the existing patterns.

### Styling
Modify Tailwind configuration in `tailwind.config.js` for custom themes.