/**
 * EntityLimb.ts — Scene Entity Operations (30 fingers)
 * Provides comprehensive control over scene objects: CRUD, transforms, hierarchy, selection, grouping.
 */
import { neuralRegistry } from '../NeuralRegistry';

// We'll store references to the scene state via event-driven architecture
let sceneObjectsRef: any[] = [];
let selectedObjectIdRef: string | null = null;
let updateSceneObjectFn: ((id: string, updates: any) => void) | null = null;
let addSceneObjectFn: ((obj: any) => void) | null = null;
let removeSceneObjectFn: ((id: string) => void) | null = null;

// Binding function — called from App.tsx to wire up state
export const bindEntityLimb = (bindings: {
    getSceneObjects: () => any[],
    getSelectedId: () => string | null,
    updateSceneObject: (id: string, updates: any) => void,
    addSceneObject: (obj: any) => void,
    removeSceneObject: (id: string) => void,
    setSelectedId: (id: string | null) => void
}) => {
    // Update refs on each call
    sceneObjectsRef = bindings.getSceneObjects();
    selectedObjectIdRef = bindings.getSelectedId();
    updateSceneObjectFn = bindings.updateSceneObject;
    addSceneObjectFn = bindings.addSceneObject;
    removeSceneObjectFn = bindings.removeSceneObject;

    // Listen for state updates
    window.addEventListener('scene:state-update', (e: any) => {
        sceneObjectsRef = e.detail.sceneObjects || sceneObjectsRef;
        selectedObjectIdRef = e.detail.selectedId ?? selectedObjectIdRef;
    });
};

const generateId = () => `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const registerEntityLimb = () => {
    neuralRegistry.registerLimb({
        id: 'entity',
        name: 'Entity Operations',
        description: 'Full CRUD and transform control for scene entities.',
        capabilities: [
            // === CRUD Operations ===
            {
                name: 'entity_create',
                description: 'Create a new scene entity with specified properties.',
                parameters: { name: 'string', type: 'prop|npc|light|trigger', position: '[x,y,z]?' },
                handler: async (params) => {
                    const newEntity = {
                        id: generateId(),
                        name: params.name || 'New Entity',
                        type: params.type || 'prop',
                        position: params.position || [0, 1, 0],
                        rotation: [0, 0, 0],
                        scale: [1, 1, 1],
                        visible: true,
                        behaviors: []
                    };
                    addSceneObjectFn?.(newEntity);
                    return { success: true, id: newEntity.id, message: `Created entity "${newEntity.name}"` };
                }
            },
            {
                name: 'entity_delete',
                description: 'Delete an entity by ID.',
                parameters: { id: 'string' },
                handler: async (params) => {
                    removeSceneObjectFn?.(params.id);
                    return { success: true, message: `Deleted entity ${params.id}` };
                }
            },
            {
                name: 'entity_clone',
                description: 'Clone an existing entity.',
                parameters: { id: 'string' },
                handler: async (params) => {
                    const source = sceneObjectsRef.find(o => o.id === params.id);
                    if (!source) return { success: false, error: 'Entity not found' };
                    const clone = { ...source, id: generateId(), name: `${source.name}_clone` };
                    addSceneObjectFn?.(clone);
                    return { success: true, id: clone.id, message: `Cloned "${source.name}"` };
                }
            },
            {
                name: 'entity_rename',
                description: 'Rename an entity.',
                parameters: { id: 'string', name: 'string' },
                handler: async (params) => {
                    updateSceneObjectFn?.(params.id, { name: params.name });
                    return { success: true, message: `Renamed to "${params.name}"` };
                }
            },
            {
                name: 'entity_list',
                description: 'List all entities in the scene.',
                parameters: {},
                handler: async () => {
                    return { count: sceneObjectsRef.length, entities: sceneObjectsRef.map(e => ({ id: e.id, name: e.name, type: e.type })) };
                }
            },
            {
                name: 'entity_get',
                description: 'Get full details of an entity by ID.',
                parameters: { id: 'string' },
                handler: async (params) => {
                    const entity = sceneObjectsRef.find(o => o.id === params.id);
                    return entity ? { success: true, entity } : { success: false, error: 'Not found' };
                }
            },

            // === Transform Operations ===
            {
                name: 'entity_set_position',
                description: 'Set entity position [x, y, z].',
                parameters: { id: 'string', position: '[x,y,z]' },
                handler: async (params) => {
                    updateSceneObjectFn?.(params.id, { position: params.position });
                    return { success: true, position: params.position };
                }
            },
            {
                name: 'entity_set_rotation',
                description: 'Set entity rotation in degrees [x, y, z].',
                parameters: { id: 'string', rotation: '[x,y,z]' },
                handler: async (params) => {
                    updateSceneObjectFn?.(params.id, { rotation: params.rotation });
                    return { success: true, rotation: params.rotation };
                }
            },
            {
                name: 'entity_set_scale',
                description: 'Set entity scale [x, y, z].',
                parameters: { id: 'string', scale: '[x,y,z]' },
                handler: async (params) => {
                    updateSceneObjectFn?.(params.id, { scale: params.scale });
                    return { success: true, scale: params.scale };
                }
            },
            {
                name: 'entity_translate',
                description: 'Move entity by delta [dx, dy, dz].',
                parameters: { id: 'string', delta: '[dx,dy,dz]' },
                handler: async (params) => {
                    const entity = sceneObjectsRef.find(o => o.id === params.id);
                    if (!entity) return { success: false, error: 'Not found' };
                    const newPos = entity.position.map((v: number, i: number) => v + (params.delta[i] || 0));
                    updateSceneObjectFn?.(params.id, { position: newPos });
                    return { success: true, position: newPos };
                }
            },
            {
                name: 'entity_rotate_by',
                description: 'Rotate entity by delta degrees [dx, dy, dz].',
                parameters: { id: 'string', delta: '[dx,dy,dz]' },
                handler: async (params) => {
                    const entity = sceneObjectsRef.find(o => o.id === params.id);
                    if (!entity) return { success: false, error: 'Not found' };
                    const newRot = entity.rotation.map((v: number, i: number) => v + (params.delta[i] || 0));
                    updateSceneObjectFn?.(params.id, { rotation: newRot });
                    return { success: true, rotation: newRot };
                }
            },
            {
                name: 'entity_scale_by',
                description: 'Scale entity by factor [fx, fy, fz].',
                parameters: { id: 'string', factor: '[fx,fy,fz]' },
                handler: async (params) => {
                    const entity = sceneObjectsRef.find(o => o.id === params.id);
                    if (!entity) return { success: false, error: 'Not found' };
                    const newScale = entity.scale.map((v: number, i: number) => v * (params.factor[i] || 1));
                    updateSceneObjectFn?.(params.id, { scale: newScale });
                    return { success: true, scale: newScale };
                }
            },
            {
                name: 'entity_reset_transform',
                description: 'Reset entity to origin with default transform.',
                parameters: { id: 'string' },
                handler: async (params) => {
                    updateSceneObjectFn?.(params.id, { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] });
                    return { success: true, message: 'Transform reset' };
                }
            },
            {
                name: 'entity_ground',
                description: 'Place entity on ground (Y=0 adjusted for scale).',
                parameters: { id: 'string' },
                handler: async (params) => {
                    const entity = sceneObjectsRef.find(o => o.id === params.id);
                    if (!entity) return { success: false, error: 'Not found' };
                    const groundY = entity.scale[1] / 2;
                    updateSceneObjectFn?.(params.id, { position: [entity.position[0], groundY, entity.position[2]] });
                    return { success: true, y: groundY };
                }
            },
            {
                name: 'entity_center_at_origin',
                description: 'Move entity to world origin [0,0,0].',
                parameters: { id: 'string' },
                handler: async (params) => {
                    updateSceneObjectFn?.(params.id, { position: [0, 0, 0] });
                    return { success: true };
                }
            },

            // === Visibility & Properties ===
            {
                name: 'entity_set_visible',
                description: 'Set entity visibility.',
                parameters: { id: 'string', visible: 'boolean' },
                handler: async (params) => {
                    updateSceneObjectFn?.(params.id, { visible: params.visible });
                    return { success: true, visible: params.visible };
                }
            },
            {
                name: 'entity_toggle_visible',
                description: 'Toggle entity visibility.',
                parameters: { id: 'string' },
                handler: async (params) => {
                    const entity = sceneObjectsRef.find(o => o.id === params.id);
                    if (!entity) return { success: false, error: 'Not found' };
                    updateSceneObjectFn?.(params.id, { visible: !entity.visible });
                    return { success: true, visible: !entity.visible };
                }
            },
            {
                name: 'entity_set_layer',
                description: 'Set entity layer/tag for filtering.',
                parameters: { id: 'string', layer: 'string' },
                handler: async (params) => {
                    updateSceneObjectFn?.(params.id, { layer: params.layer });
                    return { success: true, layer: params.layer };
                }
            },
            {
                name: 'entity_add_behavior',
                description: 'Add a behavior to entity (spin, float, pathfind, reactive, trigger).',
                parameters: { id: 'string', behavior: 'string' },
                handler: async (params) => {
                    const entity = sceneObjectsRef.find(o => o.id === params.id);
                    if (!entity) return { success: false, error: 'Not found' };
                    const behaviors = [...(entity.behaviors || [])];
                    if (!behaviors.includes(params.behavior)) behaviors.push(params.behavior);
                    updateSceneObjectFn?.(params.id, { behaviors });
                    return { success: true, behaviors };
                }
            },
            {
                name: 'entity_remove_behavior',
                description: 'Remove a behavior from entity.',
                parameters: { id: 'string', behavior: 'string' },
                handler: async (params) => {
                    const entity = sceneObjectsRef.find(o => o.id === params.id);
                    if (!entity) return { success: false, error: 'Not found' };
                    const behaviors = (entity.behaviors || []).filter((b: string) => b !== params.behavior);
                    updateSceneObjectFn?.(params.id, { behaviors });
                    return { success: true, behaviors };
                }
            },

            // === Selection Operations ===
            {
                name: 'entity_select',
                description: 'Select an entity by ID.',
                parameters: { id: 'string' },
                handler: async (params) => {
                    window.dispatchEvent(new CustomEvent('entity:select', { detail: { id: params.id } }));
                    return { success: true, selected: params.id };
                }
            },
            {
                name: 'entity_deselect',
                description: 'Clear entity selection.',
                parameters: {},
                handler: async () => {
                    window.dispatchEvent(new CustomEvent('entity:select', { detail: { id: null } }));
                    return { success: true, selected: null };
                }
            },
            {
                name: 'entity_select_all',
                description: 'Select all entities.',
                parameters: {},
                handler: async () => {
                    const ids = sceneObjectsRef.map(e => e.id);
                    window.dispatchEvent(new CustomEvent('entity:select-multiple', { detail: { ids } }));
                    return { success: true, count: ids.length };
                }
            },
            {
                name: 'entity_select_by_type',
                description: 'Select all entities of a specific type.',
                parameters: { type: 'string' },
                handler: async (params) => {
                    const ids = sceneObjectsRef.filter(e => e.type === params.type).map(e => e.id);
                    window.dispatchEvent(new CustomEvent('entity:select-multiple', { detail: { ids } }));
                    return { success: true, count: ids.length, type: params.type };
                }
            },
            {
                name: 'entity_get_selected',
                description: 'Get the currently selected entity ID.',
                parameters: {},
                handler: async () => {
                    return { selectedId: selectedObjectIdRef };
                }
            },

            // === Batch Operations ===
            {
                name: 'entity_delete_all',
                description: 'Delete all entities in the scene.',
                parameters: { confirm: 'boolean' },
                handler: async (params) => {
                    if (!params.confirm) return { success: false, error: 'Confirmation required' };
                    const count = sceneObjectsRef.length;
                    sceneObjectsRef.forEach(e => removeSceneObjectFn?.(e.id));
                    return { success: true, deleted: count };
                }
            },
            {
                name: 'entity_hide_all',
                description: 'Hide all entities.',
                parameters: {},
                handler: async () => {
                    sceneObjectsRef.forEach(e => updateSceneObjectFn?.(e.id, { visible: false }));
                    return { success: true, hidden: sceneObjectsRef.length };
                }
            },
            {
                name: 'entity_show_all',
                description: 'Show all entities.',
                parameters: {},
                handler: async () => {
                    sceneObjectsRef.forEach(e => updateSceneObjectFn?.(e.id, { visible: true }));
                    return { success: true, shown: sceneObjectsRef.length };
                }
            },
            {
                name: 'entity_randomize_positions',
                description: 'Randomize positions of all entities within a radius.',
                parameters: { radius: 'number' },
                handler: async (params) => {
                    const r = params.radius || 10;
                    sceneObjectsRef.forEach(e => {
                        const pos = [(Math.random() - 0.5) * r * 2, e.position[1], (Math.random() - 0.5) * r * 2];
                        updateSceneObjectFn?.(e.id, { position: pos });
                    });
                    return { success: true, radius: r, count: sceneObjectsRef.length };
                }
            },
            {
                name: 'entity_align_to_grid',
                description: 'Snap all entity positions to a grid.',
                parameters: { gridSize: 'number' },
                handler: async (params) => {
                    const g = params.gridSize || 1;
                    sceneObjectsRef.forEach(e => {
                        const pos = e.position.map((v: number) => Math.round(v / g) * g);
                        updateSceneObjectFn?.(e.id, { position: pos });
                    });
                    return { success: true, gridSize: g, count: sceneObjectsRef.length };
                }
            }
        ]
    });

    console.log('[EntityLimb] 30 capabilities registered.');
};
