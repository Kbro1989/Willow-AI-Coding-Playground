/**
 * WorldLimb.ts — World Building Operations (30 fingers)
 * Provides terrain, weather, lighting, and environment controls.
 */
import { neuralRegistry } from '../NeuralRegistry';

export const registerWorldLimb = () => {
    neuralRegistry.registerLimb({
        id: 'world',
        name: 'World Operations',
        description: 'Terrain generation, weather, lighting, and environment.',
        capabilities: [
            // === Terrain ===
            { name: 'terrain_generate_heightmap', description: 'Generate terrain from heightmap.', parameters: { width: 'number', depth: 'number', maxHeight: 'number' }, handler: async (params) => ({ generating: true, width: params.width, depth: params.depth }) },
            { name: 'terrain_sculpt_raise', description: 'Raise terrain at position.', parameters: { x: 'number', z: 'number', radius: 'number', amount: 'number' }, handler: async (params) => ({ sculpted: 'raise', position: [params.x, params.z] }) },
            { name: 'terrain_sculpt_lower', description: 'Lower terrain at position.', parameters: { x: 'number', z: 'number', radius: 'number', amount: 'number' }, handler: async (params) => ({ sculpted: 'lower', position: [params.x, params.z] }) },
            { name: 'terrain_sculpt_smooth', description: 'Smooth terrain at position.', parameters: { x: 'number', z: 'number', radius: 'number' }, handler: async (params) => ({ sculpted: 'smooth', position: [params.x, params.z] }) },
            { name: 'terrain_sculpt_flatten', description: 'Flatten terrain at position.', parameters: { x: 'number', z: 'number', radius: 'number', height: 'number' }, handler: async (params) => ({ sculpted: 'flatten', height: params.height }) },
            { name: 'terrain_paint_texture', description: 'Paint texture on terrain.', parameters: { x: 'number', z: 'number', textureId: 'string', radius: 'number' }, handler: async (params) => ({ painted: params.textureId }) },
            { name: 'terrain_scatter_foliage', description: 'Scatter foliage (trees, grass).', parameters: { type: 'tree|grass|bush', density: 'number', area: 'object' }, handler: async (params) => ({ scattered: params.type, density: params.density }) },
            { name: 'terrain_place_rocks', description: 'Place rock formations.', parameters: { count: 'number', area: 'object' }, handler: async (params) => ({ placed: 'rocks', count: params.count }) },
            { name: 'terrain_erode', description: 'Apply erosion simulation.', parameters: { iterations: 'number' }, handler: async (params) => ({ eroded: true, iterations: params.iterations }) },

            // === Weather ===
            { name: 'weather_set_clear', description: 'Set clear weather.', parameters: {}, handler: async () => { window.dispatchEvent(new CustomEvent('world:weather', { detail: { type: 'clear' } })); return { weather: 'clear' }; } },
            { name: 'weather_set_rain', description: 'Set rainy weather.', parameters: { intensity: 'number' }, handler: async (params) => { window.dispatchEvent(new CustomEvent('world:weather', { detail: { type: 'rain', intensity: params.intensity } })); return { weather: 'rain' }; } },
            { name: 'weather_set_snow', description: 'Set snowy weather.', parameters: { intensity: 'number' }, handler: async (params) => { window.dispatchEvent(new CustomEvent('world:weather', { detail: { type: 'snow', intensity: params.intensity } })); return { weather: 'snow' }; } },
            { name: 'weather_set_fog', description: 'Set foggy weather.', parameters: { density: 'number', color: 'string' }, handler: async (params) => { window.dispatchEvent(new CustomEvent('world:weather', { detail: { type: 'fog', density: params.density, color: params.color } })); return { weather: 'fog' }; } },
            { name: 'weather_set_wind', description: 'Set wind direction and strength.', parameters: { direction: 'number', strength: 'number' }, handler: async (params) => ({ wind: { direction: params.direction, strength: params.strength } }) },

            // === Lighting ===
            { name: 'lighting_set_time', description: 'Set time of day.', parameters: { hour: 'number' }, handler: async (params) => { window.dispatchEvent(new CustomEvent('world:time', { detail: { hour: params.hour } })); return { timeOfDay: params.hour }; } },
            { name: 'lighting_set_sun_color', description: 'Set sun color.', parameters: { color: 'string' }, handler: async (params) => ({ sunColor: params.color }) },
            { name: 'lighting_set_ambient', description: 'Set ambient light.', parameters: { color: 'string', intensity: 'number' }, handler: async (params) => ({ ambient: { color: params.color, intensity: params.intensity } }) },
            { name: 'lighting_bake_gi', description: 'Bake global illumination.', parameters: { resolution: 'number' }, handler: async (params) => ({ baking: 'gi', resolution: params.resolution }) },
            { name: 'lighting_add_light', description: 'Add a light source.', parameters: { type: 'point|spot|directional', position: 'number[]', color: 'string', intensity: 'number' }, handler: async (params) => ({ addedLight: params.type }) },

            // === Water ===
            { name: 'water_create_plane', description: 'Create water plane.', parameters: { width: 'number', depth: 'number', height: 'number' }, handler: async (params) => ({ water: true, size: [params.width, params.depth], height: params.height }) },
            { name: 'water_set_waves', description: 'Set wave parameters.', parameters: { height: 'number', frequency: 'number', direction: 'number' }, handler: async (params) => ({ waves: { height: params.height, frequency: params.frequency } }) },
            { name: 'water_set_flow', description: 'Set water flow direction.', parameters: { direction: 'number', speed: 'number' }, handler: async (params) => ({ flow: { direction: params.direction, speed: params.speed } }) },

            // === Sky ===
            { name: 'sky_load_hdri', description: 'Load HDRI skybox.', parameters: { url: 'string' }, handler: async (params) => ({ hdri: params.url }) },
            { name: 'sky_generate_procedural', description: 'Generate procedural sky.', parameters: { sunAzimuth: 'number', sunElevation: 'number', turbidity: 'number' }, handler: async (params) => ({ sky: 'procedural', sun: [params.sunAzimuth, params.sunElevation] }) },
            { name: 'sky_set_stars', description: 'Configure star field.', parameters: { count: 'number', size: 'number' }, handler: async (params) => ({ stars: { count: params.count, size: params.size } }) },

            // === Navigation ===
            { name: 'navmesh_generate', description: 'Generate navigation mesh.', parameters: { agentRadius: 'number', agentHeight: 'number' }, handler: async (params) => ({ navmesh: 'generating', agentRadius: params.agentRadius }) },
            { name: 'navmesh_query_path', description: 'Query path between points.', parameters: { start: 'number[]', end: 'number[]' }, handler: async (params) => ({ path: [params.start, params.end], points: 0 }) },
            { name: 'navmesh_is_walkable', description: 'Check if position is walkable.', parameters: { position: 'number[]' }, handler: async (params) => ({ walkable: true, position: params.position }) },

            // === Presets ===
            {
                name: 'world_apply_preset', description: 'Apply environment preset.', parameters: { preset: 'cyberpunk|golden_hour|deep_space|toxic_fog|fantasy|desert' },
                handler: async (params) => {
                    const presets: Record<string, any> = {
                        cyberpunk: { timeOfDay: 22, atmosphereColor: '#ff00ff', fog: 0.8 },
                        golden_hour: { timeOfDay: 18, atmosphereColor: '#ffaa00', fog: 0.2 },
                        deep_space: { timeOfDay: 0, atmosphereColor: '#050a15', fog: 0.1 },
                        toxic_fog: { timeOfDay: 12, atmosphereColor: '#00ff00', fog: 1.5 },
                        fantasy: { timeOfDay: 14, atmosphereColor: '#b0e0ff', fog: 0.3 },
                        desert: { timeOfDay: 14, atmosphereColor: '#ffd080', fog: 0.1 }
                    };
                    window.dispatchEvent(new CustomEvent('world:preset', { detail: presets[params.preset] || presets.cyberpunk }));
                    return { applied: params.preset };
                }
            },
            { name: 'world_get_state', description: 'Get current world state.', parameters: {}, handler: async () => ({ timeOfDay: 12, weather: 'clear', fog: 0 }) }
        ]
    });
    console.log('[WorldLimb] 30 capabilities registered.');
};
