# Willow-AI-Coding-Playground — Game Dev IDE

> React · TypeScript · Vite · Cloudflare · InstantDB · Agents SDK

A **full game development IDE** in the browser, built on the POG2 limb architecture.
Multi-panel environment with AI orchestration, behavior trees, shader editing, and RSMV browser.

## Panels

| Panel | Component |
|---|---|
| Code Editor | `Editor.tsx` |
| Terminal | `Terminal.tsx` |
| Behavior Tree | `BehaviorTreeEditor.tsx` |
| Shader Graph | `ShaderGraph.tsx` |
| Pipeline Builder | `PipelineBuilder.tsx` |
| RS3 Model Browser | `RSMVBrowser.tsx` (lazy-loaded) |
| Game Dashboard | `GameDashboard.tsx` |
| N8N Workflow | `N8NWorkflow.tsx` |
| AI Chat | `Chat.tsx` |
| Diagnostics | `DiagnosticsPanel.tsx` |

## Nexus Panels

Director · Matrix · Forge · Behavior · Deploy · Registry · World · Persistence · Link · Config · Narrative

## AI Orchestration

`universalOrchestrator` + `agentSprintService` — limb-based AI task routing
`SystemLimbs` · `ApplicationLimbs` · full limb registry via `registerAllLimbs`

## Architecture

```
src/
├── App.tsx                 # Root (CommandSpine, PrimaryNav, NexusControl)
├── components/             # All panels + layout
├── services/ai/            # universalOrchestrator, agentSprintService, limbs
├── backend/                # Cloudflare Worker backend
├── hooks/  lib/  utils/  types/
└── instant.schema.ts       # InstantDB real-time sync schema
```

```bash
npm run dev      # local
wrangler deploy  # edge
```
