import { neuralRegistry } from './NeuralRegistry';
import { forgeMedia } from '../../services/forgeMediaService';
import { googleSearch } from '../../services/googleService';
import { workflowEngine } from '../../services/n8n/workflowEngine';
import { localBridgeClient } from '../localBridgeService';

// We import these dynamically to avoid circular dependencies or heavy initialization if possible,
// but for "always on" limbs, we need to bind them.
// Note: Some services like RSMVEngine might be singletons we can just import.
import { RSMVEngine } from '../rsmvService';

export const registerApplicationLimbs = () => {
    console.log('[ApplicationLimbs] Initializing Global Neural Limbs...');

    // 1. Neural Forge (Global)
    neuralRegistry.registerLimb({
        id: 'forge',
        name: 'Neural Media Forge',
        description: 'Hyper-scale factory for image, audio, video, and 3D asset synthesis.',
        capabilities: [
            {
                name: 'generateAsset',
                description: 'Trigger autonomous generation of a media asset.',
                parameters: { type: 'image | audio | video | model', prompt: 'string' },
                handler: async ({ type, prompt }: { type: 'image' | 'audio' | 'video' | 'model', prompt: string }) => {
                    const { modelRouter } = await import('../../services/modelRouter');
                    // We don't switch tabs here, just execute.
                    const result = await modelRouter.orchestrateMedia(type as any, prompt, "Neural Forge Command (Global)");
                    return { status: 'Synthesis initiated', result };
                }
            },
            {
                name: 'switchForgeTab',
                description: 'Switch the Forge UI tab.',
                parameters: { tab: 'image | audio | video | model | library' },
                handler: async ({ tab }: { tab: string }) => {
                    // This requires UI binding. We can dispatch a custom event or use a store.
                    // For now, we'll emit an event that Forge.tsx listens to if mounted.
                    window.dispatchEvent(new CustomEvent('forge:switch-tab', { detail: { tab } }));
                    return { status: 'Tab switch signal sent' };
                }
            },
            {
                name: 'skeleton_generate',
                description: 'Generate a 3D joint skeleton from input points (Uses SkeletonGenerator).',
                parameters: { input: 'object' },
                handler: async ({ input }: { input: any }) => {
                    const { SkeletonGenerator } = await import('../../services/mesh/skeletonGenerator');
                    const skeleton = SkeletonGenerator.generateFrom2D(input);
                    return { status: 'Skeleton computed', joints: skeleton.joints.length, bones: skeleton.bones.length };
                }
            },
            {
                name: 'ui_explain',
                description: 'Provide an AI-driven explanation for a specific UI component or setting.',
                parameters: { componentId: 'string', context: 'string' },
                handler: async ({ componentId, context }: { componentId: string, context: string }) => {
                    const { modelRouter } = await import('../../services/modelRouter');
                    const response = await modelRouter.chat(
                        `Explain the following UI component/setting in the context of Antigravity Studio PRO: "${componentId}". 
                        Additional Context: ${context}. 
                        Keep it concise (1-2 sentences) and professional.`
                    );
                    return {
                        componentId,
                        explanation: typeof response === 'object' && 'content' in response ? response.content : 'Neural link timeout.'
                    };
                }
            }
        ]
    });

    // 2. RSMV Matrix (Global)
    neuralRegistry.registerLimb({
        id: 'rsmv',
        name: 'RSMV Asset Matrix',
        description: 'Matrix database for RuneScape, Morrowind, and Fallout assets.',
        capabilities: [
            {
                name: 'searchCache',
                description: 'Search the active game cache globally.',
                parameters: { query: 'string' },
                handler: async ({ query }: { query: string }) => {
                    // Dispatch event for UI if it's listening
                    window.dispatchEvent(new CustomEvent('rsmv:search', { detail: { query } }));
                    return { status: 'Search intention broadcasted to Matrix.' };
                }
            }
        ]
    });

    // 3. Pipeline Architect (Global)
    neuralRegistry.registerLimb({
        id: 'pipeline-builder',
        name: 'Pipeline Builder Pro',
        description: 'Advanced visual AI pipeline architect.',
        capabilities: [
            {
                name: 'load_template',
                description: 'Load a workflow template.',
                parameters: { templateId: 'string' },
                handler: async ({ templateId }: { templateId: string }) => {
                    // Emit event for UI to pick up
                    window.dispatchEvent(new CustomEvent('pipeline:load-template', { detail: { templateId } }));
                    return { success: true };
                }
            }
        ]
    });

    // 4. Copywriter (Global)
    neuralRegistry.registerLimb({
        id: 'copywriter',
        name: 'Copywriter Assistant',
        description: 'AI Copywriter and Narrative Architect.',
        capabilities: [
            {
                name: 'generate_narrative',
                description: 'Generate copy based on topic/tone.',
                parameters: { topic: 'string', tone: 'string' },
                handler: async ({ topic, tone }: { topic: string, tone: string }) => {
                    const { modelRouter } = await import('../../services/modelRouter');
                    // Notify UI that we are starting
                    window.dispatchEvent(new CustomEvent('copywriter:set-params', { detail: { topic, tone } }));

                    const response = await modelRouter.chat(
                        `Write a ${tone} piece of copy about: ${topic}.`,
                        [],
                        "You are a master copywriter.",
                        false,
                        false // No grounding for now to avoid Google dep
                    );

                    const copy = 'content' in response ? response.content : "Generation failed.";

                    // Send result to UI
                    window.dispatchEvent(new CustomEvent('copywriter:generated', { detail: { copy } }));
                    return { success: true, copy };
                }
            }
        ]
    });

    // 5. The Librarian (NEW)
    neuralRegistry.registerLimb({
        id: 'librarian',
        name: 'The Librarian',
        description: 'Keeper of Documentation and Architecture Specs.',
        capabilities: [
            {
                name: 'search_knowledge_base',
                description: 'Search project documentation (README, Architecture).',
                parameters: { query: 'string' },
                handler: async ({ query }: { query: string }) => {
                    // In a real app, this would search a vector DB.
                    // For now, we return a pointer to the docs and taxonomies.
                    return {
                        status: 'Knowledge Base Query',
                        suggestion: `Please check 'architecture.md', 'README.md', or 'src/lib/taxonomy.ts' for type-system specifics. I am now aware of symbols like 'EnvironmentType' and 'AIInvocationType'.`
                    };
                }
            }
        ]
    });

    // 6. The Oracle (NEW)
    neuralRegistry.registerLimb({
        id: 'oracle',
        name: 'The Oracle',
        description: 'Pure logic engine for high-level reasoning and architectural decisions.',
        capabilities: [
            {
                name: 'consult_logic',
                description: 'Ask for a pure logical analysis or decision (Uses Cloudflare DeepSeek).',
                parameters: { question: 'string' },
                handler: async ({ question }: { question: string }) => {
                    const { modelRouter } = await import('../../services/modelRouter');
                    const response = await modelRouter.route({
                        type: 'reasoning',
                        prompt: question,
                        tier: 'standard' // Cloudflare is standard tier usually
                    });

                    const answer = 'content' in response ? response.content : "The Oracle is silent.";
                    return { answer };
                }
            }
        ]
    });

    console.log('[ApplicationLimbs] Global Limbs Registered.');
};
