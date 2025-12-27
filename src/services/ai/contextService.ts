/**
 * Context Aggregation Service
 * Unifies Project, Graph, and Narrative state for AI consumption
 */

import directorMemory from '../directorMemoryService';
import graphStateService from '../gameData/graphStateService';
import { db } from '../../lib/db';
import { ProjectEnv } from '../../types';

export interface UnifiedContext {
    recentMemories: string[];
    activeGraphName?: string;
    narrativeSummary?: string;
    activeFile?: string;
    projectEnv: ProjectEnv;
}

class ContextService {
    private localState: { activeFile: string; projectEnv: ProjectEnv } = {
        activeFile: '',
        projectEnv: 'local'
    };

    /**
     * Update local ephemeral state (called by UI components)
     */
    updateLocalState(updates: Partial<typeof this.localState>) {
        this.localState = { ...this.localState, ...updates };
    }

    /**
     * Aggregate all available context into a structured object
     */
    async getUnifiedContext(): Promise<UnifiedContext> {
        // 1. Get Memory Context
        const memories = directorMemory.getAll()
            .slice(0, 5)
            .map(m => `[${m.scope.toUpperCase()}] ${m.content}`);

        // 2. Get Narrative Context (from DB)
        // In a real implementation, this would fetch from InstantDB directly 
        // using a non-hook client or by caching the last seen state.

        return {
            recentMemories: memories,
            activeFile: this.localState.activeFile,
            projectEnv: this.localState.projectEnv,
            activeGraphName: 'Main Neural Net',
            narrativeSummary: 'Interactive storytelling session active.'
        };
    }

    /**
     * Format context as a system prompt string for LLMs
     */
    async getContextAsPrompt(): Promise<string> {
        const ctx = await this.getUnifiedContext();

        return `
[SYSTEM_CONTEXT]
Env: ${ctx.projectEnv}
File: ${ctx.activeFile || 'None'}
Graph: ${ctx.activeGraphName}
Narrative: ${ctx.narrativeSummary}

[RECENT_MEMORIES]
${ctx.recentMemories.join('\n')}
        `.trim();
    }
}

export const contextService = new ContextService();
export default contextService;
