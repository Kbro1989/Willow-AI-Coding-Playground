/**
 * Pipeline Service
 * Orchestrates multi-step AI workflows
 */

import { v4 as uuidv4 } from 'uuid';
import directorMemory from '../directorMemoryService';
import { geminiProvider } from '../geminiProvider';
import { aiMaterialService } from '../aiMaterialService';

export type PipelineStepType = 'text_generation' | 'image_generation' | 'code_modification' | 'analysis';

export interface PipelineStep {
    id: string;
    type: PipelineStepType;
    prompt: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    output?: any;
    error?: string;
}

export interface Pipeline {
    id: string;
    projectId: string;
    steps: PipelineStep[];
    currentStepIndex: number;
    status: 'idle' | 'running' | 'completed' | 'failed';
}

class PipelineService {
    private pipelines: Map<string, Pipeline> = new Map();

    /**
     * Create a new pipeline
     */
    createPipeline(projectId: string, steps: { type: PipelineStepType, prompt: string }[]): string {
        const id = uuidv4();
        const pipeline: Pipeline = {
            id,
            projectId,
            steps: steps.map(s => ({
                id: uuidv4(),
                type: s.type,
                prompt: s.prompt,
                status: 'pending'
            })),
            currentStepIndex: 0,
            status: 'idle'
        };
        this.pipelines.set(id, pipeline);
        return id;
    }

    /**
     * Run a pipeline
     */
    async runPipeline(id: string): Promise<void> {
        const pipeline = this.pipelines.get(id);
        if (!pipeline) throw new Error(`Pipeline ${id} not found`);

        pipeline.status = 'running';
        directorMemory.addMemory(`Started AI Pipeline ${id}`, 'session', 0.7);

        try {
            for (let i = 0; i < pipeline.steps.length; i++) {
                const step = pipeline.steps[i];
                pipeline.currentStepIndex = i;
                step.status = 'running';

                // Resolve previous outputs in prompt if needed (e.g. {{step_1_output}})
                const resolvedPrompt = this.resolvePrompt(step.prompt, pipeline.steps);

                // Execute Step
                const output = await this.executeStep(step.type, resolvedPrompt);

                step.output = output;
                step.status = 'completed';
            }
            pipeline.status = 'completed';
            directorMemory.addMemory(`Completed AI Pipeline ${id}`, 'session', 0.8, ['pipeline', 'success']);
        } catch (error) {
            pipeline.status = 'failed';
            const currentStep = pipeline.steps[pipeline.currentStepIndex];
            if (currentStep) {
                currentStep.status = 'failed';
                currentStep.error = String(error);
            }
            console.error('[PIPELINE] Failed:', error);
            directorMemory.addMemory(`Pipeline ${id} Failed`, 'session', 0.9, ['pipeline', 'error']);
        }
    }

    /**
     * Get pipeline state
     */
    getPipeline(id: string): Pipeline | undefined {
        return this.pipelines.get(id);
    }

    private resolvePrompt(prompt: string, steps: PipelineStep[]): string {
        let finalPrompt = prompt;
        // Simple variable substitution
        steps.forEach((s, idx) => {
            if (s.output && typeof s.output === 'string') {
                finalPrompt = finalPrompt.replace(`{{step_${idx}_output}}`, s.output);
            }
        });
        return finalPrompt;
    }

    private async executeStep(type: PipelineStepType, prompt: string): Promise<any> {
        console.log(`[PIPELINE] Executing ${type}: "${prompt.substring(0, 50)}..."`);

        switch (type) {
            case 'text_generation':
            case 'analysis':
                // Use Gemini for text/reasoning
                const response = await geminiProvider.textChat({ prompt });
                return response.content;

            case 'image_generation':
                // Use existing material service (or expand to image gen)
                // For now, mapping prompt to material gen as a proxy
                const mat = await aiMaterialService.generateMaterial(prompt);
                return mat.mapUrl;

            case 'code_modification':
                // Future: Integrate with FileSystem
                return "Code modification pending implementation";

            default:
                throw new Error(`Unknown step type: ${type}`);
        }
    }
}

export const pipelineService = new PipelineService();
export default pipelineService;
