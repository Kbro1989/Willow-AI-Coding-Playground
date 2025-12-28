import { directorMemory } from './directorMemoryService';

export interface SceneEntity {
    id: string;
    type: string;
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    metadata?: any;
}

class MatrixSceneProbe {
    private entities: Map<string, SceneEntity> = new Map();
    private lastUpdate: number = 0;
    private UPDATE_THRESHOLD = 5000; // Update memory every 5s if changed

    /**
     * Update the known state of an entity
     */
    updateEntity(entity: SceneEntity) {
        this.entities.set(entity.id, entity);
        this.throttleMemoryUpdate();
    }

    /**
     * Remove an entity from the scene knowledge
     */
    removeEntity(id: string) {
        if (this.entities.delete(id)) {
            this.throttleMemoryUpdate();
        }
    }

    /**
     * Clear all scene knowledge
     */
    clear() {
        this.entities.clear();
        this.throttleMemoryUpdate(true);
    }

    /**
     * Get a text summary of the current scene
     */
    getSceneSummary(): string {
        if (this.entities.size === 0) return "Scene is currently empty.";

        const summary = Array.from(this.entities.values())
            .map(e => `- [${e.type}] ${e.id} at (${e.position.map(p => p.toFixed(1)).join(', ')})`)
            .join('\n');

        return `Current Scene Entities:\n${summary}`;
    }

    private throttleMemoryUpdate(force: boolean = false) {
        const now = Date.now();
        if (force || (now - this.lastUpdate > this.UPDATE_THRESHOLD)) {
            this.lastUpdate = now;
            this.syncToDirector();
        }
    }

    private syncToDirector() {
        const summary = this.getSceneSummary();
        directorMemory.addMemory(summary, 'session', 0.7, ['matrix', 'scene-awareness']);
        console.log('[PROBE] Scene state synced to Director Memory.');
    }
}

export const matrixProbe = new MatrixSceneProbe();
export default matrixProbe;
