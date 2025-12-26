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

    addAsset(asset: Omit<ForgeAsset, 'id' | 'timestamp'>) {
        const newAsset: ForgeAsset = {
            ...asset,
            id: `asset-${Math.random().toString(36).slice(2, 9)}`,
            timestamp: Date.now(),
            tags: asset.tags || []
        };

        this.assets.push(newAsset);
        this.notify();
        return newAsset;
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
