/**
 * Asset Service
 * Manages user-generated assets (images, videos, 3D models, audio)
 */

import { tx, id } from '@instantdb/react';
import type { UserAsset } from '../../types';

export const assetService = {
    /**
     * Create a new asset
     */
    async createAsset(
        ownerId: string,
        name: string,
        type: 'image' | 'video' | 'audio' | '3d_model',
        format: string,
        url: string,
        size: number,
        aiGenerated: boolean = false,
        thumbnail?: string
    ): Promise<string> {
        const assetId = id();
        const now = Date.now();

        await tx.assets[assetId].update({
            name,
            type,
            format,
            url,
            thumbnail,
            size,
            ownerId,
            isPublic: false,
            downloads: 0,
            likes: 0,
            createdAt: now,
            aiGenerated,
        });

        return assetId;
    },

    /**
     * Get asset by ID
     */
    async getAsset(assetId: string): Promise<UserAsset | null> {
        const { data } = await tx.assets[assetId].get();
        return data as UserAsset | null;
    },

    /**
     * Get user's assets
     */
    async getUserAssets(userId: string, type?: string): Promise<UserAsset[]> {
        const query = type
            ? tx.assets.where({ ownerId: userId, type })
            : tx.assets.where({ ownerId: userId });

        const { data } = await query.get();
        return data as UserAsset[];
    },

    /**
     * Get public assets
     */
    async getPublicAssets(type?: string, limit: number = 50): Promise<UserAsset[]> {
        const query = type
            ? tx.assets.where({ isPublic: true, type })
            : tx.assets.where({ isPublic: true });

        const { data } = await query.get();
        const assets = data as UserAsset[];

        // Sort by likes and limit
        return assets
            .sort((a, b) => b.likes - a.likes)
            .slice(0, limit);
    },

    /**
     * Update asset metadata
     */
    async updateAsset(
        assetId: string,
        updates: Partial<Omit<UserAsset, 'id' | 'ownerId' | 'createdAt'>>
    ): Promise<void> {
        await tx.assets[assetId].update(updates);
    },

    /**
     * Toggle public visibility
     */
    async setPublic(assetId: string, isPublic: boolean): Promise<void> {
        await tx.assets[assetId].update({ isPublic });
    },

    /**
     * Increment download count
     */
    async recordDownload(assetId: string): Promise<void> {
        const asset = await this.getAsset(assetId);
        if (asset) {
            await tx.assets[assetId].update({
                downloads: asset.downloads + 1,
            });
        }
    },

    /**
     * Like/unlike asset
     */
    async toggleLike(assetId: string, increment: boolean): Promise<void> {
        const asset = await this.getAsset(assetId);
        if (asset) {
            await tx.assets[assetId].update({
                likes: asset.likes + (increment ? 1 : -1),
            });
        }
    },

    /**
     * Delete asset
     */
    async deleteAsset(assetId: string): Promise<void> {
        await tx.assets[assetId].delete();
    },

    /**
     * Get AI-generated assets
     */
    async getAIAssets(limit: number = 50): Promise<UserAsset[]> {
        const { data } = await tx.assets
            .where({ aiGenerated: true, isPublic: true })
            .get();

        const assets = data as UserAsset[];
        return assets
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, limit);
    },
};

export default assetService;
