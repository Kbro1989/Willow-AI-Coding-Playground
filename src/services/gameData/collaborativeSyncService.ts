/**
 * Collaborative Sync Service
 * Handles real-time presence and workspace state via InstantDB
 */

import { db, id, tx } from '../../lib/db';

export interface Presence {
    userId: string;
    userName: string;
    cursor: { x: number, y: number };
    activeFile?: string;
    activeTab?: string;
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
            await db.transact([
                tx.presence[userId].update({
                    ...data,
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
    async lockEntity(entityId: string, userId: string) {
        try {
            // Logic to add to lockedEntities in workspace state
            // For now, this is a placeholder for InstantDB transactions
        } catch (error) {
            console.error('[SYNC] Failed to lock entity:', error);
        }
    }

    /**
     * Synchronize a specific state fragment across all users
     */
    async syncState<T>(key: string, data: T) {
        // Implementation using InstantDB transact to update a shared state entity
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
