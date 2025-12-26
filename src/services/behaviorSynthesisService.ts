import { modelRouter } from './modelRouter';
import { nexusBus } from './nexusCommandBus';

export interface BehaviorNode {
    id: string;
    type: string;
    label: string;
    position: { x: number; y: number };
    children: string[];
    status: string;
    config?: Record<string, any>;
}

class BehaviorSynthesisService {
    /**
     * Use AI to refactor/optimize a behavior tree
     */
    async refactorTree(tree: BehaviorNode[], goal: string): Promise<{ suggestedTree: BehaviorNode[], rationale: string }> {
        const taskId = `beh-${Math.random().toString(36).slice(2, 7)}`;
        const abortController = new AbortController();

        nexusBus.registerJob({
            id: taskId,
            type: 'ai',
            description: `Behavior Refactor: ${goal.substring(0, 20)}...`,
            abortController
        });

        const treeContext = JSON.stringify(tree, null, 2);

        try {
            console.log(`[BEHAVIOR_SYNTHESIS] Analyzing tree for goal: ${goal}`);

            const response = await modelRouter.route({
                type: 'text',
                prompt: `
Analyze the following Behavior Tree (JSON) and refactor it to better achieve this goal: "${goal}".
Current Tree:
${treeContext}

Instructions:
1. Maintain valid node IDs and parent-child relationships.
2. Optimize for performance and logical clarity.
3. Add missing conditions or actions if necessary.
4. Return ONLY a JSON object with two fields: "suggestedTree" (the full array of nodes) and "rationale" (a brief explanation).
                `,
                systemPrompt: "You are a specialized AI Game Logic Architect. You think in behavior trees and finite state machines.",
                options: { signal: abortController.signal }
            });

            if (response instanceof ReadableStream) {
                throw new Error('Streaming not supported for behavior synthesis');
            }

            const result = JSON.parse(response.content || '{}');
            return {
                suggestedTree: result.suggestedTree || tree,
                rationale: result.rationale || "No changes suggested."
            };
        } catch (error) {
            console.error('[BEHAVIOR_SYNTHESIS] Refactor failed:', error);
            return { suggestedTree: tree, rationale: `Error: ${String(error)}` };
        } finally {
            nexusBus.completeJob(taskId);
        }
    }
}

export const behaviorSynthesis = new BehaviorSynthesisService();
export default behaviorSynthesis;
