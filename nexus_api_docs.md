# Antigravity Nexus v4.2 PRO: API Documentation 📚

This document provides a technical overview of the core services powering the Antigravity Nexus engine.

## 1. Nexus Command Bus (`nexusCommandBus.ts`)
The central nervous system for job orchestration and lifecycle management.

### Methods
- `registerJob(job: Omit<NexusJob, 'startTime'>): NexusJob`
  Registers a new job (AI, Workflow, Build) for tracking.
- `completeJob(id: string): void`
  Marks a job as finished and removes it from the active registry.
- `panic(): void`
  **Global Kill Switch.** Aborts every active job across the entire system.
- `subscribe(listener: (action: any) => void): () => void`
  Subscribe to job updates and system events.

---

## 2. Session Service (`sessionService.ts`)
Manages real-time telemetry, token counts, and financial guardrails.

### Methods
- `updateMetrics(tokens: number, cost: number): void`
  Increments the session-wide resource consumption.
- `setHardBudgetEnabled(enabled: boolean): void`
  Toggle the "Hard Budget" guardrail.
- `isOverQuota(): boolean`
  Returns `true` if the session has exceeded the $5.00 hard limit (if enabled).

---

## 3. Collaborative Sync (`collaborativeSyncService.ts`)
Handles real-time Delta-Sync via InstantDB.

### Methods
- `updatePresence(userId: string, data: Partial<Presence>): Promise<void>`
  Updates user cursor (x, y), active tab, and focus state.
- `lockEntity(entityId: string, userId: string): Promise<void>`
  Prevents race conditions by locking a specific engine entity for editing.

---

## 4. GitHub Mirror Service (`githubMirrorService.ts`)
Automated project continuity and cloud backups.

### Methods
- `triggerMirror(message?: string): Promise<{ success: boolean, hash: string }>`
  Stages, commits, and pushes current workspace changes to the remote repository.

---

## 5. Nexus Routing Layer (`routeToModel.ts`)
The primary gateway for all AI-enabled task execution.

### Function
- `routeNexus(task: NexusTask): Promise<any>`
  Automatically classifies the task (VISION, CODE, MEDIA, etc.) and routes it to the appropriate model provider (Gemini, Cloudflare, etc.) using strictly enforced Nexus pipelines.

---

## 6. Director Memory (`directorMemoryService.ts`)
Persistent session-wide awareness for the AI Director.

### Methods
- `addKnowledge(content: string, type: 'scene' | 'logic' | 'asset'): void`
  Informs the Director of new situational context.
- `getSummary(): string`
  Provides a condensed view of the current engine state for LLM injection.
