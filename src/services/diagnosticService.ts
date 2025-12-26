/**
 * Diagnostic Service
 * Provides system-wide stress testing and behavior verification
 */

import { workflowEngine, Workflow } from './n8n/workflowEngine';
import { directorMemory } from './directorMemoryService';
import { logTask } from './loggingService';

export class DiagnosticService {
    /**
     * Run multiple concurrent workflows to test system stability
     */
    async runStressTest(concurrency = 5): Promise<{ total: number; success: number; failures: number }> {
        const startTime = Date.now();
        console.log(`[DIAGNOSTIC] Starting Stress Test with concurrency: ${concurrency}`);

        await logTask({
            taskId: 'stress-test',
            step: 'START',
            status: 'pending',
            timestamp: startTime,
            metadata: { concurrency }
        });

        const template: Workflow = {
            id: 'diagnostic-test',
            name: 'Diagnostic Load Test',
            nodes: [
                { id: 'start', type: 'input', position: { x: 0, y: 0 }, parameters: { value: 'Stress test data' } },
                { id: 'process', type: 'transform', position: { x: 200, y: 0 }, parameters: { code: 'return { ...data, timestamp: Date.now() };' } }
            ],
            connections: [
                { id: 'c1', sourceNode: 'start', sourceOutput: 'data', targetNode: 'process', targetInput: 'data' }
            ]
        };

        const tasks = Array.from({ length: concurrency }).map((_, i) => {
            const instance = { ...template, id: `test-${i}-${Date.now()}` };
            return workflowEngine.execute(instance);
        });

        const results = await Promise.all(tasks);
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;

        const duration = Date.now() - startTime;

        // Log result to Director Memory
        directorMemory.addMemory(
            `Load Test Completed: ${successCount}/${concurrency} success. Latency: ${duration}ms.`,
            'session',
            failureCount > 0 ? 0.9 : 0.4,
            ['diagnostic', 'telemetry']
        );

        await logTask({
            taskId: 'stress-test',
            step: 'COMPLETE',
            status: 'success',
            duration,
            metadata: { successCount, failureCount },
            timestamp: Date.now()
        });

        return { total: concurrency, success: successCount, failures: failureCount };
    }
}

export const diagnosticService = new DiagnosticService();
export default diagnosticService;
