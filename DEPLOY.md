# Deployment Guide

## Quick Start

### Development
```bash
npm install --legacy-peer-deps
npm run dev
```

### Production Build
```bash
npm run build
```

## Automatic Deployment (CI/CD)

Push to `main` branch triggers automatic deployment:
- **Platform**: Cloudflare Pages
- **URL**: [willow-ai-coding-playground.pages.dev](https://willow-ai-coding-playground.pages.dev/)
- **Trigger**: GitHub webhook on push to `main`

## Project Structure

```
antigravity-engine/
├── src/
│   ├── components/           # React UI components
│   │   ├── Chat.tsx          # Cognitive Sidebar
│   │   ├── Editor.tsx        # Code Editor
│   │   ├── Forge.tsx         # Media Studio
│   │   ├── GameDashboard.tsx # 3D Viewport
│   │   └── PipelineBuilder.tsx # n8n-style workflows
│   ├── services/
│   │   ├── ai/
│   │   │   ├── limbs/        # 17 Neural Limbs (505+ capabilities)
│   │   │   │   ├── EntityLimb.ts
│   │   │   │   ├── ImageLimb.ts
│   │   │   │   ├── AudioLimb.ts
│   │   │   │   ├── OrchestratorLimb.ts
│   │   │   │   └── ... (14 more)
│   │   │   └── NeuralRegistry.ts
│   │   ├── modelRouter.ts    # Multi-provider AI routing
│   │   ├── cloudflareProvider.ts
│   │   ├── geminiProvider.ts
│   │   └── localBridgeService.ts
│   └── types.ts
├── bridge/                   # Local file system bridge
├── bridge-relay/             # Cloudflare Workers relay
└── docs/                     # Additional documentation
```

## Features Overview

### Core Engine
| Feature | Status | Notes |
|---------|--------|-------|
| 3D Viewport | ✅ Production | Three.js + React Three Fiber |
| Code Editor | ✅ Production | Monaco Editor with AI |
| Media Forge | ✅ Production | Image/Audio/Video/3D |
| Visual Pipelines | ✅ Production | n8n-style workflow builder |
| Neural Limbs | ✅ Production | 17 limbs, 505+ capabilities |

### AI Providers
| Provider | Models | Status |
|----------|--------|--------|
| Cloudflare AI | Llama 3.3, Qwen 2.5, DeepSeek R1, SDXL | ✅ Primary |
| Google Gemini | Gemini 2.0 Flash, Imagen 3, Veo | ✅ Fallback |
| Local Bridge | File system access | ✅ Production |

### Agent Symphony
| Capability | Description |
|------------|-------------|
| `symphony_from_prompt` | One prompt → multi-agent execution |
| `orchestrate_2d_game_assets` | Complete 2D game asset set |
| `pipeline_2d_to_3d` | Convert 2D layouts to 3D environments |
| `game_ai_director` | AI that adjusts game while playing |

## Environment Variables

### Required
```env
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Optional (Cloudflare AI)
```env
VITE_CLOUDFLARE_ACCOUNT_ID=your_account_id
VITE_CLOUDFLARE_API_TOKEN=your_api_token
```

### Cloud Persistence
```env
VITE_INSTANT_APP_ID=your_instantdb_app_id
```

## Local File System Bridge

For local development with file access:

```bash
# Terminal 1: Start bridge server
node bridge/server.js

# Terminal 2: Start dev server
npm run dev
```

The bridge enables:
- Local file read/write
- Terminal command execution
- Git operations

## Manual Cloudflare Deployment

```bash
# Build
npm run build

# Deploy
npx wrangler pages deploy dist --project-name=willow-ai-coding-playground
```

## Troubleshooting

### TypeScript Conflicts
```bash
npm install --legacy-peer-deps
```

### Build Memory Issues
```bash
NODE_OPTIONS="--max-old-space-size=8192" npm run build
```

### Cloudflare Pages Limits
- Max bundle size: 25MB (current: ~15MB)
- Max functions: 100

## Adding New Features

### New Neural Limb
1. Create `src/services/ai/limbs/YourLimb.ts`
2. Register in `src/services/ai/limbs/index.ts`
3. Export registration function

### New AI Provider
1. Create `src/services/yourProvider.ts`
2. Add to pipeline in `modelRouter.ts`