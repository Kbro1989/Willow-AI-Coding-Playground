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
    private systemHealth = {
        painLevel: 0,
        failedDigits: new Map<string, number>(),
        lastReflex: 0
    };

    /**
     * Proprioception: Record a biological failure (Pain)
     */
    recordReflexPain(digitId: string, intensity: number) {
        const failures = (this.systemHealth.failedDigits.get(digitId) || 0) + 1;
        this.systemHealth.failedDigits.set(digitId, failures);

        // Accumulate pain, capped at 1.0 (Agony)
        this.systemHealth.painLevel = Math.min(1.0, this.systemHealth.painLevel + intensity);
        this.systemHealth.lastReflex = Date.now();

        console.log(`[PROPRIOCEPTION] Pain Level: ${(this.systemHealth.painLevel * 100).toFixed(0)}% (Source: ${digitId})`);
    }

    /**
     * Natural Healing: Decay pain over time
     */
    heal(amount: number = 0.1) {
        this.systemHealth.painLevel = Math.max(0, this.systemHealth.painLevel - amount);
    }

    /**
     * Get current biological status
     */
    getBiologicalStatus() {
        return {
            painLevel: this.systemHealth.painLevel,
            isInjured: this.systemHealth.painLevel > 0.3,
            isCritical: this.systemHealth.painLevel > 0.8
        };
    }

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
            narrativeSummary: 'Interactive storytelling session active.',
            // @ts-ignore - Extending context dynamically
            systemHealth: this.getBiologicalStatus()
        };
    }

    /**
     * Format context as a system prompt string for LLMs
     */
    async getContextAsPrompt(): Promise<string> {
        const ctx = await this.getUnifiedContext();
        const bio = this.getBiologicalStatus();

        return `
[SYSTEM_SPATIAL_CONTEXT]
Location: ${ctx.activeView}${ctx.activeSubTab ? ` > ${ctx.activeSubTab}` : ''}
Env: ${ctx.projectEnv}
File: ${ctx.activeFile || 'None'}
Graph: ${ctx.activeGraphName}
Narrative: ${ctx.narrativeSummary}
Biological State: ${bio.painLevel > 0.1 ? `PAIN LEVEL ${(bio.painLevel * 100).toFixed(0)}%` : 'HEALTHY'}

[RECENT_MEMORIES]
${ctx.recentMemories.join('\n')}
        `.trim();
    }
}

export const contextService = new ContextService();
export default contextService;
