# Antigravity Nexus - System Architecture Spec

This document formalizes the production-grade routing and orchestration layer of the Antigravity / ElderScape hybrid engine.

## 1. High-Level System Topology

```mermaid
graph TD
    User([User Input]) --> UI[UI Layer: React / R3F / Game UI]
    UI --> Valid[Input Validation & Sanitization]
    Valid --> Class[Task Classifier]
    
    subgraph Classification
        Class --> CodeTask[Code Task]
        Class --> MediaTask[Media Task]
        Class --> 3DTask[3D Task]
        Class --> GameTask[Game State Task]
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

## 2. Core Routing & Orchestration (routeToModel.ts)

Every task must pass through this decision matrix. **No direct AI calls allowed from UI.**

```mermaid
flowchart TD
    Input[Normalized Task Payload] --> Throttling{Throttling Check?}
    Throttling -- FAIL --> Delay[Queue / Delay]
    Throttling -- PASS --> LocCheck{Execute Locally?}
    
    LocCheck -- YES --> vibeRun[vibeRun Sandbox]
    LocCheck -- NO --> RemCheck{Requires FS/OS?}
    
    RemCheck -- YES --> Bridge[localBridgeService]
    RemCheck -- NO --> AI[External AI Adapter]
    
    vibeRun -- Failure --> AI
    AI -- Gemini/Worker --> Process[Processing Pipelines]
    Bridge --> Process
    vibeRun --> Process
```

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

    subgraph NavGroups ["15 Control Surfaces"]
        DASH[Dashboard: Stats]
        DIR[Director: AI Core]
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

1.  **Strict Routing**: No task bypasses `routeToModel.ts`.
2.  **Zero-Direct-AI**: UI components must never call providers directly.
3.  **Sandboxed Flow**: All browser-side execution must be trapped in `vibeRun`.
4.  **Full Observability**: Every step—from validation to rendering—is logged via `loggingService`.

---

> [!NOTE]
> This diagram is the single source of truth for the Antigravity Engine architecture. Any deviation from this flow is considered an architectural regression.
