/**
 * RSMV Model Data Service
 * Interacts with the Cloudflare Worker and local/remote RSMV logic via the RSVM Facade.
 */

import { RSMVModelEntry, GameSource, ModelCategory } from '../components/RSMVBrowser';
import { rsmv } from './rsmv';
import { cacheMajors } from './rsmv/constants';
import { Buffer } from 'buffer';

/**
 * FEATURED_MODELS: Professional selection for high-fidelity demonstration 
 * when local cache is not yet linked.
 */
export const FEATURED_MODELS: Record<GameSource, RSMVModelEntry[]> = {
  runescape: [
    { id: 4151, name: 'Abyssal whip', category: 'items', gameSource: 'runescape', vertexCount: 342, materialCount: 2, tags: ['weapon', 'melee', 'slayer'], examine: 'A weapon from the abyss.' },
    { id: 11694, name: 'Armadyl godsword', category: 'items', gameSource: 'runescape', vertexCount: 1024, materialCount: 3, tags: ['weapon', 'melee', 'godsword'], examine: 'A very powerful godsword.' },
    { id: 1050, name: 'Santa hat', category: 'items', gameSource: 'runescape', vertexCount: 128, materialCount: 1, tags: ['holiday', 'rare'], examine: 'Ho ho ho!' },
    { id: 50, name: 'King Black Dragon', category: 'npcs', gameSource: 'runescape', vertexCount: 4096, materialCount: 6, boneCount: 48, tags: ['boss', 'dragon'], description: 'A fearsome three-headed dragon.' },
  ],
  morrowind: [
    { id: 1, name: 'Frost Atronach', category: 'npcs', gameSource: 'morrowind', vertexCount: 3200, materialCount: 4, boneCount: 24, tags: ['daedra', 'summon'], filePath: 'Meshes/Atronach_Frost.nif' },
  ],
  fallout: [
    { id: 1, name: 'Securitron', category: 'npcs', gameSource: 'fallout', vertexCount: 4500, materialCount: 6, boneCount: 28, tags: ['robot', 'vegas'], description: 'Mr. House\'s robotic army.' },
  ],
};

export const JAGEX_LAUNCHER_PATHS = {
  root: 'C:\\Program Files (x86)\\Jagex Launcher',
  games: 'C:\\Program Files (x86)\\Jagex Launcher\\Games',
  launcher: 'C:\\Program Files (x86)\\Jagex Launcher\\JagexLauncher.exe',
  libcef: 'C:\\Program Files (x86)\\Jagex Launcher\\libcef.dll',
  vulkan: 'C:\\Program Files (x86)\\Jagex Launcher\\vulkan-1.dll'
};

export const verifyJagexLauncher = async (): Promise<boolean> => {
  try {
    if (!(window as any).agentAPI) return false;
    const [launcher, games] = await Promise.all([
      (window as any).agentAPI.fs.stat(JAGEX_LAUNCHER_PATHS.launcher),
      (window as any).agentAPI.fs.stat(JAGEX_LAUNCHER_PATHS.games)
    ]);
    return !!(launcher.success && games.success);
  } catch (err) {
    console.error('[RSMV_SERVICE] Verification failed:', err);
    return false;
  }
};

/**
 * RSMVEngine (Legacy Delegator)
 * This class now delegates to the RSMVFacade in src/services/rsmv/index.ts
 */
export class RSMVEngine {
  private static instance: RSMVEngine;

  private constructor() { }

  static getInstance() {
    if (!this.instance) {
      this.instance = new RSMVEngine();
    }
    return this.instance;
  }

  async initialize() {
    // Initialization is now managed by the facade
  }

  async linkLocalCache(path: string = 'C:\\ProgramData\\Jagex\\RuneScape') {
    return rsmv.linkLocalCache(path);
  }

  async linkDroppedCache(blobs: Record<string, Blob>) {
    return rsmv.linkDroppedCache(blobs);
  }

  async getModelMetadata(category: ModelCategory, id: number): Promise<RSMVModelEntry | null> {
    // This could be enhanced by using the facade to check existence
    return {
      id,
      name: `${category.slice(0, -1).toUpperCase()} ${id}`,
      category,
      gameSource: 'runescape',
      vertexCount: 0
    };
  }

  async loadModel(id: number) {
    return rsmv.loadModel(id);
  }

  async fetchRemoteModel(cacheId: number, modelId: number): Promise<Buffer | null> {
    return rsmv.fetchRemoteModel(cacheId, modelId);
  }

  async getRemoteModelData(cacheId: number, modelId: number) {
    // Delegate to facade which handles GLB and Remote logic
    return rsmv.loadModel(modelId, { cacheId });
  }

  getSceneCache() {
    return rsmv.getSceneCache();
  }
}

export const getRsmvModels = async (gameSource: GameSource, category: ModelCategory): Promise<RSMVModelEntry[]> => {
  if (gameSource !== 'runescape') return FEATURED_MODELS[gameSource] || [];

  const facade = rsmv;
  const sceneCache = facade.getSceneCache();
  if (!sceneCache) return FEATURED_MODELS.runescape;

  const results: RSMVModelEntry[] = [];
  const major = category === 'items' ? cacheMajors.items :
    category === 'npcs' ? cacheMajors.npcs :
      category === 'objects' ? cacheMajors.objects :
        category === 'models' ? cacheMajors.models : null;

  if (major === null) return [];

  try {
    const engine = sceneCache.engine;
    const { iterateConfigFiles } = await import('./rsmv/3d/modeltothree');
    const { parse } = await import('./rsmv/opdecoder');

    if (major === cacheMajors.models) {
      const index = await engine.getCacheIndex(cacheMajors.models);
      for (const entry of index) {
        if (!entry) continue;
        results.push({
          id: entry.minor,
          name: `Model ${entry.minor}`,
          category: 'models',
          gameSource: 'runescape',
          vertexCount: 0
        });
        if (results.length > 1000) break; // Limit for performance
      }
    } else {
      const it = iterateConfigFiles(engine, major);
      const parser = category === 'items' ? parse.item :
        category === 'npcs' ? parse.npc :
          category === 'objects' ? parse.object : null;

      for await (const { id, file } of it) {
        let name = `${category.slice(0, -1)} ${id}`;
        let examine = '';
        if (parser) {
          try {
            const decoded = parser.read(file, engine.rawsource);
            if ((decoded as any).name) name = (decoded as any).name;
            if ((decoded as any).examine) examine = (decoded as any).examine;
          } catch (e) {
            // Use default name if parse fails
          }
        }
        results.push({
          id,
          name,
          category,
          gameSource: 'runescape',
          vertexCount: 0,
          examine
        });
        if (results.length > 1000) break; // Limit for performance
      }
    }
  } catch (err) {
    console.error(`[RSMV_SERVICE] Failed to scan cache major ${major}:`, err);
    return FEATURED_MODELS.runescape;
  }

  return results;
};
