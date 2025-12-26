/**
 * taskClassifier.ts - Intent Detection & Classification
 * Categorizes tasks into CODE, MEDIA, 3D, or GAME buckets.
 */

export type NexusTaskType = 'CODE' | 'MEDIA' | '3D' | 'GAME' | 'TEXT' | 'VISION';

export interface ClassifiedTask {
    type: NexusTaskType;
    intent: string;
    confidence: number;
}

/**
 * Heuristic-based task classification
 */
export const classifyTask = (prompt: string): ClassifiedTask => {
    const p = prompt.toLowerCase();

    // Vision Intent (Heuristic: Analysis requests)
    if (p.includes('analyze') || p.includes('detect') || p.includes('look at') || p.includes('identify')) {
        return { type: 'VISION', intent: 'IMAGE_ANALYSIS', confidence: 0.9 };
    }

    // 3D Intent
    if (p.includes('model') || p.includes('mesh') || p.includes('texture') || p.includes('vertex') || p.includes('3d')) {
        return { type: '3D', intent: 'GEOMETRY_MOD', confidence: 0.9 };
    }

    // Media Intent
    if (p.includes('image') || p.includes('generate') || p.includes('video') || p.includes('audio') || p.includes('sound')) {
        return { type: 'MEDIA', intent: 'ASSET_GEN', confidence: 0.85 };
    }

    // Code Intent
    if (p.includes('function') || p.includes('code') || p.includes('script') || p.includes('logic') || p.includes('implement')) {
        return { type: 'CODE', intent: 'LOGIC_GEN', confidence: 0.95 };
    }

    // Game Intent
    if (p.includes('player') || p.includes('world') || p.includes('character') || p.includes('level') || p.includes('portal')) {
        return { type: 'GAME', intent: 'STATE_MOD', confidence: 0.8 };
    }

    return { type: 'TEXT', intent: 'CONVERSATION', confidence: 1.0 };
};

/**
 * Validates if the task matches the classified type
 */
export const validateTaskType = (task: ClassifiedTask, actualType: any): boolean => {
    return task.type === actualType.toUpperCase();
};
