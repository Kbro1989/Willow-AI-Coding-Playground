import { neuralRegistry } from './NeuralRegistry';
import { diagnosticService } from '../diagnosticService';
import { nexusBus } from '../nexusCommandBus';

class HealthGuardService {
    private errorThreshold = 3;
    private recentErrorCount = 0;
    private lastRecoveryTime = 0;
    private recoveryCooldown = 30000; // 30 seconds

    public register() {
        neuralRegistry.registerLimb({
            id: 'health_guard',
            name: 'Health Guard',
            description: 'Proactive system monitoring and automated error recovery.',
            capabilities: [
                {
                    name: 'get_health_summary',
                    description: 'Get a summary of recent system stability.',
                    parameters: {},
                    handler: async () => {
                        return {
                            recentErrors: this.recentErrorCount,
                            status: this.recentErrorCount >= this.errorThreshold ? 'unstable' : 'healthy',
                            lastRecovery: this.lastRecoveryTime
                        };
                    }
                },
                {
                    name: 'reset_counters',
                    description: 'Reset the proactive error tracking counters.',
                    parameters: {},
                    handler: async () => {
                        this.recentErrorCount = 0;
                        return { success: true };
                    }
                },
                {
                    name: 'report_error',
                    description: 'Report a localized error (e.g. from the code editor) for analysis and healing.',
                    parameters: {
                        message: 'string',
                        fileId: 'string?',
                        severity: 'string?',
                        context: 'any?'
                    },
                    handler: async (params: any) => {
                        this.analyzeLog(params.message, params.severity === 'error' ? 'error' : 'warn');
                        // If it's a critical error in a specific file, we might want to flag it for the Orchestrator
                        if (params.severity === 'error' && params.fileId) {
                            console.log(`[HEALTH_GUARD] Critical editor error in ${params.fileId}. Initiating healing check...`);
                        }
                        return { accepted: true, count: this.recentErrorCount };
                    }
                }
            ]
        });
    }

    /**
     * Feed logs into the guard for analysis
     */
    public analyzeLog(message: string, type: 'info' | 'warn' | 'error' | 'success') {
        if (type === 'error' || /fail|panic|crash|refused/i.test(message)) {
            this.recentErrorCount++;
            console.warn(`[HEALTH_GUARD] Detected anomaly: "${message}". Count: ${this.recentErrorCount}`);

            if (this.recentErrorCount >= this.errorThreshold) {
                this.triggerProactiveRecovery();
            }
        }

        // Decay error count over time if no new errors occur
        setTimeout(() => {
            if (this.recentErrorCount > 0) this.recentErrorCount--;
        }, 60000); // 1 minute decay
    }

    private async triggerProactiveRecovery() {
        const now = Date.now();
        if (now - this.lastRecoveryTime < this.recoveryCooldown) return;

        this.lastRecoveryTime = now;
        this.recentErrorCount = 0;

        console.log('[HEALTH_GUARD] System instability detected. Triggering automated diagnostic...');

        nexusBus.registerJob({
            id: `recovery-${now}`,
            type: 'ai',
            description: 'Automated Health Recovery',
            abortController: new AbortController()
        });

        try {
            // New Autonomous Healing Loop
            const { universalOrchestrator } = await import('./universalOrchestrator');
            await universalOrchestrator.dispatchIntent({
                source: 'health_guard',
                verb: 'heal',
                payload: {
                    text: 'System instability detected. Perform global diagnostic and repair.',
                    reason: 'Multiple threshold errors detected'
                },
                context: {
                    aiMode: 'lockdown',
                    projectEnv: 'local',
                    bridgeStatus: 'direct',
                    panic: false,
                    view: 'console'
                }
            });

            this.lastRecoveryTime = now;
            this.recentErrorCount = 0;
            console.log('[HEALTH_GUARD] Proactive healing intent dispatched to Orchestrator.');

        } catch (err) {
            console.error('[HEALTH_GUARD] Critical failure during recovery:', err);
        }
    }
}

export const healthGuard = new HealthGuardService();
export default healthGuard;
