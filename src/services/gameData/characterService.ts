/**
 * Character Service
 * Manages player character lifecycle, leveling, and persistent stats
 */

import { db, id, tx } from '../../lib/db';
import type { Character } from '../../types';
import { gameDataHelpers } from './index';

export class CharacterService {
    /**
     * Create a new character for a user
     */
    async createCharacter(userId: string, name: string, characterClass: string): Promise<string> {
        const charId = id();

        await db.transact([
            tx.characters[charId].update({
                userId,
                name,
                class: characterClass,
                level: 1,
                experience: 0,
                health: 100,
                maxHealth: 100,
                mana: 50,
                maxMana: 50,
                currentLocation: 'Nexus Prime',
                isOnline: true,
                playTime: 0,
                createdAt: Date.now(),
            })
        ]);

        return charId;
    }

    /**
     * Update character experience and handle level ups
     */
    async addExperience(characterId: string, amount: number, currentLevel: number): Promise<void> {
        const newExp = amount; // In a real app, you'd fetch current exp first or use increment logic
        const nextLevelExp = gameDataHelpers.getNextLevelExp(currentLevel);

        if (newExp >= nextLevelExp) {
            await this.levelUp(characterId, currentLevel + 1);
        } else {
            await db.transact([
                tx.characters[characterId].update({ experience: newExp })
            ]);
        }
    }

    /**
     * Handle character level up logic
     */
    private async levelUp(characterId: string, newLevel: number): Promise<void> {
        const stats = gameDataHelpers.getLevelUpStats(newLevel);

        await db.transact([
            tx.characters[characterId].update({
                level: newLevel,
                experience: 0,
                maxHealth: stats.healthIncrease,
                maxMana: stats.manaIncrease,
                health: stats.healthIncrease,
                mana: stats.manaIncrease,
            })
        ]);
    }

    /**
     * Save current location
     */
    async saveLocation(characterId: string, location: string): Promise<void> {
        await db.transact([
            tx.characters[characterId].update({
                currentLocation: location,
                lastPlayedAt: Date.now()
            })
        ]);
    }
}

export const characterService = new CharacterService();
export default characterService;
