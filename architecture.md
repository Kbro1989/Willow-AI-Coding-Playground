# Antigravity Nexus - System Architecture

This document formalizes the production-grade routing and orchestration layer of the Antigravity Engine.

## 1. High-Level System Topology

```mermaid
graph TD
    User([User Input]) --> UI[UI Layer: React / R3F / Game UI]
    UI --> Valid[Input Validation & Sanitization]
    Valid --> Class[Task Classifier]
    
    subgraph Classification
        Class --> Intent[Intent Formalizer: AIIntent]
        Intent --> CodeTask[Code Task]
        Intent --> MediaTask[Media Task]
        Intent --> 3DTask[3D Task]
        Intent --> AgentTask[Symphony Task]
    end
    
    CodeTask & MediaTask & 3DTask & AgentTask --> Router[Model Router: Multi-Provider]
    
    subgraph "AI Providers"
        Router --> CF[Cloudflare AI]
        Router --> Gemini[Google Gemini]
        CF & Gemini --> Fallback[Automatic Fallback]
    end
    
    subgraph Execution
        Fallback --> Limbs[Neural Limbs: 505+ Capabilities]
        Limbs --> Sandbox[vibeRun Sandbox]
        Limbs --> Bridge[localBridgeService / Filesystem]
    end
    
    Sandbox & Bridge --> DB[(Persistence: InstantDB / KV)]
    DB --> Render[UI Rendering + Game Update]
```

## 2. Agent Symphony Architecture

```mermaid
graph TB
    subgraph Brain ["🧠 BRAIN (OrchestratorLimb)"]
        Prompt[User Prompt] --> Plan[Symphony Planner]
        Plan --> Agents[Multi-Agent Spawn]
    end
    
    subgraph Spine ["🦴 SPINE (NeuralRegistry)"]
        Agents --> Registry[Capability Router]
        Registry --> Context[Context Aggregation]
    end
    
    subgraph Limbs ["💪 LIMBS (17 Neural Limbs)"]
        Context --> Artist[Artist: Image/Video/Audio]
        Context --> Coder[Coder: Code/File/Data]
        Context --> World[World: Terrain/Physics/Animation]
        Context --> Game[Game: LiveState/Director]
    end
    
    subgraph Fingers ["🖐️ FINGERS (505+ Capabilities)"]
        Artist --> ImageGen[image_generate_sprite]
        Artist --> AudioGen[audio_generate_sfx]
        Coder --> CodeParse[code_parse]
        World --> TerrainGen[world_generate_terrain]
        Game --> AIDirector[game_ai_director]
    end
```

## 3. Model Router Pipeline

```mermaid
flowchart LR
    Request[ModelRequest] --> Type{Type?}
    
    Type -->|text| CF_Chat[Cloudflare Llama 3.3]
    Type -->|image| CF_SDXL[Cloudflare SDXL]
    Type -->|audio| CF_Audio[Cloudflare Whisper/TTS]
    Type -->|video| Gemini_Veo[Gemini Veo]
    Type -->|3d| CF_3D[Cloudflare 3D Gen]
    Type -->|code| CF_Qwen[Cloudflare Qwen 2.5]
    Type -->|reasoning| CF_DeepSeek[Cloudflare DeepSeek R1]
    
    CF_Chat & CF_SDXL & CF_Audio & CF_3D & CF_Qwen & CF_DeepSeek -->|Fallback| Gemini[Gemini 2.0 Flash]
    Gemini_Veo --> Response[ModelResponse]
    Gemini --> Response
```

## 4. Neural Limbs Registry

| Limb ID | Name | Capabilities | Domain |
|---------|------|--------------|--------|
| `entity` | EntityLimb | 30 | Scene management |
| `file` | FileLimb | 25 | File I/O |
| `data` | DataLimb | 30 | Data processing |
| `mesh` | MeshOpsLimb | 50 | 3D geometry |
| `material` | MaterialLimb | 25 | PBR materials |
| `ai` | AIModelLimb | 30 | AI model access |
| `code` | CodeLimb | 30 | Code operations |
| `world` | WorldLimb | 30 | Environment |
| `physics` | PhysicsLimb | 25 | Simulation |
| `image` | ImageLimb | 35 | Image generation |
| `audio` | AudioLimb | 35 | Audio generation |
| `video` | VideoLimb | 30 | Video generation |
| `animation` | AnimationLimb | 30 | Animation/rigging |
| `network` | NetworkLimb | 20 | HTTP/WebSocket |
| `live_game` | LiveGameLimb | 30 | Real-time state |
| `orchestrator` | OrchestratorLimb | 25 | Multi-agent symphony |
| `asset_pipeline` | AssetPipelineLimb | 26 | Batch asset generation |

## 5. Intent-Driven Orchestration

```mermaid
flowchart TD
    Input[AIIntent Object] --> Context{Context Check}
    Context -- Mode/Env/Panic --> Classifier[Intent Classifier]
    Classifier --> Type{Route Type?}
    
    Type -- Sprint --> Sprint[Agent Sprint Service]
    Type -- Terminal --> Term[Local Bridge]
    Type -- Action --> Actions[Engine Logic]
    Type -- Nexus --> Specialist[Librarian/Oracle]
    Type -- Symphony --> Orch[OrchestratorLimb]
```

### AIIntent Schema
- **`source`**: Origin (`omnibar`, `chat`, `direct_button`)
- **`verb`**: Operation (`explain`, `refactor`, `generate`, `symphony`)
- **`context`**: Real-time snapshot (`aiMode`, `projectEnv`, `panicState`)
- **`payload`**: Dynamic data (`selection`, `activeFile`, `text`)

## 6. Hard Rules & Constraints

1. **Strict Routing**: No task bypasses `modelRouter.ts`
2. **Multi-Provider**: Always try Cloudflare first, Gemini fallback
3. **Capability Discovery**: All AI actions go through `NeuralRegistry`
4. **Full Observability**: Every step logged via `loggingService`
5. **Session Quotas**: `sessionService` enforces $5 hard budget limit

---

> [!NOTE]
> This diagram is the single source of truth for the Antigravity Engine architecture.
