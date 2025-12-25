/**
 * Media Context Service
 * Central hub for media asset awareness and AI-powered recommendations
 */

import type {
    MediaAsset,
    MediaQuery,
    MediaType,
    MediaOperation,
    BatchOperation,
    MediaCollection,
    AIRecommendation,
    MediaContext,
    ImportResult,
    MediaVersion
} from '../../types/media';

class MediaContextService {
    private assets: Map<string, MediaAsset> = new Map();
    private collections: Map<string, MediaCollection> = new Map();
    private versions: Map<string, MediaVersion[]> = new Map();
    private listeners: Set<(assets: MediaAsset[]) => void> = new Set();

    constructor() {
        this.loadFromStorage();
    }

    // ============================================
    // Asset Management
    // ============================================

    /**
     * Register a new media asset
     */
    register(asset: MediaAsset): void {
        this.assets.set(asset.id, asset);
        this.saveToStorage();
        this.notifyListeners();
        console.log(`[MEDIA_CONTEXT] Registered asset: ${asset.name} (${asset.type})`);
    }

    /**
     * Update an existing asset
     */
    update(id: string, updates: Partial<MediaAsset>): boolean {
        const asset = this.assets.get(id);
        if (!asset) return false;

        const updated = { ...asset, ...updates, updatedAt: Date.now() };
        this.assets.set(id, updated);
        this.saveToStorage();
        this.notifyListeners();
        return true;
    }

    /**
     * Delete an asset
     */
    delete(id: string): boolean {
        const deleted = this.assets.delete(id);
        if (deleted) {
            this.saveToStorage();
            this.notifyListeners();
        }
        return deleted;
    }

    /**
     * Get asset by ID
     */
    get(id: string): MediaAsset | undefined {
        return this.assets.get(id);
    }

    /**
     * Get all assets
     */
    getAll(): MediaAsset[] {
        return Array.from(this.assets.values());
    }

    // ============================================
    // Query & Search
    // ============================================

    /**
     * Query assets with filters
     */
    query(query: MediaQuery): MediaAsset[] {
        let results = this.getAll();

        // Filter by type
        if (query.type) {
            const types = Array.isArray(query.type) ? query.type : [query.type];
            results = results.filter(a => types.includes(a.type));
        }

        // Filter by tags
        if (query.tags && query.tags.length > 0) {
            results = results.filter(a =>
                query.tags!.some(tag => a.tags.includes(tag))
            );
        }

        // Filter by status
        if (query.status) {
            const statuses = Array.isArray(query.status) ? query.status : [query.status];
            results = results.filter(a => statuses.includes(a.status));
        }

        // Filter by AI generated
        if (query.aiGenerated !== undefined) {
            results = results.filter(a => a.aiGenerated === query.aiGenerated);
        }

        // Filter by date range
        if (query.createdAfter) {
            results = results.filter(a => a.createdAt >= query.createdAfter!);
        }
        if (query.createdBefore) {
            results = results.filter(a => a.createdAt <= query.createdBefore!);
        }

        // Search in name and description
        if (query.search) {
            const searchLower = query.search.toLowerCase();
            results = results.filter(a =>
                a.name.toLowerCase().includes(searchLower) ||
                a.metadata.description?.toLowerCase().includes(searchLower)
            );
        }

        // Sort
        if (query.sortBy) {
            results.sort((a, b) => {
                let aVal: any = a[query.sortBy!];
                let bVal: any = b[query.sortBy!];

                if (query.sortBy === 'usageCount' || query.sortBy === 'fileSize') {
                    aVal = aVal ?? 0;
                    bVal = bVal ?? 0;
                }

                if (query.sortOrder === 'desc') {
                    return bVal < aVal ? -1 : bVal > aVal ? 1 : 0;
                } else {
                    return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                }
            });
        }

        // Pagination
        if (query.offset !== undefined && query.limit !== undefined) {
            results = results.slice(query.offset, query.offset + query.limit);
        } else if (query.limit !== undefined) {
            results = results.slice(0, query.limit);
        }

        return results;
    }

    /**
     * Find similar assets (based on tags, type, or AI embeddings)
     */
    findSimilar(assetId: string, limit: number = 5): MediaAsset[] {
        const asset = this.get(assetId);
        if (!asset) return [];

        const candidates = this.getAll().filter(a => a.id !== assetId);

        // Simple similarity based on shared tags and type
        const scored = candidates.map(candidate => {
            let score = 0;

            // Same type is highly relevant
            if (candidate.type === asset.type) score += 10;

            // Shared tags
            const sharedTags = candidate.tags.filter(tag => asset.tags.includes(tag));
            score += sharedTags.length * 3;

            // AI generated similarity
            if (asset.aiGenerated && candidate.aiGenerated) {
                if (asset.aiModel === candidate.aiModel) score += 5;
            }

            return { asset: candidate, score };
        });

        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(s => s.asset);
    }

    // ============================================
    // Usage Tracking
    // ============================================

    /**
     * Record asset usage
     */
    recordUsage(id: string): void {
        const asset = this.get(id);
        if (!asset) return;

        this.update(id, {
            usageCount: (asset.usageCount || 0) + 1,
            lastUsed: Date.now()
        });
    }

    /**
     * Get usage statistics
     */
    getUsageStats(id: string): { count: number; lastUsed?: number; locations: string[] } {
        const asset = this.get(id);
        if (!asset) return { count: 0, locations: [] };

        // TODO: Scan codebase for asset references
        const locations: string[] = [];

        return {
            count: asset.usageCount || 0,
            lastUsed: asset.lastUsed,
            locations
        };
    }

    // ============================================
    // Collections
    // ============================================

    /**
     * Create a collection
     */
    createCollection(name: string, description?: string): MediaCollection {
        const collection: MediaCollection = {
            id: `collection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            description,
            assetIds: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            tags: []
        };

        this.collections.set(collection.id, collection);
        this.saveToStorage();
        return collection;
    }

    /**
     * Add asset to collection
     */
    addToCollection(collectionId: string, assetId: string): boolean {
        const collection = this.collections.get(collectionId);
        if (!collection) return false;

        if (!collection.assetIds.includes(assetId)) {
            collection.assetIds.push(assetId);
            collection.updatedAt = Date.now();
            this.saveToStorage();
        }

        return true;
    }

    /**
     * Get collection assets
     */
    getCollectionAssets(collectionId: string): MediaAsset[] {
        const collection = this.collections.get(collectionId);
        if (!collection) return [];

        return collection.assetIds
            .map(id => this.get(id))
            .filter(Boolean) as MediaAsset[];
    }

    // ============================================
    // AI Integration
    // ============================================

    /**
     * Get AI recommendations based on context
     */
    suggestAssets(context: string, limit: number = 5): AIRecommendation[] {
        // Simple keyword-based matching for now
        // TODO: Integrate with actual AI model for semantic search
        const keywords = context.toLowerCase().split(/\s+/);
        const assets = this.getAll();

        const scored = assets.map(asset => {
            let score = 0;
            const assetText = `${asset.name} ${asset.metadata.description || ''} ${asset.tags.join(' ')}`.toLowerCase();

            keywords.forEach(keyword => {
                if (assetText.includes(keyword)) score += 1;
            });

            // Boost recently used
            if (asset.lastUsed && Date.now() - asset.lastUsed < 24 * 60 * 60 * 1000) {
                score += 0.5;
            }

            return {
                assetId: asset.id,
                reason: `Matches context: "${context}"`,
                confidence: Math.min(score / keywords.length, 1),
                context
            };
        });

        return scored
            .filter(s => s.confidence > 0.1)
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, limit);
    }

    /**
     * Get complete media context for AI agents
     */
    getContext(): MediaContext {
        const assets = this.getAll();
        const assetsByType: Record<MediaType, number> = {
            image: 0,
            audio: 0,
            video: 0,
            model: 0,
            code: 0,
            texture: 0,
            material: 0,
            animation: 0,
            sketch: 0
        };

        assets.forEach(asset => {
            assetsByType[asset.type] = (assetsByType[asset.type] || 0) + 1;
        });

        const recentAssets = assets
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, 10);

        return {
            totalAssets: assets.length,
            assetsByType,
            recentAssets,
            suggestedAssets: []
        };
    }

    // ============================================
    // Batch Operations
    // ============================================

    /**
     * Execute batch operation on multiple assets
     */
    async batchProcess(operation: BatchOperation): Promise<void> {
        const { assetIds, operation: op, onProgress, onComplete, onError } = operation;
        const results: MediaAsset[] = [];

        for (let i = 0; i < assetIds.length; i++) {
            try {
                const asset = this.get(assetIds[i]);
                if (!asset) continue;

                // TODO: Implement actual operations
                console.log(`[MEDIA_CONTEXT] Processing ${asset.name} with operation:`, op.type);

                results.push(asset);
                onProgress?.(i + 1, assetIds.length);
            } catch (error) {
                onError?.(error as Error);
            }
        }

        onComplete?.(results);
    }

    // ============================================
    // Versioning
    // ============================================

    /**
     * Create a version snapshot of an asset
     */
    createVersion(assetId: string, description?: string, operation?: MediaOperation): MediaVersion | null {
        const asset = this.get(assetId);
        if (!asset || !asset.url) return null;

        const versions = this.versions.get(assetId) || [];
        const version: MediaVersion = {
            id: `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            assetId,
            version: versions.length + 1,
            url: asset.url,
            createdAt: Date.now(),
            operation,
            description
        };

        versions.push(version);
        this.versions.set(assetId, versions);
        this.saveToStorage();
        return version;
    }

    /**
     * Get version history for an asset
     */
    getVersions(assetId: string): MediaVersion[] {
        return this.versions.get(assetId) || [];
    }

    // ============================================
    // Import/Export
    // ============================================

    /**
     * Import asset from file
     */
    async importAsset(file: File, metadata?: Partial<MediaAsset>): Promise<ImportResult> {
        try {
            // Create blob URL for preview
            const url = URL.createObjectURL(file);

            // Determine type from MIME
            let type: MediaType = 'image';
            if (file.type.startsWith('audio/')) type = 'audio';
            else if (file.type.startsWith('video/')) type = 'video';
            else if (file.type.startsWith('model/')) type = 'model';
            else if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) type = 'model';

            const asset: MediaAsset = {
                id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                type,
                status: 'raw',
                url,
                fileSize: file.size,
                mimeType: file.type,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                metadata: {
                    description: metadata?.metadata?.description
                },
                tags: metadata?.tags || [],
                collectionIds: metadata?.collectionIds || []
            };

            this.register(asset);

            return { success: true, asset };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }

    /**
     * Export manifest of all assets
     */
    exportManifest(): string {
        const manifest = {
            version: '1.0',
            exportedAt: Date.now(),
            assets: this.getAll(),
            collections: Array.from(this.collections.values())
        };

        return JSON.stringify(manifest, null, 2);
    }

    // ============================================
    // Persistence
    // ============================================

    private saveToStorage(): void {
        try {
            const data = {
                assets: Array.from(this.assets.entries()),
                collections: Array.from(this.collections.entries()),
                versions: Array.from(this.versions.entries())
            };
            localStorage.setItem('mediaContext', JSON.stringify(data));
        } catch (error) {
            console.error('[MEDIA_CONTEXT] Failed to save to storage:', error);
        }
    }

    private loadFromStorage(): void {
        try {
            const stored = localStorage.getItem('mediaContext');
            if (stored) {
                const data = JSON.parse(stored);
                this.assets = new Map(data.assets || []);
                this.collections = new Map(data.collections || []);
                this.versions = new Map(data.versions || []);
                console.log(`[MEDIA_CONTEXT] Loaded ${this.assets.size} assets from storage`);
            }
        } catch (error) {
            console.error('[MEDIA_CONTEXT] Failed to load from storage:', error);
        }
    }

    /**
     * Subscribe to asset changes
     */
    subscribe(listener: (assets: MediaAsset[]) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        const assets = this.getAll();
        this.listeners.forEach(listener => listener(assets));
    }

    /**
     * Clear all data (for testing/reset)
     */
    clear(): void {
        this.assets.clear();
        this.collections.clear();
        this.versions.clear();
        this.saveToStorage();
        this.notifyListeners();
    }
}

// Singleton instance
export const mediaContext = new MediaContextService();
export default mediaContext;
