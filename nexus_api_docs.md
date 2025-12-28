# Antigravity Nexus v4.2 PRO: API Documentation

Technical overview of the core services powering the Antigravity Engine.

---

## 1. Neural Registry (`NeuralRegistry.ts`)

The central nervous system for AI capability discovery and execution.

### Methods
```typescript
registerLimb(limb: NeuralLimb): void
// Register a new limb with capabilities

getLimb(id: string): NeuralLimb | undefined
// Get a specific limb by ID

getAllLimbs(): NeuralLimb[]
// Get all registered limbs

callCapability(limbId: string, capabilityName: string, params: any): Promise<any>
// Execute a capability by limb and name

getNeuralSchema(): LimbSchema[]
// Get full schema for AI planning
```

### Example
```typescript
// Execute an image generation capability
const result = await neuralRegistry.callCapability('image', 'image_generate_sprite', {
  type: 'character',
  prompt: 'pixel knight',
  style: 'pixel'
});
```

---

## 2. Model Router (`modelRouter.ts`)

Multi-provider AI routing with automatic fallback.

### Functions
```typescript
route(request: ModelRequest): Promise<ModelResponse | ReadableStream>
// Routes to best available provider (Cloudflare → Gemini)

chat(prompt: string, history?, systemPrompt?, stream?, grounding?): Promise<ModelResponse>
// Convenience function for text chat

generateImage(prompt: string, negativePrompt?): Promise<ModelResponse>
// Image generation

orchestrateMedia(type: 'image' | 'video' | 'audio' | '3d', prompt: string, context?): Promise<ModelResponse>
// 3-step orchestration: Plan → Refine → Generate
```

### ModelRequest Schema
```typescript
interface ModelRequest {
  type: 'text' | 'image' | 'code' | 'audio' | 'video' | 'reasoning' | 'vision' | '3d';
  prompt: string;
  tier?: 'standard' | 'premium';
  history?: Array<{ role: 'user' | 'model'; content: string }>;
  options?: any;
}
```

---

## 3. Nexus Command Bus (`nexusCommandBus.ts`)

Job orchestration and lifecycle management.

### Methods
```typescript
registerJob(job: Omit<NexusJob, 'startTime'>): NexusJob
// Register a new job for tracking

completeJob(id: string): void
// Mark job as finished

panic(): void
// Global Kill Switch - aborts all active jobs

subscribe(listener: (action: any) => void): () => void
// Subscribe to job updates
```

---

## 4. Session Service (`sessionService.ts`)

Real-time telemetry and financial guardrails.

### Methods
```typescript
updateMetrics(tokens: number, cost: number): void
// Increment session consumption

setHardBudgetEnabled(enabled: boolean): void
// Toggle $5.00 hard limit

isOverQuota(): boolean
// Check if session exceeded budget
```

---

## 5. Orchestrator Limb (`OrchestratorLimb.ts`)

Multi-agent symphony conductor.

### Key Capabilities
```typescript
// One prompt → multi-agent execution
symphony_from_prompt({ prompt: string, autoExecute?: boolean })

// Pre-built templates
orchestrate_2d_game_assets({ theme: string, style: 'pixel' | 'anime', ... })
orchestrate_character({ concept: string, role: 'player' | 'enemy' | 'npc', ... })
orchestrate_game_level({ levelTheme: string, difficulty: 'easy' | 'medium' | 'hard' })
```

---

## 6. Live Game Limb (`LiveGameLimb.ts`)

Real-time game state integration.

### Key Capabilities
```typescript
// State management
game_get_state()
game_set_state({ updates: object })
game_push_event({ eventType: string, data: object })

// Reactive AI generation
game_on_event({ eventType: string, reaction: 'generate_enemy' | 'play_sound' | ... })

// AI Director mode
game_ai_director({ enable: boolean, style: 'balanced' | 'challenging' | 'narrative' })
```

---

## 7. Asset Pipeline Limb (`AssetPipelineLimb.ts`)

Batch asset generation.

### Key Capabilities
```typescript
// Complete asset packs
pipeline_sprite_sheet({ character: string, style: 'pixel', animations: string[] })
pipeline_tileset({ theme: string, style: 'pixel', tileSize: number })
pipeline_ui_kit({ theme: 'fantasy', style: 'pixel' })
pipeline_audio_pack({ theme: string, includeMusic: true })
pipeline_character_pack({ concept: string, role: 'player', includeVoice: true })

// Dimensional transformation
pipeline_2d_to_3d({ source2D: string, targetType: 'model' | 'environment' })
```

---

## 8. Context Service (`contextService.ts`)

State aggregation for AI consumption.

### Methods
```typescript
getUnifiedContext(): Promise<string>
// Gathers Editor, Matrix, and Narrative state for system prompt
```

---

## 9. Local Bridge Service (`localBridgeService.ts`)

WebSocket bridge for file system access.

### Methods
```typescript
readFile(path: string): Promise<string>
writeFile(path: string, content: string): Promise<void>
listDirectory(path: string): Promise<FileEntry[]>
runCommand(command: string): Promise<CommandOutput>
```

---

## Quick Reference: All 17 Limbs

| Limb | ID | Caps | Primary Use |
|------|----|------|-------------|
| EntityLimb | `entity` | 30 | Scene CRUD |
| FileLimb | `file` | 25 | File I/O |
| DataLimb | `data` | 30 | Data processing |
| MeshOpsLimb | `mesh` | 50 | 3D geometry |
| MaterialLimb | `material` | 25 | PBR materials |
| AIModelLimb | `ai` | 30 | AI access |
| CodeLimb | `code` | 30 | Code ops |
| WorldLimb | `world` | 30 | Environment |
| PhysicsLimb | `physics` | 25 | Simulation |
| ImageLimb | `image` | 35 | Image gen |
| AudioLimb | `audio` | 35 | Audio gen |
| VideoLimb | `video` | 30 | Video gen |
| AnimationLimb | `animation` | 30 | Animation |
| NetworkLimb | `network` | 20 | HTTP/WS |
| LiveGameLimb | `live_game` | 30 | Real-time state |
| OrchestratorLimb | `orchestrator` | 25 | Multi-agent |
| AssetPipelineLimb | `asset_pipeline` | 26 | Batch assets |

**Total: 505+ Capabilities**
