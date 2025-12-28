
import { NeuralLimb, NeuralRegistry } from './NeuralRegistry';

export class PipelineMonitorLimb {
    private static instance: PipelineMonitorLimb;
    private registry: NeuralRegistry;
    private lastBuildStatus: { success: boolean, errorCount: number, timestamp: number, output: string } = {
        success: true,
        errorCount: 0,
        timestamp: Date.now(),
        output: ''
    };

    private constructor(registry: NeuralRegistry) {
        this.registry = registry;
        this.register();
    }

    public static initialize(registry: NeuralRegistry): PipelineMonitorLimb {
        if (!PipelineMonitorLimb.instance) {
            PipelineMonitorLimb.instance = new PipelineMonitorLimb(registry);
        }
        return PipelineMonitorLimb.instance;
    }

    private register() {
        const limb: NeuralLimb = {
            id: 'pipeline_monitor',
            name: 'Pipeline Monitor',
            description: 'Wraps the build pipeline to provide real-time telemetry on compilation health and type safety.',
            capabilities: [
                {
                    name: 'check_health',
                    description: 'Trigger a health probe to the local dev server.',
                    parameters: {},
                    handler: async () => {
                        // Real probe to the "Feet" (Vite Dev Server)
                        try {
                            const start = Date.now();
                            const res = await fetch(window.location.origin); // Self-probe
                            if (res.ok) {
                                this.updateStatus(true, 0, 'System Operational');
                                return {
                                    status: 'healthy',
                                    latency: Date.now() - start,
                                    timestamp: Date.now()
                                };
                            } else {
                                this.updateStatus(false, 1, `HTTP ${res.status}`);
                                return { status: 'degraded', error: `HTTP ${res.status}` };
                            }
                        } catch (e) {
                            this.updateStatus(false, 1, 'Connection Refused');
                            return { status: 'critical', error: 'Dev Server Unreachable' };
                        }
                    }
                },
                {
                    name: 'get_dependency_graph',
                    description: 'Analyze import statements (simulated for now).',
                    parameters: {},
                    handler: async () => {
                        return { status: 'Graph generation requires backend analysis.', nodes: 0, edges: 0 };
                    }
                }
            ],
            getContext: () => ({
                lastBuild: this.lastBuildStatus.timestamp,
                errorCount: this.lastBuildStatus.errorCount,
                isHealthy: this.lastBuildStatus.success
            })
        };

        this.registry.registerLimb(limb);
        console.log('[PipelineMonitor] Registered as Neural Limb');
    }

    // Public method to update status from external sources (e.g. valid 'tsc' run via bridge)
    public updateStatus(success: boolean, errorCount: number, output: string) {
        this.lastBuildStatus = {
            success,
            errorCount,
            timestamp: Date.now(),
            output
        };
        // Emit event via registry if possible (requires extended registry)
        this.registry.emit('pipeline_update', this.lastBuildStatus);
    }
}
