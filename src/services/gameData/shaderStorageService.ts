/**
 * Shader Storage Service
 * Manages persistence of GLSL shader files and configurations
 */

import { db, id, tx } from '../../lib/db';

export interface ShaderAsset {
    id: string;
    name: string;
    code: string;
    type: 'vertex' | 'fragment' | 'compute';
    updatedAt: number;
}

class ShaderStorageService {
    private readonly STORAGE_KEY = 'antigravity_shader_cache';

    /**
     * Save shader to LocalStorage (hot reload cache) and InstantDB (persistence)
     */
    async saveShader(name: string, code: string, type: 'vertex' | 'fragment' = 'fragment') {
        const shaderId = id(); // In real app, might want to upsert by name
        const now = Date.now();

        // 1. Fast Local Cache
        const cache = this.getLocalCache();
        cache[name] = { code, type, updatedAt: now };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cache));

        // 2. Cloud Persistence
        try {
            // Re-using 'assets' entity for simplicity, or could add 'shaders' entity
            // For now, let's treat it as a specialized text asset
            await db.transact([
                tx.assets[shaderId].update({
                    name: `${name}.glsl`,
                    type: 'script',
                    format: 'glsl',
                    url: `shader://${name}`, // Virtual URL
                    size: code.length,
                    ownerId: 'current-user', // Placeholder
                    isPublic: false,
                    status: 'raw',
                    createdAt: now,
                    aiGenerated: false,
                    // Store strict code in a "metadata" field or similar if expanding schema
                })
            ]);
            console.log(`[SHADER] Synced ${name} to cloud`);
        } catch (e) {
            console.error('[SHADER] Cloud sync failed', e);
        }

        return shaderId;
    }

    /**
     * Get shader from local cache
     */
    getShader(name: string): ShaderAsset | null {
        const cache = this.getLocalCache();
        return cache[name] || null;
    }

    private getLocalCache(): Record<string, ShaderAsset> {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
        } catch {
            return {};
        }
    }
}

export const shaderService = new ShaderStorageService();
export default shaderService;
