import { modelRouter, ModelRequest, ModelResponse } from '../services/modelRouter';
import { validatePrompt } from './validateInput';
import { throttle } from './throttleRequest';
import { classifyTask } from './taskClassifier';
import { logTask } from '../services/loggingService';
import { executeVibe } from './vibeRun';
import { directorMemory } from '../services/directorMemoryService';

/**
 * routeToModel.ts - AI Task Dispatcher
 * The intelligent routing layer for the Antigravity Nexus.
 */

export interface NexusResponse extends Omit<ModelResponse, 'provider'> {
    provider: string;
    safe: boolean;
    throttled: boolean;
    taskType?: string;
    executionLogs?: string[];
}

/**
 * Intelligent routing with integrated classification, safety, and throttling
 */
export const routeNexus = async (request: ModelRequest): Promise<NexusResponse | ReadableStream> => {
    const startTime = Date.now();
    const taskId = `task-${Date.now()}`;

    // 1. Classification
    const task = classifyTask(request.prompt);
    console.log(`[NEXUS_CLASSIFIER] Task: ${taskId} | Type: ${task.type} | Intent: ${task.intent}`);

    // 2. Validate Input
    const validation = validatePrompt(request.prompt);
    if (!validation.isValid) {
        await logTask({ taskId, step: 'VALIDATION', status: 'failure', metadata: { error: validation.error }, timestamp: Date.now() });
        throw new Error(`[NEXUS_SECURITY] ${validation.error}`);
    }

    // 3. Apply Throttling
    const isAllowed = throttle(request.type);
    if (!isAllowed) {
        await logTask({ taskId, step: 'THROTTLING', status: 'failure', metadata: { reason: 'rate_limit' }, timestamp: Date.now() });
        return {
            content: 'Request throttled. Please wait a moment before attempting another AI operation.',
            model: 'nexus-gatekeeper',
            provider: 'internal',
            latency: 0,
            safe: true,
            throttled: true
        } as NexusResponse;
    }

    await logTask({ taskId, step: 'ROUTING', status: 'pending', metadata: { taskType: task.type }, timestamp: Date.now() });

    // 4. Local Execution Sandbox (If CODE task)
    if (task.type === 'CODE' && request.options?.executeLocally) {
        console.log(`[NEXUS_ROUTER] Routing to vibeRun sandbox for ${taskId}`);
        const result = await executeVibe(request.prompt, request.context || {});

        await logTask({
            taskId, step: 'EXECUTION', status: result.success ? 'success' : 'failure',
            duration: Date.now() - startTime,
            metadata: { method: 'vibeRun' },
            timestamp: Date.now()
        });

        return {
            content: result.output,
            executionLogs: result.logs,
            model: 'vibe-sandbox',
            provider: 'local',
            latency: Date.now() - startTime,
            safe: true,
            throttled: false,
            taskType: 'CODE'
        } as NexusResponse;
    }

    // 5. Remote Routing (Default Fallback)
    console.log(`[NEXUS_ROUTER] Proxying ${request.type} request to Model Router for ${taskId}...`);

    // Inject Director Memory Context
    const contextStr = directorMemory.getContextSummary();
    if (contextStr) {
        request.systemPrompt = (request.systemPrompt || '') + contextStr;
    }

    const response = await modelRouter.route(request);

    if (response instanceof ReadableStream) {
        return response;
    }

    await logTask({
        taskId, step: 'COMPLETE', status: 'success',
        duration: Date.now() - startTime,
        metadata: { provider: response.provider, model: response.model },
        timestamp: Date.now()
    });

    return {
        ...response,
        safe: true,
        throttled: false,
        taskType: task.type
    } as NexusResponse;
};

/**
 * Specialized logic for 3D/Media tasks
 */
export const processAndRoute = async (type: '3d' | 'media' | 'code', prompt: string) => {
    // This combines routing with post-processing logic from our backend processors
    // If type is 3d, pass it as 3d to the router (which now supports it)
    const requestType = type === '3d' ? '3d' : (type === 'media' ? 'image' : 'code');
    const response = await routeNexus({ type: requestType as any, prompt });

    // Future: Add automated enhancement logic here (e.g. upscaling after generation)
    return response;
};
