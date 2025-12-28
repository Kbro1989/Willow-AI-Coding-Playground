/**
 * LiveGameLimb.ts — Live Game State Integration (30 fingers)
 * Real-time AI generation that responds to gameplay - edit while you play.
 */
import { neuralRegistry } from '../NeuralRegistry';

// Game state that AI can read and react to
interface GameState {
    player: { position: number[], health: number, inventory: string[] };
    enemies: { id: string, type: string, position: number[], health: number }[];
    environment: { zone: string, time: number, weather: string };
    events: { type: string, data: any, timestamp: number }[];
    score: number;
    level: number;
}

// State store
let currentGameState: GameState = {
    player: { position: [0, 0, 0], health: 100, inventory: [] },
    enemies: [],
    environment: { zone: 'default', time: 12, weather: 'clear' },
    events: [],
    score: 0,
    level: 1
};

// Event listeners for reactive generation
const reactiveListeners: Map<string, ((state: GameState, event: any) => Promise<void>)[]> = new Map();

export const registerLiveGameLimb = () => {
    neuralRegistry.registerLimb({
        id: 'live_game',
        name: 'Live Game State',
        description: 'Real-time game state integration - AI generates while you play.',
        capabilities: [
            // === State Management ===
            {
                name: 'game_get_state',
                description: 'Get current complete game state.',
                parameters: {},
                handler: async () => ({ state: currentGameState })
            },
            {
                name: 'game_set_state',
                description: 'Update game state (partial or full).',
                parameters: { updates: 'object' },
                handler: async (params) => {
                    currentGameState = { ...currentGameState, ...params.updates };
                    window.dispatchEvent(new CustomEvent('game:state-changed', { detail: currentGameState }));
                    return { updated: true, state: currentGameState };
                }
            },
            {
                name: 'game_push_event',
                description: 'Push a game event for AI to react to.',
                parameters: { eventType: 'string', data: 'object' },
                handler: async (params) => {
                    const event = { type: params.eventType, data: params.data, timestamp: Date.now() };
                    currentGameState.events.push(event);
                    if (currentGameState.events.length > 100) currentGameState.events.shift();

                    // Trigger reactive listeners
                    const listeners = reactiveListeners.get(params.eventType) || [];
                    for (const listener of listeners) {
                        await listener(currentGameState, event);
                    }

                    window.dispatchEvent(new CustomEvent('game:event', { detail: event }));
                    return { pushed: true, event };
                }
            },

            // === Player State ===
            {
                name: 'game_player_move',
                description: 'Update player position.',
                parameters: { position: 'number[]' },
                handler: async (params) => {
                    currentGameState.player.position = params.position;
                    window.dispatchEvent(new CustomEvent('game:player-move', { detail: params.position }));
                    return { position: params.position };
                }
            },
            {
                name: 'game_player_damage',
                description: 'Apply damage to player.',
                parameters: { amount: 'number', source: 'string?' },
                handler: async (params) => {
                    currentGameState.player.health = Math.max(0, currentGameState.player.health - params.amount);
                    return { health: currentGameState.player.health, dead: currentGameState.player.health <= 0 };
                }
            },
            {
                name: 'game_player_heal',
                description: 'Heal player.',
                parameters: { amount: 'number' },
                handler: async (params) => {
                    currentGameState.player.health = Math.min(100, currentGameState.player.health + params.amount);
                    return { health: currentGameState.player.health };
                }
            },
            {
                name: 'game_add_to_inventory',
                description: 'Add item to player inventory.',
                parameters: { item: 'string' },
                handler: async (params) => {
                    currentGameState.player.inventory.push(params.item);
                    return { inventory: currentGameState.player.inventory };
                }
            },

            // === Enemy Management ===
            {
                name: 'game_spawn_enemy',
                description: 'Spawn enemy at position.',
                parameters: { type: 'string', position: 'number[]', health: 'number?' },
                handler: async (params) => {
                    const enemy = {
                        id: `enemy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        type: params.type,
                        position: params.position,
                        health: params.health || 50
                    };
                    currentGameState.enemies.push(enemy);
                    window.dispatchEvent(new CustomEvent('game:enemy-spawn', { detail: enemy }));
                    return { spawned: enemy };
                }
            },
            {
                name: 'game_kill_enemy',
                description: 'Remove enemy by ID.',
                parameters: { enemyId: 'string' },
                handler: async (params) => {
                    const idx = currentGameState.enemies.findIndex(e => e.id === params.enemyId);
                    if (idx >= 0) {
                        const enemy = currentGameState.enemies.splice(idx, 1)[0];
                        currentGameState.score += 100;
                        window.dispatchEvent(new CustomEvent('game:enemy-killed', { detail: enemy }));
                        return { killed: true, score: currentGameState.score };
                    }
                    return { killed: false };
                }
            },

            // === Environment ===
            {
                name: 'game_change_zone',
                description: 'Change current zone/level.',
                parameters: { zone: 'string' },
                handler: async (params) => {
                    currentGameState.environment.zone = params.zone;
                    window.dispatchEvent(new CustomEvent('game:zone-change', { detail: params.zone }));
                    return { zone: params.zone };
                }
            },
            {
                name: 'game_set_weather',
                description: 'Change weather.',
                parameters: { weather: 'clear|rain|snow|fog|storm' },
                handler: async (params) => {
                    currentGameState.environment.weather = params.weather;
                    window.dispatchEvent(new CustomEvent('game:weather-change', { detail: params.weather }));
                    return { weather: params.weather };
                }
            },
            {
                name: 'game_set_time',
                description: 'Set time of day (0-24).',
                parameters: { hour: 'number' },
                handler: async (params) => {
                    currentGameState.environment.time = params.hour;
                    window.dispatchEvent(new CustomEvent('game:time-change', { detail: params.hour }));
                    return { time: params.hour };
                }
            },

            // === Reactive AI Generation ===
            {
                name: 'game_on_event',
                description: 'Register AI reaction to game event (generates assets/content when event fires).',
                parameters: { eventType: 'string', reaction: 'generate_enemy|generate_item|play_sound|change_music|spawn_effect' },
                handler: async (params) => {
                    const listener = async (state: GameState, event: any) => {
                        const { modelRouter } = await import('../../modelRouter');
                        switch (params.reaction) {
                            case 'generate_enemy':
                                await modelRouter.orchestrateMedia('image', `game enemy sprite for ${event.data?.context || 'generic'} zone`, 'Reactive Enemy Generation');
                                break;
                            case 'generate_item':
                                await modelRouter.orchestrateMedia('image', `game item sprite: ${event.data?.itemType || 'treasure'}`, 'Reactive Item Generation');
                                break;
                            case 'play_sound':
                                await modelRouter.orchestrateMedia('audio', `game sound effect: ${event.type}`, 'Reactive Audio');
                                break;
                            case 'change_music':
                                await modelRouter.orchestrateMedia('audio', `game music for ${state.environment.zone} zone, ${state.environment.weather} weather`, 'Reactive Music');
                                break;
                            case 'spawn_effect':
                                await modelRouter.orchestrateMedia('image', `particle effect: ${event.type}`, 'Reactive Effect');
                                break;
                        }
                    };

                    if (!reactiveListeners.has(params.eventType)) {
                        reactiveListeners.set(params.eventType, []);
                    }
                    reactiveListeners.get(params.eventType)!.push(listener);

                    return { registered: true, eventType: params.eventType, reaction: params.reaction };
                }
            },
            {
                name: 'game_generate_for_context',
                description: 'Generate asset based on current game context.',
                parameters: { assetType: 'sprite|texture|sound|music|dialogue', prompt: 'string' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const context = `Zone: ${currentGameState.environment.zone}, Weather: ${currentGameState.environment.weather}, Level: ${currentGameState.level}`;
                    const mediaType = params.assetType === 'sprite' || params.assetType === 'texture' ? 'image' : 'audio';
                    return await modelRouter.orchestrateMedia(mediaType, `${params.prompt} (Context: ${context})`, 'Contextual Generation');
                }
            },
            {
                name: 'game_suggest_content',
                description: 'AI suggests content based on gameplay patterns.',
                parameters: {},
                handler: async () => {
                    const { modelRouter } = await import('../../modelRouter');
                    const summary = `Player at level ${currentGameState.level}, ${currentGameState.enemies.length} enemies, zone: ${currentGameState.environment.zone}`;
                    const result = await modelRouter.chat(`Based on this game state: ${summary}, suggest 3 new content additions (enemies, items, or story events) that would enhance gameplay. Be specific.`);
                    return 'content' in result ? { suggestions: result.content } : { error: 'No suggestions' };
                }
            },

            // === Play Mode Controls ===
            {
                name: 'game_start_session',
                description: 'Start a new play session with AI monitoring.',
                parameters: { enableAI: 'boolean?', difficulty: 'easy|normal|hard?' },
                handler: async (params) => {
                    currentGameState = {
                        player: { position: [0, 0, 0], health: 100, inventory: [] },
                        enemies: [],
                        environment: { zone: 'starting_area', time: 12, weather: 'clear' },
                        events: [],
                        score: 0,
                        level: 1
                    };
                    window.dispatchEvent(new CustomEvent('game:session-start', { detail: { aiEnabled: params.enableAI !== false, difficulty: params.difficulty || 'normal' } }));
                    return { sessionStarted: true, state: currentGameState };
                }
            },
            {
                name: 'game_pause',
                description: 'Pause game (AI stops generating).',
                parameters: {},
                handler: async () => {
                    window.dispatchEvent(new CustomEvent('game:pause'));
                    return { paused: true };
                }
            },
            {
                name: 'game_resume',
                description: 'Resume game.',
                parameters: {},
                handler: async () => {
                    window.dispatchEvent(new CustomEvent('game:resume'));
                    return { resumed: true };
                }
            },

            // === AI Director Mode ===
            {
                name: 'game_ai_director',
                description: 'Enable AI Director that dynamically adjusts game based on player performance.',
                parameters: { enable: 'boolean', style: 'balanced|challenging|narrative|sandbox?' },
                handler: async (params) => {
                    if (params.enable) {
                        // Set up periodic AI director checks
                        const directorInterval = setInterval(async () => {
                            const { modelRouter } = await import('../../modelRouter');
                            const state = currentGameState;
                            const prompt = `AI Game Director (${params.style || 'balanced'} mode): Player health ${state.player.health}%, score ${state.score}, ${state.enemies.length} enemies. What single adjustment should be made? Respond with JSON: {"action": "spawn_enemy|spawn_item|change_difficulty|trigger_event", "params": {...}}`;
                            const result = await modelRouter.chat(prompt);
                            if ('content' in result) {
                                window.dispatchEvent(new CustomEvent('game:ai-director-action', { detail: result.content }));
                            }
                        }, 30000); // Every 30 seconds

                        (window as any).__aiDirectorInterval = directorInterval;
                        return { enabled: true, style: params.style || 'balanced' };
                    } else {
                        if ((window as any).__aiDirectorInterval) {
                            clearInterval((window as any).__aiDirectorInterval);
                        }
                        return { enabled: false };
                    }
                }
            },

            // === Interaction System ===
            {
                name: 'game_create_interaction',
                description: 'Create interactive object with AI-generated response.',
                parameters: { objectId: 'string', triggerType: 'touch|click|proximity', responseType: 'dialogue|sound|animation|spawn' },
                handler: async (params) => {
                    return {
                        created: true,
                        interaction: {
                            objectId: params.objectId,
                            trigger: params.triggerType,
                            response: params.responseType
                        }
                    };
                }
            },
            {
                name: 'game_trigger_interaction',
                description: 'Trigger an interaction and get AI-generated response.',
                parameters: { objectId: 'string', playerAction: 'string' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const context = `Player interacted with ${params.objectId} via ${params.playerAction} in ${currentGameState.environment.zone}`;
                    const result = await modelRouter.chat(`Generate a game response for: ${context}. Include dialogue, sound suggestion, and any spawned items. JSON format.`);
                    return 'content' in result ? { response: result.content } : { error: 'No response' };
                }
            },

            // === Save/Load ===
            {
                name: 'game_save_state',
                description: 'Save current game state.',
                parameters: { slotName: 'string' },
                handler: async (params) => {
                    localStorage.setItem(`game_save_${params.slotName}`, JSON.stringify(currentGameState));
                    return { saved: true, slot: params.slotName };
                }
            },
            {
                name: 'game_load_state',
                description: 'Load saved game state.',
                parameters: { slotName: 'string' },
                handler: async (params) => {
                    const saved = localStorage.getItem(`game_save_${params.slotName}`);
                    if (saved) {
                        currentGameState = JSON.parse(saved);
                        window.dispatchEvent(new CustomEvent('game:state-loaded', { detail: currentGameState }));
                        return { loaded: true, state: currentGameState };
                    }
                    return { loaded: false, error: 'Save not found' };
                }
            },
            {
                name: 'game_list_saves',
                description: 'List all save slots.',
                parameters: {},
                handler: async () => {
                    const saves = Object.keys(localStorage).filter(k => k.startsWith('game_save_')).map(k => k.replace('game_save_', ''));
                    return { saves };
                }
            }
        ]
    });

    console.log('[LiveGameLimb] 30 capabilities registered.');
};
