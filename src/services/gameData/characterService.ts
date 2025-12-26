/**
 * Character Service
 * Manages player character data and progression
 */

import { init, tx, id } from '@instantdb/react';
import type { Character } from '../../types';

export const characterService = {
    /**
     * Create a new character for a user
     */
    async createCharacter(
        userId: string,
        name: string,
        characterClass: string
    ): Promise<string> {
        const characterId = id();
        const now = Date.now();

        await tx.characters[characterId].update({
            userId,
            name,
            class: characterClass,
            level: 1,
            experience: 0,
            health: 100,
            maxHealth: 100,
            mana: 50,
            maxMana: 50,
            currentLocation: 'spawn',
            isOnline: true,
            playTime: 0,
            createdAt: now,
            lastPlayedAt: now,
        });

        return characterId;
    },

    /**
     * Get character by ID
     */
    async getCharacter(characterId: string): Promise<Character | null> {
        const { data } = await tx.characters[characterId].get();
        return data as Character | null;
    },

    /**
     * Get all characters for a user
     */
    async getUserCharacters(userId: string): Promise<Character[]> {
        const { data } = await tx.characters
            .where({ userId })
            .get();
        return data as Character[];
    },

    /**
     * Update character stats
     */
    async updateCharacter(
        characterId: string,
        updates: Partial<Omit<Character, 'id' | 'userId' | 'createdAt'>>
    ): Promise<void> {
        await tx.characters[characterId].update(updates);
    },

    /**
     * Level up character
     */
    async levelUp(characterId: string): Promise<void> {
        const character = await this.getCharacter(characterId);
        if (!character) return;

        const newLevel = character.level + 1;
        const healthIncrease = 20;
        const manaIncrease = 10;

        await tx.characters[characterId].update({
            level: newLevel,
            maxHealth: character.maxHealth + healthIncrease,
            maxMana: character.maxMana + manaIncrease,
            health: character.maxHealth + healthIncrease, // Full heal on level up
            mana: character.maxMana + manaIncrease,
        });
    },

    /**
     * Set character online/offline status
     */
    async setOnlineStatus(characterId: string, isOnline: boolean): Promise<void> {
        const updates: any = { isOnline };
        if (!isOnline) {
            updates.lastPlayedAt = Date.now();
        }
        await tx.characters[characterId].update(updates);
    },

    /**
     * Update character location
     */
    async moveToLocation(characterId: string, locationId: string): Promise<void> {
        await tx.characters[characterId].update({
            currentLocation: locationId,
        });
    },

    /**
     * Delete character
     */
    async deleteCharacter(characterId: string): Promise<void> {
        await tx.characters[characterId].delete();
    },
};

export default characterService;
