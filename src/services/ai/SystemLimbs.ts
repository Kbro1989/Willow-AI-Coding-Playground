import { neuralRegistry } from './NeuralRegistry';
import { localBridgeClient } from '../localBridgeService';
import * as gitService from '../gitService';
import { diagnosticService } from '../diagnosticService';
import { healthGuard } from './HealthGuardLimb';
import { PipelineMonitorLimb } from './PipelineMonitorLimb';

export const registerSystemLimbs = () => {
    // 1. Local Bridge Limb (Physical Hands)
    neuralRegistry.registerLimb({
        id: 'bridge',
        name: 'Local Bridge',
        description: 'Direct interface with the local OS, file system, and hardware.',
        capabilities: [
            {
                name: 'check_health',
                description: 'Verify connectivity and health of the local bridge tunnel.',
                parameters: {},
                handler: async () => {
                    const status = localBridgeClient.getStatus();
                    return { status, timestamp: Date.now() };
                }
            },
            {
                name: 'sync_status',
                description: 'Get current file synchronization mode (Dual, Local, Cloud).',
                parameters: {},
                handler: async () => {
                    const status = localBridgeClient.getStatus();
                    return { syncMode: status.syncMode };
                }
            }
        ]
    });

    // 2. Git Limb (Source Control)
    neuralRegistry.registerLimb({
        id: 'git',
        name: 'Source Control',
        description: 'Manage version history and repository state.',
        capabilities: [
            {
                name: 'get_status',
                description: 'Get the current git status (staged/unstaged files).',
                parameters: {},
                handler: async () => {
                    const { getGitStatus } = await import('../gitService');
                    return await getGitStatus();
                }
            },
            {
                name: 'commit_version',
                description: 'Commit staged changes with a descriptive message.',
                parameters: {
                    message: { type: 'string', description: 'The commit message.' }
                },
                handler: async (params) => {
                    const { commitChanges } = await import('../gitService');
                    return await commitChanges(params.message);
                }
            }
        ]
    });

    // 3. Diagnostics Limb (System Integrity)
    neuralRegistry.registerLimb({
        id: 'diagnostics',
        name: 'System Diagnostics',
        description: 'Verify system stability and run stress tests.',
        capabilities: [
            {
                name: 'run_stress_test',
                description: 'Run concurrent AI pipelines to verify environment stability.',
                parameters: {
                    concurrency: { type: 'number', description: 'Number of parallel tasks (default 5).' }
                },
                handler: async (params) => {
                    return await diagnosticService.runStressTest(params.concurrency || 5);
                }
            }
        ]
    });

    // 4. Pipeline Monitor Limb (Build Health)
    PipelineMonitorLimb.initialize(neuralRegistry);

    console.log('[NeuralRegistry] System Limbs Registered.');
};
