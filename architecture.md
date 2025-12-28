# Antigravity Nexus - System Architecture Spec

This document formalizes the production-grade routing and orchestration layer of the Antigravity / ElderScape hybrid engine.

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
        Intent --> GameTask[Game State Task]
    end
    
    CodeTask & MediaTask & 3DTask & GameTask --> Router[Routing & Orchestration Layer]
    
    subgraph Execution
        Router --> Sandbox[vibeRun Sandbox / vm2]
        Router --> Bridge[localBridgeService / Filesystem]
        Router --> Remote[Remote AI: Cloud / Worker / Gemini]
    end
    
    Sandbox & Bridge & Remote --> Pipes[Processing Pipelines]
    Pipes --> DB[(Persistence: InstantDB / KV)]
    DB --> Render[UI Rendering + Game Update]
    Render --> Logs[[Logging / Metrics / Observability]]
```

## 2. Intent-Driven Orchestration (universalOrchestrator.ts)

The engine dispatches **Structured Intents** instead of raw strings. This ensures context-aware execution.

```mermaid
flowchart TD
    Input[AIIntent Object] --> Context{Context Check}
    Context -- Mode/Env/Panic --> Classifier[Intent Classifier]
    Classifier --> Type{Route Type?}
    
    Type -- Sprint --> Sprint[Agent Sprint Service]
    Type -- Terminal --> Term[Local Bridge]
    Type -- Action --> Actions[Engine Logic]
    Type -- Nexus --> Specialist[Librarian/Oracle]
```

### AIIntent Schema
- **`source`**: Origin (`omnibar`, `chat`, `direct_button`).
- **`verb`**: Desired operation (`explain`, `refactor`, `generate`).
- **`context`**: Real-time snapshot (`aiMode`, `projectEnv`, `panicState`).
- **`payload`**: Dynamic data (`selection`, `activeFile`, `text`).

## 3. Post-Execution Processing Pipelines

Data is never sent directly to the UI—it is always structured first.

```mermaid
graph LR
    subgraph "processCode.ts"
        A[Code] --> B[detectLanguage] --> C[analyzeQuality] --> D[Structured Output]
    end
    
    subgraph "processMedia.ts"
        E[Media] --> F[detectFormat] --> G[optimizeSize] --> H[Media Package]
    end
    
    subgraph "process3D.ts"
        I[3D Data] --> J[detectFormat] --> K[modifyColors] --> L[3D Descriptor]
    end
```

## 5. Nexus UI/UX Command Map

The visual hierarchy of the **Maximal Control Surface**.

```mermaid
graph LR
    subgraph Spine ["Global Command Spine (Top Bar)"]
        Proj[Project Selector]
        Env[Env: Dev/Prod]
        Mode[AI: Assist/Auto]
        Panic[PANIC BUTTON]
        Search[Global Search]
    end

    Spine --> Nav[Primary Navigation]

    subgraph Layout ["Engine Workspace Layout"]
        EDIT_PANEL[Center: Editor / Viewport]
        AI_SIDEBAR[Right: Cognitive Sidebar]
        SPINE[Top: Global Command Spine]
    end

    SPINE --> AI_SIDEBAR
    AI_SIDEBAR -- Context --> EDIT_PANEL
    EDIT_PANEL -- Selection --> AI_SIDEBAR

    subgraph NavGroups ["15 Control Surfaces"]
        DASH[Dashboard: Stats]
        DIR[Director: Cognitive Sidebar]
        EDIT[Editor: Code]
        MAT[Matrix: 3D/World]
        FORG[Forge: Gen AI]
        PIPE[Pipelines: n8n]
        BEH[Behavior: NPC Logic]
        ASST[Assets: Library]
        WRLD[World: Lore/State]
        DATA[Data: Storage]
        COLL[Collab: Multi]
        DIAG[Diagnostics: Logs]
        DEPL[Deploy: CI/CD]
        SET[Settings: Config]
    end

    DIR --> DIR_SUB[Chat/Memory/Roles]
    FORG --> FORG_SUB[Text/Code/Media/3D]
    MAT --> MAT_SUB[Scene/Physics/XR]
    PIPE --> PIPE_SUB[Builder/Runs/Failures]
```

## 6. Hard Rules & Constraints

1.  **Strict Routing**: No task bypasses `universalOrchestrator.ts`.
2.  **Zero-Direct-AI**: UI components must never call providers directly.
3.  **Sandboxed Flow**: All browser-side execution must be trapped in `vibeRun`.
4.  **Full Observability**: Every step—from validation to rendering—is logged via `loggingService`.

---

> [!NOTE]
> This diagram is the single source of truth for the Antigravity Engine architecture. Any deviation from this flow is considered an architectural regression.
