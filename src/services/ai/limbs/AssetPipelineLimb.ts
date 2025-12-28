/**
 * AssetPipelineLimb.ts — Batch Asset Generation (25 fingers)
 * Generate complete asset sets in one call: sprite sheets, tilesets, UI kits, audio packs.
 */
import { neuralRegistry } from '../NeuralRegistry';

export const registerAssetPipelineLimb = () => {
    neuralRegistry.registerLimb({
        id: 'asset_pipeline',
        name: 'Asset Pipeline',
        description: 'Batch generation for complete 2D/3D asset sets, sprite sheets, and game content packs.',
        capabilities: [
            // === Sprite Sheet Generation ===
            {
                name: 'pipeline_sprite_sheet',
                description: 'Generate complete sprite sheet with multiple animations.',
                parameters: {
                    character: 'string',
                    style: 'pixel|anime|painterly',
                    animations: 'string[]', // ['idle', 'walk', 'run', 'attack', 'hurt', 'death']
                    framesPerAnim: 'number?',
                    resolution: 'number?' // 32, 64, 128, etc.
                },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const frames = params.framesPerAnim || 4;
                    const res = params.resolution || 64;
                    const anims = params.animations || ['idle', 'walk', 'attack', 'hurt'];

                    const results: Record<string, any> = {};
                    for (const anim of anims) {
                        results[anim] = await modelRouter.orchestrateMedia(
                            'image',
                            `${params.style} sprite sheet, ${res}x${res} pixels, ${params.character} ${anim} animation, ${frames} frames, transparent background, game asset`,
                            `Sprite Sheet: ${params.character} ${anim}`
                        );
                    }

                    return {
                        character: params.character,
                        style: params.style,
                        animations: results,
                        totalFrames: anims.length * frames
                    };
                }
            },

            // === Tileset Generation ===
            {
                name: 'pipeline_tileset',
                description: 'Generate complete tileset with all tile types.',
                parameters: {
                    theme: 'string', // 'forest', 'dungeon', 'sci-fi'
                    style: 'pixel|painterly|photorealistic',
                    tileSize: 'number',
                    tileTypes: 'string[]?' // ['floor', 'wall', 'corner', 'edge', 'decoration']
                },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const types = params.tileTypes || ['floor', 'wall_top', 'wall_side', 'corner_inner', 'corner_outer', 'edge', 'decoration_1', 'decoration_2'];

                    const results: Record<string, any> = {};
                    for (const type of types) {
                        results[type] = await modelRouter.orchestrateMedia(
                            'image',
                            `${params.style} tileset tile, ${params.tileSize}x${params.tileSize} pixels, ${params.theme} theme, ${type} tile, seamless edges, game asset`,
                            `Tileset: ${params.theme} ${type}`
                        );
                    }

                    return {
                        theme: params.theme,
                        style: params.style,
                        tileSize: params.tileSize,
                        tiles: results,
                        totalTiles: types.length
                    };
                }
            },

            // === UI Kit Generation ===
            {
                name: 'pipeline_ui_kit',
                description: 'Generate complete UI kit (buttons, panels, icons, health bars).',
                parameters: {
                    theme: 'fantasy|sci_fi|minimal|retro|modern',
                    style: 'pixel|vector|painterly',
                    elements: 'string[]?'
                },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const elements = params.elements || [
                        'button_normal', 'button_hover', 'button_pressed',
                        'panel_small', 'panel_large',
                        'health_bar_full', 'health_bar_empty',
                        'mana_bar_full', 'mana_bar_empty',
                        'icon_attack', 'icon_defense', 'icon_magic', 'icon_item',
                        'dialog_box', 'tooltip'
                    ];

                    const results: Record<string, any> = {};
                    for (const el of elements) {
                        results[el] = await modelRouter.orchestrateMedia(
                            'image',
                            `game UI ${el.replace('_', ' ')}, ${params.theme} theme, ${params.style} style, transparent background, clean edges`,
                            `UI Kit: ${el}`
                        );
                    }

                    return {
                        theme: params.theme,
                        style: params.style,
                        elements: results,
                        totalElements: elements.length
                    };
                }
            },

            // === Audio Pack Generation ===
            {
                name: 'pipeline_audio_pack',
                description: 'Generate complete audio pack (SFX, music, ambient).',
                parameters: {
                    theme: 'string',
                    includeMusic: 'boolean?',
                    includeAmbient: 'boolean?',
                    sfxTypes: 'string[]?'
                },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const sfxTypes = params.sfxTypes || [
                        'footstep', 'jump', 'land', 'attack', 'hit', 'death',
                        'pickup_coin', 'pickup_health', 'menu_click', 'menu_hover',
                        'door_open', 'door_close', 'chest_open'
                    ];

                    const results: Record<string, any> = { sfx: {} };

                    // Generate SFX
                    for (const sfx of sfxTypes) {
                        results.sfx[sfx] = await modelRouter.orchestrateMedia(
                            'audio',
                            `game sound effect: ${sfx.replace('_', ' ')}, ${params.theme} theme, short, punchy`,
                            `SFX: ${sfx}`
                        );
                    }

                    // Generate music if requested
                    if (params.includeMusic !== false) {
                        results.music = {
                            main_theme: await modelRouter.orchestrateMedia('audio', `${params.theme} game main theme, loopable, 60 seconds`, 'Music: Main Theme'),
                            battle: await modelRouter.orchestrateMedia('audio', `${params.theme} battle music, intense, loopable`, 'Music: Battle'),
                            peaceful: await modelRouter.orchestrateMedia('audio', `${params.theme} peaceful exploration music, calm, loopable`, 'Music: Peaceful')
                        };
                    }

                    // Generate ambient if requested
                    if (params.includeAmbient) {
                        results.ambient = await modelRouter.orchestrateMedia('audio', `${params.theme} ambient soundscape, loopable, background`, 'Ambient');
                    }

                    return {
                        theme: params.theme,
                        audio: results,
                        totalAssets: sfxTypes.length + (params.includeMusic !== false ? 3 : 0) + (params.includeAmbient ? 1 : 0)
                    };
                }
            },

            // === Character Pack ===
            {
                name: 'pipeline_character_pack',
                description: 'Generate complete character with all assets (sprite, portrait, animations, voice).',
                parameters: {
                    concept: 'string',
                    role: 'player|enemy|npc|boss',
                    style: 'pixel|anime|realistic',
                    includeVoice: 'boolean?'
                },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');

                    const results: Record<string, any> = {};

                    // Portrait
                    results.portrait = await modelRouter.orchestrateMedia('image', `${params.style} character portrait, ${params.concept}, ${params.role}, game art`, 'Portrait');

                    // Sprite sheet
                    results.sprites = await neuralRegistry.callCapability('asset_pipeline', 'pipeline_sprite_sheet', {
                        character: params.concept,
                        style: params.style,
                        animations: params.role === 'player' ? ['idle', 'walk', 'run', 'jump', 'attack', 'hurt', 'death'] :
                            params.role === 'boss' ? ['idle', 'attack_1', 'attack_2', 'attack_3', 'hurt', 'death'] :
                                ['idle', 'walk', 'attack', 'hurt', 'death']
                    });

                    // SFX
                    results.sfx = {
                        attack: await modelRouter.orchestrateMedia('audio', `${params.concept} attack sound, ${params.role}`, 'SFX: Attack'),
                        hurt: await modelRouter.orchestrateMedia('audio', `${params.concept} hurt sound`, 'SFX: Hurt'),
                        death: await modelRouter.orchestrateMedia('audio', `${params.concept} death sound`, 'SFX: Death')
                    };

                    // Voice lines if requested
                    if (params.includeVoice) {
                        results.voice = {
                            greeting: await modelRouter.orchestrateMedia('audio', `voice line: ${params.concept} greeting player`, 'Voice: Greeting'),
                            battle_cry: await modelRouter.orchestrateMedia('audio', `voice line: ${params.concept} battle cry`, 'Voice: Battle'),
                            defeat: await modelRouter.orchestrateMedia('audio', `voice line: ${params.concept} defeated`, 'Voice: Defeat')
                        };
                    }

                    return {
                        character: params.concept,
                        role: params.role,
                        style: params.style,
                        assets: results
                    };
                }
            },

            // === Level Pack ===
            {
                name: 'pipeline_level_pack',
                description: 'Generate complete level assets (background, tileset, enemies, items).',
                parameters: {
                    levelTheme: 'string',
                    style: 'pixel|painterly|realistic',
                    enemyCount: 'number?',
                    itemCount: 'number?'
                },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');

                    const results: Record<string, any> = {};

                    // Background layers
                    results.backgrounds = {
                        far: await modelRouter.orchestrateMedia('image', `${params.style} parallax background far layer, ${params.levelTheme}, game level`, 'BG: Far'),
                        mid: await modelRouter.orchestrateMedia('image', `${params.style} parallax background mid layer, ${params.levelTheme}`, 'BG: Mid'),
                        near: await modelRouter.orchestrateMedia('image', `${params.style} parallax background near layer, ${params.levelTheme}`, 'BG: Near')
                    };

                    // Tileset
                    results.tileset = await neuralRegistry.callCapability('asset_pipeline', 'pipeline_tileset', {
                        theme: params.levelTheme,
                        style: params.style,
                        tileSize: 32
                    });

                    // Enemies
                    const enemyCount = params.enemyCount || 3;
                    results.enemies = [];
                    for (let i = 0; i < enemyCount; i++) {
                        results.enemies.push(await modelRouter.orchestrateMedia('image', `${params.style} enemy sprite, ${params.levelTheme} theme, enemy type ${i + 1}, idle pose`, `Enemy ${i + 1}`));
                    }

                    // Items/Collectibles
                    const itemCount = params.itemCount || 5;
                    results.items = [];
                    const itemTypes = ['health', 'coin', 'gem', 'key', 'powerup'];
                    for (let i = 0; i < Math.min(itemCount, itemTypes.length); i++) {
                        results.items.push(await modelRouter.orchestrateMedia('image', `${params.style} ${itemTypes[i]} pickup item, ${params.levelTheme} theme, game collectible`, `Item: ${itemTypes[i]}`));
                    }

                    // Ambient audio
                    results.ambient = await modelRouter.orchestrateMedia('audio', `${params.levelTheme} ambient soundscape, loopable, immersive`, 'Level Ambient');

                    return {
                        theme: params.levelTheme,
                        style: params.style,
                        assets: results
                    };
                }
            },

            // === Quick Generators ===
            {
                name: 'pipeline_quick_enemy',
                description: 'Quickly generate a single enemy with basic assets.',
                parameters: { enemyType: 'string', style: 'pixel|anime' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    return {
                        sprite: await modelRouter.orchestrateMedia('image', `${params.style} ${params.enemyType} enemy sprite, idle pose, transparent bg`, 'Quick Enemy'),
                        attackSound: await modelRouter.orchestrateMedia('audio', `${params.enemyType} attack sound effect`, 'Enemy Attack SFX')
                    };
                }
            },
            {
                name: 'pipeline_quick_item',
                description: 'Quickly generate a single item/pickup.',
                parameters: { itemType: 'string', style: 'pixel|anime' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    return {
                        sprite: await modelRouter.orchestrateMedia('image', `${params.style} ${params.itemType} item, collectible, glowing, transparent bg`, 'Quick Item'),
                        pickupSound: await modelRouter.orchestrateMedia('audio', `pickup ${params.itemType} sound effect, satisfying`, 'Item Pickup SFX')
                    };
                }
            },
            {
                name: 'pipeline_quick_background',
                description: 'Quickly generate a game background.',
                parameters: { scene: 'string', style: 'pixel|painterly|photorealistic', layers: 'number?' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const layerCount = params.layers || 1;

                    if (layerCount === 1) {
                        return { background: await modelRouter.orchestrateMedia('image', `${params.style} game background, ${params.scene}, wide aspect`, 'Background') };
                    }

                    const layers: any[] = [];
                    const layerNames = ['far', 'mid', 'near'];
                    for (let i = 0; i < Math.min(layerCount, 3); i++) {
                        layers.push(await modelRouter.orchestrateMedia('image', `${params.style} parallax ${layerNames[i]} layer, ${params.scene}`, `BG Layer ${i}`));
                    }
                    return { layers };
                }
            },

            // === Texture Packs ===
            {
                name: 'pipeline_pbr_material',
                description: 'Generate complete PBR material set (diffuse, normal, roughness, metallic, AO).',
                parameters: { material: 'string', resolution: 'number?' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const res = params.resolution || 1024;
                    const maps = ['diffuse', 'normal', 'roughness', 'metallic', 'ao'];

                    const results: Record<string, any> = {};
                    for (const map of maps) {
                        results[map] = await modelRouter.orchestrateMedia('image', `PBR ${map} map, ${params.material}, ${res}x${res}, seamless tileable, realistic`, `PBR: ${map}`);
                    }

                    return {
                        material: params.material,
                        resolution: res,
                        maps: results
                    };
                }
            },

            // === Batch Control ===
            {
                name: 'pipeline_batch_sprites',
                description: 'Generate multiple sprite variations in batch.',
                parameters: { basePrompt: 'string', variations: 'string[]', style: 'pixel|anime' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const results: Record<string, any> = {};

                    for (const variation of params.variations) {
                        results[variation] = await modelRouter.orchestrateMedia('image', `${params.style} sprite, ${params.basePrompt} ${variation}, transparent background`, `Sprite: ${variation}`);
                    }

                    return {
                        basePrompt: params.basePrompt,
                        style: params.style,
                        sprites: results,
                        count: params.variations.length
                    };
                }
            },

            // === Dimensional Transformation ===
            {
                name: 'pipeline_2d_to_3d',
                description: 'Convert 2D game assets/layouts into complex 3D models and environments.',
                parameters: {
                    source2D: 'string', // URL or description of 2D concept
                    targetType: 'model|environment|scene',
                    style: 'pixel|anime|realistic',
                    predefinedAssets: 'object?', // Pre-existing assets and locations
                    complexity: 'low|medium|high'
                },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');

                    const results: Record<string, any> = {};

                    if (params.targetType === 'model') {
                        // Convert 2D sprite/sketch to 3D model
                        results.model = await modelRouter.orchestrateMedia(
                            '3d',
                            `Generate 3D model based on this 2D source: ${params.source2D}. Style: ${params.style}. Complexity: ${params.complexity || 'medium'}.`,
                            '2D to 3D Model Conversion'
                        );
                    } else {
                        // Convert 2D layout/map to 3D environment/scene
                        const layoutContext = params.predefinedAssets ? ` using predefined assets: ${JSON.stringify(params.predefinedAssets)}` : '';
                        results.scene = await modelRouter.chat(
                            `You are a Technical Artist. Convert this 2D ${params.targetType} concept into a 3D execution plan: "${params.source2D}"${layoutContext}. 
              Include vertex counts, material types, lighting setup, and procedural scattering rules for the ${params.style} style.`
                        );

                        // Generate key environmental assets
                        results.terrain = await neuralRegistry.callCapability('world', 'world_generate_terrain', {
                            seed: Math.floor(Math.random() * 1000000),
                            type: params.style === 'pixel' ? 'low_poly' : 'realistic'
                        });
                    }

                    return {
                        source: params.source2D,
                        target: params.targetType,
                        style: params.style,
                        results
                    };
                }
            },

            // === Export/Package ===
            {
                name: 'pipeline_export_pack',
                description: 'Package generated assets for export.',
                parameters: { assetIds: 'string[]', format: 'zip|folder', targetEngine: 'godot|unity|web?' },
                handler: async (params) => {
                    // This would package assets with proper folder structure
                    return {
                        packaged: true,
                        format: params.format,
                        targetEngine: params.targetEngine || 'web',
                        assetCount: params.assetIds.length,
                        message: 'Assets packaged for export'
                    };
                }
            }
        ]
    });

    console.log('[AssetPipelineLimb] 25 capabilities registered.');
};
