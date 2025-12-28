import { modelRouter, ModelRequest } from '../modelRouter';
import { contextService } from './contextService';
import { Message } from '../../types';
import { nexusBus } from '../nexusCommandBus';
import { directorMemory } from '../directorMemoryService';
import { neuralRegistry } from './NeuralRegistry';

export interface SprintStep {
    id: string;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    output?: string;
    error?: string;
}

export interface SprintState {
    goal: string;
    steps: SprintStep[];
    currentStepIndex: number;
    status: 'idle' | 'running' | 'completed' | 'failed';
}

class AgentSprintService {
    private state: SprintState = {
        goal: '',
        steps: [],
        currentStepIndex: -1,
        status: 'idle'
    };

    private listeners: Array<(state: SprintState) => void> = [];

    public subscribe(listener: (state: SprintState) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(l => l(this.state));
    }

    public async startSprint(goal: string) {
        const abortController = new AbortController();
        const job = nexusBus.registerJob({
            id: `sprint-${Date.now()}`,
            type: 'ai',
            description: `Agent Sprint: ${goal}`,
            abortController
        });

        this.state = {
            goal,
            steps: [],
            currentStepIndex: 0,
            status: 'running'
        };
        this.notify();

        try {
            // Step 1: Planning - Ask AI to break goal into steps
            const planningPrompt = `GOAL: "${goal}"\n\nBreak this into 3-5 atomic execution steps. Return ONLY a JSON array of strings: ["Step 1 description", "Step 2 description", ...]`;

            const planningResponse = await modelRouter.route({
                type: 'text',
                prompt: planningPrompt,
                tier: 'premium'
            });

            const content = 'content' in planningResponse ? planningResponse.content : '';
            if (!content) throw new Error('Failed to get planning content from AI');

            const stepDescriptions: string[] = JSON.parse(content.match(/\[[\s\S]*\]/)?.[0] || '[]');

            this.state.steps = stepDescriptions.map((desc, i) => ({
                id: `step-${i}`,
                description: desc,
                status: 'pending'
            }));
            this.notify();

            // Step 2: Sequential Execution
            for (let i = 0; i < this.state.steps.length; i++) {
                this.state.currentStepIndex = i;
                const step = this.state.steps[i];
                step.status = 'running';
                this.notify();

                try {
                    const context = await contextService.getUnifiedContext();
                    const executionPrompt = `MISSION GOAL: "${goal}"\nCURRENT STEP: "${step.description}"\nPREVIOUS STEPS DATA: ${JSON.stringify(this.state.steps.slice(0, i))}\n\n[CONTEXT]:\n${context}\n\nExecute this step. If it requires code, provide full file content and instructions.`;

                    const result = await modelRouter.route({
                        type: 'text', // Or 'code' if we want specialized handling
                        prompt: executionPrompt,
                        tier: 'standard'
                    });

                    if ('content' in result && result.content) {
                        step.output = result.content;
                        // Execute tools if any are found in the content
                        await this.executeStepTools(step, result.content);
                    }
                    step.status = 'completed';
                    this.notify();
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : String(err);
                    step.error = message;
                    step.status = 'failed';
                    this.state.status = 'failed';
                    this.notify();
                    break;
                }
            }

            if (this.state.status !== 'failed') {
                this.state.status = 'completed';
                this.state.currentStepIndex = -1;

                // Autonomous Mission Wrap-up
                await this.wrapUpSuccessfulMission(goal);

                this.notify();
            }

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('[AgentSprint] Global failure:', message);
            this.state.status = 'failed';
            this.notify();
        } finally {
            nexusBus.completeJob(job.id);
        }
    }

    /**
     * Human Intervention: Inject a step manually
     */
    public injectStep(description: string, atIndex?: number) {
        const newStep: SprintStep = {
            id: `human-${Date.now()}`,
            description: `[HUMAN]: ${description}`,
            status: 'pending'
        };

        const insertAt = atIndex ?? (this.state.currentStepIndex + 1);
        this.state.steps.splice(insertAt, 0, newStep);
        this.notify();
    }

    public setStepStatus(stepId: string, status: SprintStep['status'], output?: string) {
        const step = this.state.steps.find(s => s.id === stepId);
        if (step) {
            step.status = status;
            if (output) step.output = output;
            this.notify();
        }
    }

    /**
     * Parse and execute XML-style tool tags in AI output
     * Support: <cmd>command</cmd>, <write path="p">content</write>, <read path="p" />
     */
    private async executeStepTools(step: SprintStep, content: string) {
        const { localBridgeClient } = await import('../localBridgeService');

        // 1. Parse Commands
        const cmdRegex = /<cmd>([\s\S]*?)<\/cmd>/g;
        let cmdMatch;
        while ((cmdMatch = cmdRegex.exec(content)) !== null) {
            const command = cmdMatch[1].trim();
            console.log(`[AgentSprint] Executing CMD: ${command}`);
            const result = await localBridgeClient.runTerminalCommand(command);
            step.output += `\n[CMD_OUTPUT]: ${result.success ? (result.output || 'Success') : result.error}`;
        }

        // 2. Parse Writes
        const writeRegex = /<write\s+path="([^"]+)">([\s\S]*?)<\/write>/g;
        let writeMatch;
        while ((writeMatch = writeRegex.exec(content)) !== null) {
            const path = writeMatch[1];
            const fileContent = writeMatch[2];
            console.log(`[AgentSprint] Writing File: ${path}`);
            const result = await localBridgeClient.writeLocalFile(path, fileContent);
            step.output += `\n[WRITE_RESULT]: ${path} - ${result.success ? 'Success' : result.error}`;
        }

        // 3. Parse Reads
        const readRegex = /<read\s+path="([^"]+)"\s*\/>/g;
        let readMatch;
        while ((readMatch = readRegex.exec(content)) !== null) {
            const path = readMatch[1];
            console.log(`[AgentSprint] Reading File: ${path}`);
            const result = await localBridgeClient.readLocalFile(path);
            step.output += `\n[READ_CONTENT]: ${path}\n${result.success ? result.content : result.error}`;
        }

        this.notify();
    }


    private async wrapUpSuccessfulMission(goal: string) {
        console.log(`[AgentSprint] Wrapping up mission: "${goal}"`);

        // 1. Record in Director Memory
        await directorMemory.addMemory(
            `Mission Completed: "${goal}" successfully executed across ${this.state.steps.length} steps.`,
            'project',
            0.8,
            ['sprint', 'success']
        );

        // 2. Autonomous Git Commit (if git limb is available)
        try {
            const hasGit = neuralRegistry.getNeuralSchema().some(l => l.id === 'git');
            if (hasGit) {
                console.log('[AgentSprint] Triggering autonomous git commit...');
                await neuralRegistry.callCapability('git', 'commit_version', {
                    message: `AI Auto-Commit: Completed mission "${goal}"`
                });
            }
        } catch (err) {
            console.warn('[AgentSprint] Auto-commit failed:', err);
        }
    }

    public getState() {
        return this.state;
    }

    public reset() {
        this.state = {
            goal: '',
            steps: [],
            currentStepIndex: -1,
            status: 'idle'
        };
        this.notify();
    }
}

export const agentSprintService = new AgentSprintService();
