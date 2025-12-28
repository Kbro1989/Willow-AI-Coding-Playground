# 🌌 Antigravity Engine v4.2 PRO

[![Status](https://img.shields.io/badge/Status-Production-cyan.svg)](https://willow-ai-coding-playground.pages.dev/)
[![Engine](https://img.shields.io/badge/Engine-React_18_+_Three.js-blue.svg)](https://reactjs.org)
[![AI](https://img.shields.io/badge/AI-Multi_Provider-purple.svg)](https://deepmind.google/technologies/gemini/)
[![Limbs](https://img.shields.io/badge/Neural_Limbs-17_Limbs_505+_Caps-green.svg)](#agent-symphony)
[![Deploy](https://img.shields.io/badge/Deploy-Cloudflare_Pages-orange.svg)](https://willow-ai-coding-playground.pages.dev/)

**The Antigravity Engine** is a next-generation **Spatial AI Game Engine + Creative IDE** that combines:
- 🎮 **Game Development** — 3D viewport, physics, world building
- 🎨 **Creative Studio** — AI image/audio/video/3D generation
- 💻 **AI Coding** — Multi-model code completion and refactoring
- 🧠 **Agent Symphony** — 17 Neural Limbs with 505+ executable AI capabilities

> **Live Demo**: [willow-ai-coding-playground.pages.dev](https://willow-ai-coding-playground.pages.dev/)

---

## 🚀 What Makes This Different

### Agent Symphony Architecture
One prompt triggers a coordinated multi-agent symphony:

```
┌─────────────────────────────────────────────────────────────┐
│                      BRAIN (Orchestrator)                   │
│  symphony_from_prompt → 1 prompt = multi-agent execution    │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      SPINE (NeuralRegistry)                 │
│  Routes capabilities, tracks state, connects all limbs      │
└───┬─────────┬─────────┬─────────┬─────────┬─────────┬───────┘
    │         │         │         │         │         │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│Artist │ │Coder  │ │Audio  │ │World  │ │Live   │ │Pipeline│
│ Limbs │ │ Limbs │ │ Limbs │ │ Limbs │ │ Game  │ │ Limbs  │
└───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └────────┘
```

### 17 Neural Limbs (505+ Capabilities)

| Category | Limb | Caps | Features |
|----------|------|------|----------|
| **Core** | EntityLimb | 30 | Scene CRUD, transforms, selection |
| | FileLimb | 25 | Read/write, R2 storage, directories |
| | DataLimb | 30 | Parsing, statistics, profiling |
| **3D** | MeshOpsLimb | 50 | Geometry, UV, measurements, export |
| | MaterialLimb | 25 | PBR, textures, shaders |
| **AI** | AIModelLimb | 30 | Chat, embeddings, vision, generation |
| | CodeLimb | 30 | Parse, refactor, execute, analyze |
| **World** | WorldLimb | 30 | Terrain, weather, lighting, navmesh |
| | PhysicsLimb | 25 | Rigidbody, colliders, forces, joints |
| **Media** | ImageLimb | 35 | 15 presets, img2img, sprites, textures |
| | AudioLimb | 35 | SFX presets, music, remix, mock sounds |
| | VideoLimb | 30 | Video-from-image, restyle, cutscenes |
| | AnimationLimb | 30 | Clips, keyframes, rigging, IK, mocap |
| **Network** | NetworkLimb | 20 | HTTP, WebSocket, caching, APIs |
| **Symphony** | LiveGameLimb | 30 | Real-time state, AI Director, reactive gen |
| | OrchestratorLimb | 25 | Multi-agent symphony, pipeline templates |
| | AssetPipelineLimb | 26 | Batch sprites, tilesets, 2D→3D conversion |

---

## 🎯 Key Features

### 🧠 Multi-Provider AI Routing
```typescript
// Cloudflare First → Gemini Fallback → Automatic failover
modelRouter.route({ type: 'text', prompt: '...', tier: 'standard' });
```
- **Cloudflare AI**: Llama 3.3, Qwen 2.5, DeepSeek R1, Stable Diffusion
- **Google Gemini**: Gemini 2.0 Flash, Imagen 3, Veo
- **Automatic Fallback**: If one fails, seamlessly routes to another

### ⚒️ The Forge (Media Studio)
- **Image**: 15 style presets (pixel, anime, realistic, dark_souls, etc.)
- **Audio**: SFX generation, music, ambient, voice with emotions
- **Video**: Text-to-video, image-to-video, video restyle
- **3D**: Text-to-3D, 2D→3D conversion pipeline

### 🎮 Live Game State Integration
```typescript
// AI generates assets WHILE you play
game_on_event('player_enter_zone', 'generate_enemy');
game_ai_director({ enable: true, style: 'challenging' });
```

### 🕸️ The Matrix (Spatial Graph)
- Visual programming with drag-and-drop neural nodes
- Real-time 3D data flow visualization
- InstantDB cloud persistence for collaboration

---

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+
- (Optional) Google Gemini API Key
- (Optional) Cloudflare Account ID & AI API Token

### Quick Start

```bash
git clone https://github.com/Kbro1989/Willow-AI-Coding-Playground.git
cd antigravity-engine
npm install --legacy-peer-deps
npm run dev
```

### Environment Variables
```env
# Required for AI features
VITE_GEMINI_API_KEY=your_gemini_api_key

# Optional - Cloudflare AI (free tier available)
VITE_CLOUDFLARE_ACCOUNT_ID=your_account_id
VITE_CLOUDFLARE_API_TOKEN=your_api_token

# Cloud persistence
VITE_INSTANT_APP_ID=your_instantdb_app_id
```

### Local File System Bridge
```bash
node bridge/server.js
```

---

## 📦 Deployment

### Automatic (GitHub → Cloudflare Pages)
Push to `main` → Auto-deploys to `willow-ai-coding-playground.pages.dev`

### Manual
```bash
npm run build
npx wrangler pages deploy dist
```

---

## ⌨️ Keybindings

| Key | Action |
|-----|--------|
| `Ctrl + Space` | Toggle OMNI-bar |
| `Ctrl + B` | Toggle Cognitive Sidebar |
| `Ctrl + K` | Focus Global Intent Search |
| `Ctrl + S` | Save Active File & Graph |
| `Alt + 1-4` | Switch Views (Director, Editor, Matrix, Forge) |

---

## 🏗️ Architecture

See [architecture.md](./architecture.md) for detailed system topology.

**Core Services:**
- `modelRouter.ts` — Multi-provider AI routing with fallback
- `universalOrchestrator.ts` — Intent-driven task dispatch
- `NeuralRegistry.ts` — Limb registration and capability discovery
- `localBridgeService.ts` — Secure WebSocket file system bridge

---

## 🤝 Contributing

PRs welcome for:
- New Neural Limb capabilities
- Additional AI provider integrations
- 3D shader optimizations
- UI themes

---

*Built with ❤️ by The Antigravity Team*