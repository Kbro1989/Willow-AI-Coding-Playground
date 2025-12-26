import { id, tx } from '@instantdb/react';
import { db } from '../lib/db';

export type MemoryScope = 'session' | 'project' | 'ephemeral';

export interface MemoryEntry {
    id: string;
    scope: MemoryScope;
    content: string;
    importance: number; // 0 to 1
    timestamp: number;
    metadata?: any;
    tags?: string[];
}

class DirectorMemoryService {
    private sessionMemory: MemoryEntry[] = [];
    private projectMemory: MemoryEntry[] = [];
    private ephemeralMemory: MemoryEntry[] = [];

    constructor() {
        this.loadProjectMemory();
    }

    private async loadProjectMemory() {
        // Future: Fetch from InstantDB
        console.log('[MEMORY] Initializing persistent project context...');
    }

    /**
     * Add a memory entry to a specific scope
     */
    async addMemory(content: string, scope: MemoryScope = 'session', importance: number = 0.5, tags: string[] = []) {
        const entry: MemoryEntry = {
            id: `mem-${Math.random().toString(36).slice(2, 9)}`,
            scope,
            content,
            importance,
            timestamp: Date.now(),
            tags
        };

        if (scope === 'session') this.sessionMemory.push(entry);
        else if (scope === 'project') {
            this.projectMemory.push(entry);
            this.syncToProjectDb(entry);
        }
        else this.ephemeralMemory.push(entry);

        return entry;
    }

    /**
     * Get context summary for prompt injection
     */
    getContextSummary(limit: number = 10): string {
        const all = [...this.projectMemory, ...this.sessionMemory].sort((a, b) => b.importance - a.importance);
        const top = all.slice(0, limit);

        if (top.length === 0) return '';

        return `\n\n[DIRECTOR_CONTEXT]\n${top.map(m => `- [${m.scope}] ${m.content}`).join('\n')}\n`;
    }

    /**
     * Clear specific memory scope
     */
    clear(scope: MemoryScope) {
        if (scope === 'session') this.sessionMemory = [];
        if (scope === 'ephemeral') this.ephemeralMemory = [];
    }

    private async syncToProjectDb(entry: MemoryEntry) {
        // Persistence logic for InstantDB
        try {
            const memoryId = id();
            await db.transact([
                tx.memories[memoryId].update({
                    content: entry.content,
                    scope: entry.scope,
                    importance: entry.importance,
                    timestamp: entry.timestamp,
                    tags: entry.tags
                })
            ]);
        } catch (error) {
            console.error('[MEMORY] Failed to sync to DB:', error);
        }
    }
}

export const directorMemory = new DirectorMemoryService();
export default directorMemory;
