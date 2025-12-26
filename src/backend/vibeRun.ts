/**
 * vibRun.ts - The heart of AI-driven logic execution
 * Implements a sandbox for running generated code with error trapping
 */

export interface ExecutionResult {
    success: boolean;
    output: any;
    duration: number;
    logs: string[];
    error?: string;
}

/**
 * Executes a code snippet in a sandboxed context
 * @note This implementation targets the browser environment with bridge fallbacks.
 * In a local Node environment, this would utilize vm2.
 */
export const executeVibe = async (code: string, context: any = {}): Promise<ExecutionResult> => {
    const startTime = Date.now();
    const logs: string[] = [];

    // Mock console for log capture
    const mockConsole = {
        log: (...args: any[]) => logs.push(`[LOG]: ${args.join(' ')}`),
        error: (...args: any[]) => logs.push(`[ERROR]: ${args.join(' ')}`),
        warn: (...args: any[]) => logs.push(`[WARN]: ${args.join(' ')}`)
    };

    try {
        console.log('[vibeRun] Initializing neural execution pulse...');

        // Basic safety check
        if (code.includes('window.location') || code.includes('localStorage')) {
            throw new Error('Sandbox violation: Unauthorized global access');
        }

        // We use a Function constructor with localized scope
        const runner = new Function('context', 'console', `
            try {
                ${code}
            } catch (e) {
                throw e;
            }
        `);

        // Execute with context
        const output = runner(context, mockConsole);

        return {
            success: true,
            output,
            duration: Date.now() - startTime,
            logs
        };
    } catch (error: any) {
        console.error('[vibeRun] Execution halted:', error.message);
        return {
            success: false,
            output: null,
            duration: Date.now() - startTime,
            logs,
            error: error.message
        };
    }
};

/**
 * Neural Bridge Fallback: Executes tasks via the local AI bridge if browser sandbox is too restrictive
 */
export const executeLocalBridge = async (task: string): Promise<any> => {
    const { bridgeService } = await import('../services/localBridgeService');
    return await bridgeService.runTask(task);
};
