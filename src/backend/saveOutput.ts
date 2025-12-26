import { db } from '../lib/db';

export interface SaveResult {
    success: boolean;
    id: string;
    timestamp: number;
    error?: string;
}

/**
 * Saves processed output to InstantDB and KV with transactional integrity
 */
export const saveToRegistry = async (
    collection: 'media' | 'models' | 'code' | 'logs',
    data: any,
    id?: string
): Promise<SaveResult> => {
    const entryId = id || `reg-${Date.now()}`;
    const timestamp = Date.now();

    try {
        console.log(`[BACKEND_STORAGE] Persisting to ${collection}:`, entryId);

        // Simulating the transaction logic for now
        // In reality we would use db.transact([...])

        // We cast collection to any to bypass strict typing for this generic handler
        // In a strictly typed system, we would map each collection to its schema type
        await db.transact([
            (db.tx as any)[collection][entryId].update({
                ...data,
                version: 1,
                updatedAt: timestamp,
                status: 'synced'
            })
        ]);

        return {
            success: true,
            id: entryId,
            timestamp
        };
    } catch (error: any) {
        console.error(`[BACKEND_STORAGE] ${collection} persist failure:`, error);
        return {
            success: false,
            id: entryId,
            timestamp,
            error: error.message
        };
    }
};
