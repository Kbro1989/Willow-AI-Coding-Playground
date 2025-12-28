export type AssetType = 'image' | 'audio' | 'video' | 'model' | 'code';

export interface ForgeAsset {
    id: string;
    type: AssetType;
    url: string;
    prompt?: string;
    model?: string;
    timestamp: number;
    metadata?: any;
    tags?: string[];
}

class ForgeMediaService {
    private assets: ForgeAsset[] = [];
    private listeners: Array<(a: ForgeAsset[]) => void> = [];

    getAssets() {
        return [...this.assets].sort((a, b) => b.timestamp - a.timestamp);
    }

    async addAsset(asset: Omit<ForgeAsset, 'id' | 'timestamp'>) {
        const newAsset: ForgeAsset = {
            ...asset,
            id: `asset-${Math.random().toString(36).slice(2, 9)}`,
            timestamp: Date.now(),
            tags: asset.tags || []
        };

        this.assets.push(newAsset);
        this.notify();

        // PERSISTENCE FLOW: Flush to local creation directory
        try {
            const { localBridgeClient } = await import('./localBridgeService');
            const fileName = `${newAsset.id}_${newAsset.type}.json`;
            const creationPath = `creations/${fileName}`;

            await localBridgeClient.writeLocalFile(creationPath, JSON.stringify(newAsset, null, 2));
            console.log(`[ForgePersistence] Asset ${newAsset.id} flushed to disk: ${creationPath}`);

            // If it's code, we might want to save the source separately
            if (newAsset.type === 'code' && newAsset.metadata?.content) {
                await localBridgeClient.writeLocalFile(`creations/${newAsset.id}.ts`, newAsset.metadata.content);
            }
        } catch (err) {
            console.warn('[ForgePersistence] Failed to flush to disk:', err);
        }

        return newAsset;
    }

    async syncFromDisk() {
        console.log('[ForgePersistence] Initiating disk synchronization...');
        try {
            const { localBridgeClient } = await import('./localBridgeService');
            const result = await localBridgeClient.listDirectory('creations');

            if (result.success && result.files) {
                // Filter for JSON metadata files
                const jsonFiles = result.files.filter(f => f.name.endsWith('.json'));
                const loadedAssets: ForgeAsset[] = [];

                for (const file of jsonFiles) {
                    try {
                        const contentRes = await localBridgeClient.readLocalFile(`creations/${file.name}`);
                        if (contentRes.success && contentRes.content) {
                            const asset = JSON.parse(contentRes.content);
                            // Avoid duplicates by checking ID
                            if (!this.assets.some(a => a.id === asset.id)) {
                                loadedAssets.push(asset);
                            }
                        }
                    } catch (e) {
                        console.warn(`[ForgePersistence] Failed to parse asset metadata: ${file.name}`, e);
                    }
                }

                if (loadedAssets.length > 0) {
                    this.assets = [...this.assets, ...loadedAssets].sort((a, b) => b.timestamp - a.timestamp);
                    this.notify();
                    console.log(`[ForgePersistence] Recovered ${loadedAssets.length} assets from local creation vault.`);
                }
            }
        } catch (err) {
            console.warn('[ForgePersistence] Disk sync failed:', err);
        }
    }

    removeAsset(id: string) {
        this.assets = this.assets.filter(a => a.id !== id);
        this.notify();
    }

    subscribe(listener: (a: ForgeAsset[]) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(l => l(this.getAssets()));
    }
}

export const forgeMedia = new ForgeMediaService();
export default forgeMedia;
