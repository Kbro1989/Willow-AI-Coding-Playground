import * as THREE from "three";
import { EngineCache, ThreejsSceneCache, ModelConverter, modelToThree } from "./3d/modeltothree";
import { RSModel, SimpleModelDef } from "./3d/modelnodes";
import { IRSMVService, RSMVAvatar, RSMVModel, RSMVServiceConfig } from "./types";
import { GLTFLoader } from "three-stdlib";
import { WasmGameCacheLoader } from "./cache/sqlitewasm";

export class RSMVFacade implements IRSMVService {
    private engineCache: EngineCache | null = null;
    private sceneCache: ThreejsSceneCache | null = null;
    private glbLoader = new GLTFLoader();
    private wasmLoader: WasmGameCacheLoader | null = null;

    constructor(private config: RSMVServiceConfig = {}) { }

    /**
     * Lazy-initializes the internal WASM engine if needed.
     */
    private async ensureInitialized() {
        if (this.wasmLoader) return;
        this.wasmLoader = new WasmGameCacheLoader();
        this.wasmLoader.getBuildNr = () => 920; // Default building
    }

    /**
     * Links a local Jagex cache directory via window.agentAPI
     */
    async linkLocalCache(path: string = 'C:\\ProgramData\\Jagex\\RuneScape'): Promise<boolean> {
        await this.ensureInitialized();
        const api = (window as any).agentAPI;
        if (!api) throw new Error("RSMV: Agent API not available. Cannot link local cache.");

        const files = await api.fs.readDirectory(path);
        if (!files.success) throw new Error(`RSMV: Failed to read cache at ${path}`);

        const dbFiles: Record<string, Blob> = {};
        for (const file of files.files) {
            if (file.name.endsWith('.jcache')) {
                const fullPath = `${path}\\${file.name}`;
                const data = await api.fs.read(fullPath);
                if (data.success) {
                    dbFiles[file.name] = new Blob([data.data]);
                }
            }
        }

        if (Object.keys(dbFiles).length === 0) {
            throw new Error("RSMV: No .jcache files found in the specified directory");
        }

        this.wasmLoader!.giveBlobs(dbFiles);
        this.engineCache = await ModelConverter.create(this.wasmLoader!);
        this.sceneCache = await ThreejsSceneCache.create(this.engineCache);
        return true;
    }

    /**
     * Fetches a model from OpenRS2 Archive
     */
    async fetchRemoteModel(cacheId: number, modelId: number): Promise<Buffer | null> {
        const url = `https://archive.openrs2.org/api/v1/caches/${cacheId}/groups/7/files/${modelId}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`OpenRS2 fetch failed: ${response.statusText}`);
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (e) {
            console.error(`RSMV: Failed to fetch remote model ${modelId} from cache ${cacheId}:`, e);
            return null;
        }
    }

    /**
     * High-level load method: GLB -> Remote -> Local Cache
     */
    async loadModel(id: number, options?: { cacheId?: number }): Promise<RSMVModel> {
        // 1. Try GLB (Precompiled)
        if (this.config.useGlbFirst && this.config.glbBaseUrl) {
            try {
                const glbUrl = `${this.config.glbBaseUrl}/model_${id}.glb`;
                const gltf = await this.glbLoader.loadAsync(glbUrl);
                return {
                    id,
                    name: `model:${id}`,
                    scene: gltf.scene as THREE.Group,
                    metadata: gltf.userData
                };
            } catch (e) {
                // Silent fallback if GLB is missing
            }
        }

        // 2. Try Remote Import (if cacheId provided)
        if (options?.cacheId) {
            const remoteData = await this.fetchRemoteModel(options.cacheId, id);
            if (remoteData) {
                // We still need a sceneCache to parse the model data correctly
                if (!this.sceneCache) {
                    await this.ensureInitialized();
                    this.engineCache = await ModelConverter.create(this.wasmLoader!);
                    this.sceneCache = await ThreejsSceneCache.create(this.engineCache);
                }
                // Normally getModelData(id) expects the file to be in the cache
                // This might need a tweak to support direct buffer parsing if not cached.
                // For now, we assume standard flow uses the linked cache.
            }
        }

        // 3. Fallback to Local Cache
        if (!this.sceneCache) {
            throw new Error("RSMV: Not initialized or cache not linked.");
        }

        const modelDef: SimpleModelDef = [{ modelid: id, mods: {} }];
        const rsModel = new RSModel(this.sceneCache, modelDef, `model:${id}`);
        const loaded = await rsModel.model;

        return {
            id,
            name: rsModel.rootnode.name,
            scene: rsModel.rootnode,
            metadata: loaded.modeldata as any
        };
    }

    async loadAvatar(name: string): Promise<RSMVAvatar> {
        if (!this.sceneCache) throw new Error("RSMV: Not initialized.");
        // Implementation for avatar loading
        throw new Error("Method not implemented.");
    }

    getEngineCache() {
        return this.engineCache;
    }

    getSceneCache() {
        return this.sceneCache;
    }

    setInternalSceneCache(scene: ThreejsSceneCache | null) {
        this.sceneCache = scene;
    }

    async dispose(): Promise<void> {
        this.engineCache?.close();
        this.sceneCache = null;
        this.engineCache = null;
        this.wasmLoader = null;
    }

    /**
     * Links a set of dropped Blobs (e.g. from a drag and drop) to the cache loader.
     */
    async linkDroppedCache(blobs: Record<string, Blob>): Promise<boolean> {
        await this.ensureInitialized();
        if (!this.wasmLoader) throw new Error("RSMV: WASM Loader not available.");

        console.log(`RSMV: Linking ${Object.keys(blobs).length} dropped blobs...`);
        this.wasmLoader.giveBlobs(blobs);

        this.engineCache = await ModelConverter.create(this.wasmLoader);
        this.sceneCache = await ThreejsSceneCache.create(this.engineCache);
        return true;
    }
}

export const rsmv = new RSMVFacade({
    useGlbFirst: true,
    glbBaseUrl: "/assets/models"
});
