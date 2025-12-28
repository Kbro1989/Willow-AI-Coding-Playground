/**
 * agenticRouter.ts — Parallel Model Execution for Agent Symphony
 * Wraps modelRouter with parallel execution and dependency management.
 */

import modelRouter, { ModelRequest, ModelResponse } from './modelRouter';

export interface AgentTask {
    id: string;
    request: ModelRequest;
    dependencies?: string[];  // IDs of tasks that must complete first
    priority?: number;        // Higher = execute first
}

export interface AgentTaskResult {
    id: string;
    status: 'fulfilled' | 'rejected';
    result?: ModelResponse;
    error?: Error;
    duration: number;
}

export interface SymphonyResult {
    completed: AgentTaskResult[];
    failed: AgentTaskResult[];
    totalDuration: number;
}

/**
 * AgenticRouter - Parallel model execution with dependency management
 */
class AgenticRouter {

    /**
     * Execute multiple tasks in parallel (no dependencies)
     */
    async orchestrateSymphony(tasks: AgentTask[]): Promise<SymphonyResult> {
        const startTime = Date.now();
        console.log(`[AgenticRouter] Starting symphony with ${tasks.length} parallel tasks`);

        // Sort by priority (higher first)
        const sortedTasks = [...tasks].sort((a, b) => (b.priority || 0) - (a.priority || 0));

        // Execute all in parallel
        const results = await Promise.allSettled(
            sortedTasks.map(async task => {
                const taskStart = Date.now();
                try {
                    const result = await modelRouter.route(task.request);
                    return {
                        id: task.id,
                        status: 'fulfilled' as const,
                        result: result as ModelResponse,
                        duration: Date.now() - taskStart
                    };
                } catch (error) {
                    return {
                        id: task.id,
                        status: 'rejected' as const,
                        error: error as Error,
                        duration: Date.now() - taskStart
                    };
                }
            })
        );

        const completed: AgentTaskResult[] = [];
        const failed: AgentTaskResult[] = [];

        for (const result of results) {
            if (result.status === 'fulfilled') {
                if (result.value.status === 'fulfilled') {
                    completed.push(result.value);
                } else {
                    failed.push(result.value);
                }
            }
        }

        console.log(`[AgenticRouter] Symphony complete: ${completed.length} succeeded, ${failed.length} failed`);

        return {
            completed,
            failed,
            totalDuration: Date.now() - startTime
        };
    }

    /**
     * Execute tasks with dependency management
     * Tasks wait for their dependencies to complete before executing
     */
    async orchestrateWithDependencies(tasks: AgentTask[]): Promise<SymphonyResult> {
        const startTime = Date.now();
        const resultMap = new Map<string, AgentTaskResult>();
        const pending = new Set(tasks.map(t => t.id));

        console.log(`[AgenticRouter] Starting dependency symphony with ${tasks.length} tasks`);

        while (pending.size > 0) {
            // Find tasks whose dependencies are all satisfied
            const ready = tasks.filter(task =>
                pending.has(task.id) &&
                (!task.dependencies || task.dependencies.every(dep => resultMap.has(dep)))
            );

            if (ready.length === 0 && pending.size > 0) {
                console.error('[AgenticRouter] Circular dependency detected!');
                break;
            }

            // Execute ready tasks in parallel
            const batchResults = await this.orchestrateSymphony(ready);

            // Record results
            for (const result of [...batchResults.completed, ...batchResults.failed]) {
                resultMap.set(result.id, result);
                pending.delete(result.id);
            }
        }

        const completed = Array.from(resultMap.values()).filter(r => r.status === 'fulfilled');
        const failed = Array.from(resultMap.values()).filter(r => r.status === 'rejected');

        return {
            completed,
            failed,
            totalDuration: Date.now() - startTime
        };
    }

    /**
     * Generate multiple assets in parallel for a game
     */
    async generateGameAssets(assets: { type: 'image' | 'audio' | '3d', prompt: string }[]): Promise<SymphonyResult> {
        const tasks: AgentTask[] = assets.map((asset, i) => ({
            id: `asset-${i}`,
            request: {
                type: asset.type,
                prompt: asset.prompt,
                tier: 'standard' as const
            }
        }));

        return this.orchestrateSymphony(tasks);
    }

    /**
     * Run a complete game level generation pipeline
     */
    async generateLevel(theme: string, style: 'pixel' | 'anime' | 'realistic'): Promise<SymphonyResult> {
        const tasks: AgentTask[] = [
            // Layer 1: Backgrounds (no deps)
            { id: 'bg-far', request: { type: 'image', prompt: `${style} parallax background far layer, ${theme}` } },
            { id: 'bg-mid', request: { type: 'image', prompt: `${style} parallax background mid layer, ${theme}` } },
            { id: 'bg-near', request: { type: 'image', prompt: `${style} parallax background near layer, ${theme}` } },

            // Layer 1: Tileset (no deps)
            { id: 'tileset', request: { type: 'image', prompt: `${style} tileset, ${theme}, seamless tiles 32x32` } },

            // Layer 2: Enemies (can run parallel)
            { id: 'enemy-1', request: { type: 'image', prompt: `${style} enemy sprite 1, ${theme}, idle pose` } },
            { id: 'enemy-2', request: { type: 'image', prompt: `${style} enemy sprite 2, ${theme}, idle pose` } },

            // Layer 2: Items (can run parallel)
            { id: 'item-health', request: { type: 'image', prompt: `${style} health potion item, ${theme}` } },
            { id: 'item-coin', request: { type: 'image', prompt: `${style} gold coin item, ${theme}` } },

            // Layer 2: Audio (can run parallel)
            { id: 'music', request: { type: 'audio', prompt: `${theme} level background music, loopable`, options: { audioMode: 'tts' } } },
            { id: 'ambient', request: { type: 'audio', prompt: `${theme} ambient soundscape`, options: { audioMode: 'tts' } } }
        ];

        return this.orchestrateSymphony(tasks);
    }
}

export const agenticRouter = new AgenticRouter();
export default agenticRouter;
