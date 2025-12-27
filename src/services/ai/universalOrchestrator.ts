
import { modelRouter } from '../modelRouter';
import { agentSprintService } from './agentSprintService';
import { nexusBus } from '../nexusCommandBus';
import { localBridgeClient } from '../localBridgeService';
import { contextService } from './contextService';

export type OrchestrationRoute =
    | { type: 'sprint', goal: string }
    | { type: 'pipeline', id: string, params: any }
    | { type: 'action', cmd: string, payload: any }
    | { type: 'terminal', command: string }
    | { type: 'navigation', view: string };

class UniversalOrchestrator {
    private isInterpreting = false;

    /**
     * The primary entry point for any human or AI prompt.
     * "AI or Human first... from anywhere."
     */
    public async dispatch(prompt: string, contextOverride?: any) {
        if (this.isInterpreting) return;
        this.isInterpreting = true;

        try {
            const context = await contextService.getUnifiedContext();

            // 1. Intent Classification
            const classificationPrompt = `
                SYSTEM: You are the Antigravity Universal Orchestrator.
                USER PROMPT: "${prompt}"
                CONTEXT: ${JSON.stringify(context)}

                Route this prompt to the most effective system.
                Available Routes:
                - "sprint": Complex goal requiring multiple steps (e.g. "Build a feature", "Refactor X").
                - "pipeline": Trigger a predefined N8N workflow (e.g. "Run image generation pipeline").
                - "terminal": Direct bridge command (e.g. "npm install", "git status").
                - "navigation": Change UI view (dashboard, editor, forge, pipelines, rsmv, shader).
                - "action": Direct engine action (spawn object, update sky).

                RETURN JSON ONLY:
                { "type": "sprint"|"pipeline"|"terminal"|"navigation"|"action", "payload": ... }
            `;

            const response = await modelRouter.route({
                type: 'text',
                prompt: classificationPrompt,
                tier: 'premium'
            });

            const content = 'content' in response ? response.content : '';
            if (!content) throw new Error('Failed to classify intent');

            const route = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}') as { type: string, payload: any };

            // 2. Execution
            await this.executeRoute(route);

        } catch (error) {
            console.error('[Orchestrator] Dispatch failed:', error);
            nexusBus.registerJob({
                id: `error-${Date.now()}`,
                type: 'ai',
                description: `Dispatch Hub Error: ${error}`,
                abortController: new AbortController()
            });
        } finally {
            this.isInterpreting = false;
        }
    }

    private async executeRoute(route: { type: string, payload: any }) {
        console.log(`[Orchestrator] Executing Route: ${route.type}`, route.payload);

        switch (route.type) {
            case 'sprint':
                await agentSprintService.startSprint(route.payload.goal || route.payload);
                break;

            case 'terminal':
                const termRes = await localBridgeClient.runTerminalCommand(route.payload.command || route.payload);
                console.log('[Orchestrator] Terminal Output:', termRes);
                break;

            case 'navigation':
                const view = route.payload.view || route.payload;
                if ((window as any).antigravity?.setTab) {
                    (window as any).antigravity.setTab(view);
                }
                break;

            case 'action':
                if ((window as any).antigravity?.runAction) {
                    (window as any).antigravity.runAction({
                        type: route.payload.type,
                        payload: route.payload.data
                    });
                }
                break;

            default:
                console.warn('[Orchestrator] Unhandled route type:', route.type);
        }
    }
}

export const universalOrchestrator = new UniversalOrchestrator();
