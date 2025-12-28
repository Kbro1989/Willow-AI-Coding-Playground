
import { modelRouter } from '../modelRouter';
import { agentSprintService } from './agentSprintService';
import { nexusBus } from '../nexusCommandBus';
import { localBridgeClient } from '../localBridgeService';
import { contextService } from './contextService';
import { neuralRegistry } from './NeuralRegistry';
import { AIIntent } from '../../types';

class UniversalOrchestrator {
    private isInterpreting = false;

    public async dispatch(prompt: string, contextOverride?: any) {
        return this.dispatchIntent({
            source: 'omnibar',
            verb: 'search',
            payload: { text: prompt },
            context: {
                aiMode: 'assist',
                projectEnv: 'local',
                bridgeStatus: 'offline',
                panic: false,
                view: 'console'
            }
        });
    }

    /**
     * The primary entry point for any human or AI prompt.
     */
    public async dispatchIntent(intent: AIIntent) {
        if (this.isInterpreting) return;
        this.isInterpreting = true;

        try {
            const context = await contextService.getUnifiedContext();
            const memorySummary = (await import('../directorMemoryService')).directorMemory.getContextSummary();
            const prompt = intent.payload.text || '';
            const neuralSchema = neuralRegistry.getNeuralSchema();

            // 1. Intent Classification
            const classificationPrompt = `
                SYTEM: You are the Antigravity Universal Orchestrator.
                SOURCE: ${intent.source}
                VIRTUAL INTENT: ${intent.verb}
                AI_MODE: ${intent.context.aiMode}
                ENV: ${intent.context.projectEnv}
                BRIDGE: ${intent.context.bridgeStatus}
                PANIC_STATE: ${intent.context.panic ? 'ACTIVE (CRITICAL)' : 'NORMAL'}
                ACTIVE_VIEW: ${context.activeView}
                ACTIVE_SUBTAB: ${context.activeSubTab || 'None'}
                
                USER PROMPT: "${intent.payload.text || ''}"
                SELECTION: "${intent.payload.selection || 'None'}"
                ACTIVE_FILE: "${intent.payload.fileId || 'None'}"
                
                MEMORY_CONTEXT: ${memorySummary || 'No recent memories.'}
                CRITICAL LORE: Identify any [LORE] tagged entries in memories above and ensure all generated content adheres to established world-building.

                UNIFIED_CONTEXT: ${JSON.stringify(context)}

                SPATIAL WEIGHTING (OMNI-PRESENCE):
                - If ACTIVE_VIEW is "editor", prioritize code-related limbs.
                - If ACTIVE_VIEW is "forge" or "rsmv", prioritize asset/3d limbs.
                - If ACTIVE_VIEW is "shader", prioritize material/graphics limbs.
                - If ACTIVE_VIEW is "pipelines", prioritize workflow/n8n limbs.

                Neural Limbs (Registered Capabilities):
                ${JSON.stringify(neuralSchema, null, 2)}

                Route this intent to the most effective system.
                - "sprint": Complex multi-step goals (e.g., "Build a full feature").
                - "terminal": Direct bridge commands (e.g., "npm install").
                - "navigation": Change UI view.
                - "limb": Invoke a specialized capability from a registered limb (N8N, Git, Forge, RSMV, Copywriter, Bridge, Diagnostics).
                
                Mandatory "Total Synthesis" Directive:
                Use the "limb" route whenever possible for dashboard interaction. Use the "bridge" limb to check system status before suggesting fixes. Use the "git" limb to track progress.

                Available Views: dashboard, editor, forge, pipelines, rsmv, shader, behavior, narrative, world, persistence, assets, settings.

                RETURN JSON ONLY:
                { "type": "sprint"|"terminal"|"navigation"|"action"|"limb", "payload": ... }
                If type is "limb", payload MUST be: { "limbId": "...", "capability": "...", "params": { ... } }
            `;

            const response = await modelRouter.route({
                type: 'text',
                prompt: classificationPrompt,
                tier: 'premium'
            });

            const content = 'content' in response ? response.content : '';
            if (!content) throw new Error('Failed to classify intent');

            const route = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || '{}');

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

            case 'limb': {
                const { limbId, capability, params } = route.payload;
                const memory = (await import('../directorMemoryService')).directorMemory;

                // Telemetry: Record intention
                await memory.addMemory(`Initiating Limb Call: ${limbId}.${capability} with params ${JSON.stringify(params)}`, 'session', 0.4, ['telemetry', 'limb-call']);

                const result = await neuralRegistry.callCapability(limbId, capability, params);

                // Telemetry: Record result
                await memory.addMemory(`Limb ${limbId}.${capability} Result: ${JSON.stringify(result).slice(0, 100)}...`, 'session', 0.5, ['telemetry', 'result']);

                console.log(`[Orchestrator] Limb Result (${limbId}.${capability}):`, result);
                break;
            }

            case 'action':
                if ((window as any).antigravity?.runAction) {
                    (window as any).antigravity.runAction({
                        type: route.payload.type,
                        payload: route.payload.data
                    });
                }
                break;

            case 'heal': {
                const { text, reason } = route.payload;
                console.log(`[Orchestrator] Initiating Autonomous Healing: ${reason}`);

                // Trigger a specialized sprint to fix the reported issues
                await agentSprintService.startSprint(`HEAL_REQUEST: ${text}. Reason: ${reason}. Resolve all syntax/logic errors currently reported in the health guard metadata.`);
                break;
            }

            default:
                console.warn('[Orchestrator] Unhandled route type:', route.type);
        }
    }
}

export const universalOrchestrator = new UniversalOrchestrator();
