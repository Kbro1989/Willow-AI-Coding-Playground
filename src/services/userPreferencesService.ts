import { db } from '../lib/db';
import { ActiveView, AIModelMode, ProjectEnv } from '../types';

/**
 * Syncs the current user's active state (View, File, etc.) to the 'presence' entity.
 * This allows the user to pick up where they left off on another device.
 */
export const syncSessionState = (
    userId: string | undefined,
    data: {
        activeView?: ActiveView,
        activeFile?: string,
        userName?: string
    }
) => {
    if (!userId) return;

    db.transact(
        db.tx.presence[`presence-${userId}`].update({
            userId,
            lastActive: Date.now(),
            ...data
        })
    );
};
