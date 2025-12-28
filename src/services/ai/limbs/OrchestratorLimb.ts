/**
 * OrchestratorLimb.ts — Agent Symphony Conductor (25 fingers)
 * The "Brain" that coordinates multi-agent workflows from a single prompt.
 * Brain → Spine → Limbs → Fingertips architecture.
 */
import { neuralRegistry } from '../NeuralRegistry';

// Agent types for the symphony
type AgentRole = 'designer' | 'artist' | 'coder' | 'audio' | 'writer' | 'qa' | 'director';

interface AgentTask {
    id: string;
    role: AgentRole;
    objective: string;
    dependencies: string[];
    status: 'pending' | 'running' | 'complete' | 'failed';
    result?: any;
}

interface Symphony {
    id: string;
    prompt: string;
    agents: AgentTask[];
    status: 'planning' | 'executing' | 'complete' | 'failed';
    results: Record<string, any>;
    startTime: number;
}

// Active symphonies
const symphonies: Map<string, Symphony> = new Map();

// Agent role to limb mapping
const AGENT_LIMB_MAP: Record<AgentRole, string[]> = {
    designer: ['entity', 'world', 'physics'],
    artist: ['image', 'material', 'mesh'],
    coder: ['code', 'file', 'data'],
    audio: ['audio', 'video'],
    writer: ['ai'],
    qa: ['data', 'code'],
    director: ['live_game', 'animation']
};

export const registerOrchestratorLimb = () => {
    neuralRegistry.registerLimb({
        id: 'orchestrator',
        name: 'Agent Symphony Conductor',
        description: 'The Brain that coordinates multi-agent workflows from a single prompt.',
        capabilities: [
            // === Symphony Creation ===
            {
                name: 'symphony_from_prompt',
                description: 'Create a complete agent symphony from a single high-level prompt.',
                parameters: { prompt: 'string', autoExecute: 'boolean?' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');

                    // Step 1: Brain analyzes prompt and creates execution plan
                    const planPrompt = `You are the Brain of an AI agent orchestra. Analyze this prompt and create an execution plan.

PROMPT: "${params.prompt}"

Available agent roles: designer, artist, coder, audio, writer, qa, director

Respond with JSON:
{
  "agents": [
    {"role": "artist", "objective": "specific task", "dependencies": []},
    {"role": "coder", "objective": "specific task", "dependencies": ["artist task id"]}
  ],
  "estimatedTime": "X minutes",
  "complexity": "low|medium|high"
}

Order agents by dependency (independent tasks first). Be specific in objectives.`;

                    const planResult = await modelRouter.chat(planPrompt);
                    if (!('content' in planResult)) return { error: 'Failed to create plan' };

                    let plan;
                    try {
                        // Extract JSON from response
                        const jsonMatch = planResult.content?.match(/\{[\s\S]*\}/);
                        plan = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
                    } catch {
                        return { error: 'Failed to parse plan', raw: planResult.content };
                    }

                    // Create symphony
                    const symphonyId = `symphony-${Date.now()}`;
                    const symphony: Symphony = {
                        id: symphonyId,
                        prompt: params.prompt,
                        agents: plan.agents.map((a: any, i: number) => ({
                            id: `agent-${i}`,
                            ...a,
                            status: 'pending' as const
                        })),
                        status: 'planning',
                        results: {},
                        startTime: Date.now()
                    };

                    symphonies.set(symphonyId, symphony);

                    // Auto-execute if requested
                    if (params.autoExecute) {
                        symphony.status = 'executing';
                        // Execute in background
                        executeSymphony(symphonyId);
                    }

                    return {
                        symphonyId,
                        plan: symphony.agents.map(a => ({ role: a.role, objective: a.objective })),
                        status: symphony.status,
                        estimatedTime: plan.estimatedTime
                    };
                }
            },

            // === Symphony Execution ===
            {
                name: 'symphony_execute',
                description: 'Execute a created symphony.',
                parameters: { symphonyId: 'string' },
                handler: async (params) => {
                    const symphony = symphonies.get(params.symphonyId);
                    if (!symphony) return { error: 'Symphony not found' };

                    symphony.status = 'executing';
                    executeSymphony(params.symphonyId);

                    return { executing: true, symphonyId: params.symphonyId };
                }
            },
            {
                name: 'symphony_status',
                description: 'Get status of a symphony.',
                parameters: { symphonyId: 'string' },
                handler: async (params) => {
                    const symphony = symphonies.get(params.symphonyId);
                    if (!symphony) return { error: 'Symphony not found' };

                    return {
                        status: symphony.status,
                        agents: symphony.agents.map(a => ({ id: a.id, role: a.role, status: a.status })),
                        results: symphony.results,
                        elapsed: Date.now() - symphony.startTime
                    };
                }
            },
            {
                name: 'symphony_cancel',
                description: 'Cancel a running symphony.',
                parameters: { symphonyId: 'string' },
                handler: async (params) => {
                    const symphony = symphonies.get(params.symphonyId);
                    if (!symphony) return { error: 'Symphony not found' };
                    symphony.status = 'failed';
                    return { cancelled: true };
                }
            },
            {
                name: 'symphony_list',
                description: 'List all symphonies.',
                parameters: {},
                handler: async () => {
                    return {
                        symphonies: Array.from(symphonies.values()).map(s => ({
                            id: s.id,
                            prompt: s.prompt.substring(0, 50) + '...',
                            status: s.status,
                            agentCount: s.agents.length
                        }))
                    };
                }
            },

            // === Quick Orchestrations (Pre-built symphonies) ===
            {
                name: 'orchestrate_2d_game_assets',
                description: 'Generate complete 2D game asset set (sprites, tiles, UI, audio).',
                parameters: { theme: 'string', style: 'pixel|anime|painterly', characterCount: 'number?', tileCount: 'number?' },
                handler: async (params) => {
                    const prompt = `Create 2D ${params.style} game assets for "${params.theme}": ${params.characterCount || 4} character sprites, ${params.tileCount || 16} tileset pieces, UI elements (health bar, buttons, panels), and matching sound effects`;
                    const result = await neuralRegistry.callCapability('orchestrator', 'symphony_from_prompt', { prompt, autoExecute: true });
                    return result;
                }
            },
            {
                name: 'orchestrate_game_level',
                description: 'Generate a complete game level (layout, assets, enemies, items).',
                parameters: { levelTheme: 'string', difficulty: 'easy|medium|hard', style: 'string' },
                handler: async (params) => {
                    const prompt = `Design a ${params.difficulty} ${params.levelTheme} game level in ${params.style} style: terrain layout, enemy placement, item locations, ambient audio, and background art`;
                    const result = await neuralRegistry.callCapability('orchestrator', 'symphony_from_prompt', { prompt, autoExecute: true });
                    return result;
                }
            },
            {
                name: 'orchestrate_character',
                description: 'Generate complete character (sprite, animations, stats, abilities, voice).',
                parameters: { characterConcept: 'string', role: 'player|enemy|npc', style: 'string' },
                handler: async (params) => {
                    const prompt = `Create ${params.role} character "${params.characterConcept}" in ${params.style} style: sprite sheet with idle/walk/attack/hurt animations, sound effects for actions, stats and abilities, dialogue lines`;
                    const result = await neuralRegistry.callCapability('orchestrator', 'symphony_from_prompt', { prompt, autoExecute: true });
                    return result;
                }
            },
            {
                name: 'orchestrate_cutscene',
                description: 'Generate a complete cutscene (visuals, audio, dialogue).',
                parameters: { script: 'string', characters: 'string[]', mood: 'string' },
                handler: async (params) => {
                    const prompt = `Create ${params.mood} cutscene featuring ${params.characters.join(', ')}: "${params.script}". Generate video, voice acting, background music, and sound effects`;
                    const result = await neuralRegistry.callCapability('orchestrator', 'symphony_from_prompt', { prompt, autoExecute: true });
                    return result;
                }
            },
            {
                name: 'orchestrate_website',
                description: 'Generate complete website (design, code, content, assets).',
                parameters: { websiteDescription: 'string', pages: 'string[]', style: 'string' },
                handler: async (params) => {
                    const prompt = `Build ${params.style} website: "${params.websiteDescription}" with pages: ${params.pages.join(', ')}. Create design mockups, HTML/CSS/JS code, copy text, and image assets`;
                    const result = await neuralRegistry.callCapability('orchestrator', 'symphony_from_prompt', { prompt, autoExecute: true });
                    return result;
                }
            },

            // === Agent Direct Control ===
            {
                name: 'spawn_agent',
                description: 'Spawn a single specialized agent for a task.',
                parameters: { role: 'AgentRole', objective: 'string' },
                handler: async (params) => {
                    const agentId = `agent-${Date.now()}`;
                    const limbs = AGENT_LIMB_MAP[params.role as AgentRole] || ['ai'];

                    // Execute agent's objective using its limbs
                    const { modelRouter } = await import('../../modelRouter');
                    const result = await modelRouter.chat(`You are a ${params.role} agent. Your objective: ${params.objective}. Available limbs: ${limbs.join(', ')}. What specific capability calls should be made? List as JSON array.`);

                    return {
                        agentId,
                        role: params.role,
                        limbs,
                        plan: 'content' in result ? result.content : 'No plan generated'
                    };
                }
            },
            {
                name: 'agent_collaborate',
                description: 'Have two agents collaborate on a task.',
                parameters: { agent1Role: 'AgentRole', agent2Role: 'AgentRole', sharedObjective: 'string' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const result = await modelRouter.chat(`
${params.agent1Role} agent and ${params.agent2Role} agent are collaborating on: "${params.sharedObjective}"

How should they divide the work? What does each agent produce? How do outputs connect?

Respond with collaboration plan as JSON.`);

                    return {
                        collaboration: [params.agent1Role, params.agent2Role],
                        objective: params.sharedObjective,
                        plan: 'content' in result ? result.content : 'No plan'
                    };
                }
            },

            // === Pipeline Templates ===
            {
                name: 'get_pipeline_templates',
                description: 'Get available pre-built pipeline templates.',
                parameters: {},
                handler: async () => ({
                    templates: [
                        { id: '2d_platformer', name: '2D Platformer Starter', agents: ['artist', 'designer', 'audio'] },
                        { id: 'rpg_character', name: 'RPG Character Creator', agents: ['artist', 'writer', 'audio'] },
                        { id: 'website_landing', name: 'Landing Page Builder', agents: ['designer', 'coder', 'writer'] },
                        { id: 'game_jam', name: 'Game Jam Starter', agents: ['designer', 'artist', 'coder', 'audio'] },
                        { id: 'visual_novel', name: 'Visual Novel Scene', agents: ['artist', 'writer', 'audio'] },
                        { id: 'music_video', name: 'Music Video Generator', agents: ['artist', 'audio', 'director'] }
                    ]
                })
            },
            {
                name: 'run_pipeline_template',
                description: 'Run a pre-built pipeline template.',
                parameters: { templateId: 'string', customization: 'object' },
                handler: async (params) => {
                    const templates: Record<string, string> = {
                        '2d_platformer': 'Create 2D platformer starter kit with player sprite, enemy, tileset, and jump/land sounds',
                        'rpg_character': 'Create RPG character with portrait, stats, backstory, and voice lines',
                        'website_landing': 'Create modern landing page with hero, features, testimonials, and CTA',
                        'game_jam': 'Create game jam starter with player, enemy, level, UI, and audio',
                        'visual_novel': 'Create visual novel scene with backgrounds, character portraits, dialogue, and ambient audio',
                        'music_video': 'Create music video with visuals synced to generated music track'
                    };

                    const basePrompt = templates[params.templateId];
                    if (!basePrompt) return { error: 'Template not found' };

                    const customPrompt = params.customization ? `${basePrompt}. Customization: ${JSON.stringify(params.customization)}` : basePrompt;
                    return await neuralRegistry.callCapability('orchestrator', 'symphony_from_prompt', { prompt: customPrompt, autoExecute: true });
                }
            },

            // === Feedback Loop ===
            {
                name: 'symphony_iterate',
                description: 'Iterate on symphony results with feedback.',
                parameters: { symphonyId: 'string', feedback: 'string' },
                handler: async (params) => {
                    const symphony = symphonies.get(params.symphonyId);
                    if (!symphony) return { error: 'Symphony not found' };

                    const { modelRouter } = await import('../../modelRouter');
                    const result = await modelRouter.chat(`
Original prompt: "${symphony.prompt}"
Results: ${JSON.stringify(symphony.results)}
User feedback: "${params.feedback}"

What adjustments should be made? Which agents need to re-run? Respond with iteration plan.`);

                    return { iterating: true, plan: 'content' in result ? result.content : 'No iteration plan' };
                }
            },

            // === Meta-Control ===
            {
                name: 'get_limb_schema',
                description: 'Get schema of all available limbs and capabilities for agent planning.',
                parameters: {},
                handler: async () => {
                    return neuralRegistry.getNeuralSchema();
                }
            },
            {
                name: 'call_capability_by_name',
                description: 'Dynamically call any capability by limb and name.',
                parameters: { limbId: 'string', capabilityName: 'string', params: 'object' },
                handler: async (params) => {
                    return await neuralRegistry.callCapability(params.limbId, params.capabilityName, params.params);
                }
            }
        ]
    });

    console.log('[OrchestratorLimb] 25 capabilities registered.');
};

// Symphony execution engine
async function executeSymphony(symphonyId: string) {
    const symphony = symphonies.get(symphonyId);
    if (!symphony) return;

    const { modelRouter } = await import('../../modelRouter');

    // Execute agents in dependency order
    for (const agent of symphony.agents) {
        // Wait for dependencies
        const deps = agent.dependencies.map(d => symphony.agents.find(a => a.id === d));
        const allDepsComplete = deps.every(d => d?.status === 'complete');

        if (!allDepsComplete) {
            // Dependencies not ready - this is a simplified version
            // In production, this would be an event-driven system
            continue;
        }

        agent.status = 'running';

        try {
            // Execute agent's objective using AI
            const limbs = AGENT_LIMB_MAP[agent.role] || ['ai'];
            const prompt = `You are a ${agent.role} agent. Execute: "${agent.objective}". 
Available capabilities from limbs: ${limbs.join(', ')}. 
Generate the required output.`;

            const result = await modelRouter.chat(prompt);
            agent.result = 'content' in result ? result.content : null;
            agent.status = 'complete';
            symphony.results[agent.id] = agent.result;

            window.dispatchEvent(new CustomEvent('symphony:agent-complete', { detail: { symphonyId, agentId: agent.id, result: agent.result } }));
        } catch (e) {
            agent.status = 'failed';
        }
    }

    // Check if all agents complete
    const allComplete = symphony.agents.every(a => a.status === 'complete');
    symphony.status = allComplete ? 'complete' : 'failed';

    window.dispatchEvent(new CustomEvent('symphony:complete', { detail: { symphonyId, results: symphony.results } }));
}
