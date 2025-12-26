/**
 * Asset Management Service
 * Interacts with the Cloudflare Worker to manage assets
 */

import { UserAsset } from '../types';

import { db, id, tx } from '../lib/db';

const WORKER_URL = 'https://ai-game-studio.kristain33rs.workers.dev';

/**
 * Fetch assets from InstantDB (Primary Source)
 */
export const getAssetsFromDB = async () => {
  // Direct usage of db.useQuery is preferred in components,
  // but we can provide a manual fetcher here if needed.
  return []; // Placeholder: Components should use db.useQuery({ assets: {} })
};

/**
 * Upload asset to R2 and record metadata in InstantDB
 */
export const uploadAsset = async (file: File, name?: string, type?: string, ownerId?: string): Promise<UserAsset | null> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);
    if (type) formData.append('type', type);

    // 1. Upload Actual File to R2 via Worker
    const response = await fetch(`${WORKER_URL}/api/assets`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error('[ASSET_SERVICE] Worker upload failed');
      return null;
    }

    const workerResult = await response.json() as { url: string; id: string };

    // 2. Persist Metadata to InstantDB
    const assetId = id();
    const finalAsset: UserAsset = {
      id: assetId,
      name: name || file.name,
      type: (type as UserAsset['type']) || 'image',
      format: file.type,
      url: workerResult.url,
      size: file.size,
      ownerId: ownerId || 'anonymous',
      isPublic: true,
      downloads: 0,
      likes: 0,
      status: 'raw',
      createdAt: Date.now(),
      aiGenerated: false,
    };

    // Sync with InstantDB
    await db.transact([
      tx.assets[assetId].update(finalAsset)
    ]);

    return finalAsset;
  } catch (error) {
    console.error('[ASSET_SERVICE] Failed to upload asset:', error);
    return null;
  }
};

/**
 * Delete asset from both R2 and InstantDB
 */
export const deleteAsset = async (id: string): Promise<{ success: boolean; message: string }> => {
  try {
    // 1. Delete from InstantDB
    await db.transact([
      tx.assets[id].delete()
    ]);

    // 2. Delete from R2 via Worker (optional, depends on policy)
    const response = await fetch(`${WORKER_URL}/api/assets/${id}`, {
      method: 'DELETE',
    });

    return { success: true, message: 'Asset purged from Nexus.' };
  } catch (error) {
    console.error(`[ASSET_SERVICE] Failed to delete asset ${id}:`, error);
    return { success: false, message: 'Failed to delete asset.' };
  }
};
