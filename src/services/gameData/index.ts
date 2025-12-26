/**
 * Game Data Services
 * 
 * NOTE: These services are placeholder implementations.
 * InstantDB uses React hooks (useQuery, useMutation) for data operations.
 * 
 * To use these services, they need to be converted to custom hooks or
 * implemented directly in React components using InstantDB's hook API.
 * 
 * Example usage:
 * ```tsx
 * import { db } from '../lib/db';
 * 
 * function MyComponent() {
 *   const { data, isLoading, error } = db.useQuery({ 
 *     characters: { 
 *       $: { where: { userId: 'user-123' } } 
 *     } 
 *   });
 *   
 *   // Character data is now available in data.characters
 * }
 * ```
 * 
 * For mutations:
 * ```tsx
 * import { db, id, tx } from '../lib/db';
 * 
 * function createCharacter(userId: string, name: string) {
 *   const characterId = id();
 *   db.transact([
 *     tx.characters[characterId].update({
 *       userId,
 *       name,
 *       level: 1,
 *       // ...
 *     })
 *   ]);
 * }
 * ```
 */

export { default as aiUsageService } from './aiUsageService';
export { default as characterService } from './characterService';
export { default as collaborativeSync } from './collaborativeSyncService';

// Export types for use in components
export type {
    Character,
    Location,
    Quest,
    Item,
    GameEvent,
    AIUsageMetrics,
    UserAsset,
    GameSession,
} from '../../types';

// Helper functions that can be used with InstantDB transact
export const gameDataHelpers = {
    /**
     * Generate a new character ID
     */
    generateCharacterId: () => `char_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,

    /**
     * Generate a new asset ID
     */
    generateAssetId: () => `asset_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,

    /**
     * Calculate next level experience requirement
     */
    getNextLevelExp: (currentLevel: number): number => {
        return Math.floor(100 * Math.pow(1.5, currentLevel - 1));
    },

    /**
     * Calculate stat increases for level up
     */
    getLevelUpStats: (currentLevel: number) => {
        return {
            healthIncrease: 20 + currentLevel * 2,
            manaIncrease: 10 + currentLevel,
        };
    },
};

export default gameDataHelpers;
