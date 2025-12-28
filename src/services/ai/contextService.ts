/**
 * Context Aggregation Service
 * Unifies Project, Graph, and Narrative state for AI consumption
 */

import directorMemory from '../directorMemoryService';
import { ProjectEnv, ActiveView, UnifiedContext as UnifiedContextType } from '../../types';

export type { UnifiedContextType as UnifiedContext };

class ContextService {
    private localState: { activeFile: string; activeView: ActiveView; activeSubTab?: string; projectEnv: ProjectEnv } = {
        activeFile: '',
        activeView: 'console',
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
    async getUnifiedContext(): Promise<UnifiedContextType> {
        // 1. Get Memory Context
        const memories = directorMemory.getAll()
            .slice(0, 10)
            .map(m => `[${m.scope.toUpperCase()}] ${m.content}`);

        return {
            recentMemories: memories,
            activeFile: this.localState.activeFile,
            activeView: this.localState.activeView,
            activeSubTab: this.localState.activeSubTab,
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
[SYSTEM_SPATIAL_CONTEXT]
Location: ${ctx.activeView}${ctx.activeSubTab ? ` > ${ctx.activeSubTab}` : ''}
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
