import { describe, it, expect, vi } from 'vitest';
import { contextService } from './contextService';
import directorMemory from '../directorMemoryService';

vi.mock('../directorMemoryService', () => ({
    default: {
        getAll: vi.fn().mockReturnValue([
            { id: '1', scope: 'project', content: 'The AI is learning' },
            { id: '2', scope: 'session', content: 'User is talking' }
        ])
    }
}));

describe('ContextService', () => {
    it('should aggregate unified context correctly', async () => {
        contextService.updateLocalState({ activeFile: 'test.ts', projectEnv: 'prod' });
        const context = await contextService.getUnifiedContext();

        expect(context.activeFile).toBe('test.ts');
        expect(context.projectEnv).toBe('prod');
        expect(context.recentMemories).toHaveLength(2);
        expect(context.recentMemories[0]).toContain('[PROJECT] The AI is learning');
    });

    it('should format context as prompt string', async () => {
        contextService.updateLocalState({ activeFile: 'index.tsx' });
        const prompt = await contextService.getContextAsPrompt();

        expect(prompt).toContain('[SYSTEM_CONTEXT]');
        expect(prompt).toContain('File: index.tsx');
        expect(prompt).toContain('[RECENT_MEMORIES]');
    });
});
