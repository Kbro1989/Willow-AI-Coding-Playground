import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowEngine, Workflow } from './workflowEngine';
import { modelRouter } from '../../services/modelRouter';
import { nexusBus } from '../../services/nexusCommandBus';

// Mock dependencies
vi.mock('../../services/modelRouter', () => ({
    modelRouter: {
        route: vi.fn().mockResolvedValue({
            content: 'AI Response',
            imageUrl: 'http://img.url',
            code: 'console.log("hi")',
            model: 'mock-model'
        }),
        chat: vi.fn().mockResolvedValue({ content: 'AI Response' }),
        generateVideo: vi.fn().mockResolvedValue({ videoUrl: 'http://vid.url' }),
        processAudio: vi.fn().mockResolvedValue({ audioUrl: 'http://audio.url' })
    }
}));

vi.mock('../../services/nexusCommandBus', () => ({
    nexusBus: {
        registerJob: vi.fn().mockReturnValue('mock-job-id'),
        completeJob: vi.fn()
    }
}));

vi.mock('../../services/loggingService', () => ({
    logTask: vi.fn().mockResolvedValue(true)
}));

vi.mock('../../services/bridgeService', () => ({
    createFile: vi.fn().mockResolvedValue({ success: true }),
    executeCommand: vi.fn().mockResolvedValue({ stdout: 'ok' })
}));

vi.mock('../../services/agents/orchestratorAgent', () => ({
    orchestrate: vi.fn().mockResolvedValue('Done')
}));

vi.mock('../../services/sessionService', () => ({
    default: {
        isOverQuota: vi.fn().mockReturnValue(false)
    }
}));

const engine = new WorkflowEngine();

const SIMPLE_WORKFLOW: Workflow = {
    id: 'test-wf',
    name: 'Test Pipeline',
    nodes: [
        { id: '1', type: 'input', position: { x: 0, y: 0 }, parameters: { value: 'Hello World' } },
        { id: '2', type: 'transform', position: { x: 100, y: 0 }, parameters: { code: 'return data.toUpperCase();' } },
        { id: '3', type: 'ai_text', position: { x: 200, y: 0 }, parameters: { model: 'gemini' } }
    ],
    connections: [
        { id: 'c1', sourceNode: '1', sourceOutput: 'data', targetNode: '2', targetInput: 'data' },
        { id: 'c2', sourceNode: '2', sourceOutput: 'result', targetNode: '3', targetInput: 'prompt' }
    ]
};

describe('WorkflowEngine', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should execute a linear pipeline successfully', async () => {
        const result = await engine.execute(SIMPLE_WORKFLOW);

        expect(result.success).toBe(true);
        expect(modelRouter.route).toHaveBeenCalled();

        // Find the call to modelRouter.route and check its prompt
        const routeCall = (modelRouter.route as any).mock.calls.find((call: any) => call[0].type === 'text');
        expect(routeCall[0].prompt).toBe('HELLO WORLD');
    });

    it('should handle execution errors gracefully', async () => {
        (modelRouter.route as any).mockRejectedValueOnce(new Error('AI Failed'));

        const badWorkflow: Workflow = {
            id: 'bad-wf',
            name: 'Bad Pipeline',
            nodes: [
                { id: '1', type: 'ai_text', position: { x: 0, y: 0 }, parameters: { prompt: 'fail' } }
            ],
            connections: []
        };

        const result = await engine.execute(badWorkflow);
        expect(result.success).toBe(false);
        expect(result.error).toContain('AI Failed');
    });
});
