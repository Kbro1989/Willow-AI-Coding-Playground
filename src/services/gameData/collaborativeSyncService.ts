/**
 * Collaborative Sync Service
 * Handles real-time presence and workspace state via InstantDB
 */

import { db, id, tx } from '../../lib/db';

export interface Presence {
    userId: string;
    userName: string;
    cursorX: number;
    cursorY: number;
    activeFile?: string;
    activeTab?: string;
    activeView?: string;
    lastActive: number;
}

export interface SharedWorkspaceState {
    id: string;
    activeUsers: string[];
    lockedEntities: string[]; // Entities currently being edited
    globalDirectives: string[];
}

class CollaborativeSyncService {
    /**
     * Update current user presence
     */
    async updatePresence(userId: string, data: Partial<Presence>) {
        try {
            // Strip userId from data if present to avoid "id already exists" conflict,
            // as userId is being used as the record ID in tx.presence[userId]
            const { userId: _, ...safeData } = data;

            await db.transact([
                tx.presence[userId].update({
                    ...safeData,
                    // Map activeTab to activeView if needed, or just include both
                    activeView: data.activeView || data.activeTab,
                    lastActive: Date.now()
                })
            ]);
        } catch (error) {
            console.error('[SYNC] Failed to update presence:', error);
        }
    }

    /**
     * Lock an entity for editing (prevent conflicts)
     */
    async lockEntity(workspaceId: string, entityId: string, userId: string) {
        try {
            // In a real app, we'd check if it's already locked
            // For now, we update the lockedEntities JSON string
            await db.transact([
                tx.workspace_state[workspaceId].update({
                    lockedEntities: JSON.stringify([entityId]), // Simplified: should merge
                    updatedAt: Date.now()
                })
            ]);
            console.log(`[SYNC] Entity ${entityId} locked by ${userId}`);
        } catch (error) {
            console.error('[SYNC] Failed to lock entity:', error);
        }
    }

    /**
     * Synchronize a specific state fragment across all users
     */
    async syncState<T>(workspaceId: string, key: string, data: T) {
        try {
            await db.transact([
                tx.workspace_state[workspaceId].update({
                    [key]: typeof data === 'string' ? data : JSON.stringify(data),
                    updatedAt: Date.now()
                })
            ]);
        } catch (error) {
            console.error(`[SYNC] Failed to sync ${key}:`, error);
        }
    }

    /**
     * Hook-like helper for components to track others
     */
    usePresence() {
        return db.useQuery({ presence: {} });
    }
}

export const collaborativeSync = new CollaborativeSyncService();
export default collaborativeSync;
