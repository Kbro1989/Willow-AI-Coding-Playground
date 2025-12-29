
export interface NexusJob {
    id: string;
    type: 'ai' | 'build' | 'pipeline' | 'long_running' | 'workflow' | 'rsmv_compile';
    priority: 'reflex' | 'thought'; // Reflex = High, Thought = Normal
    description: string;
    abortController: AbortController;
    startTime: number;
    metadata?: any;
}

class NexusCommandBus {
    private jobRegistry: Map<string, NexusJob> = new Map();
    private env: 'dev' | 'prod' = 'dev';
    private aiMode: 'assist' | 'co-pilot' | 'autonomous' | 'read-only' = 'assist';
    private listeners: ((action: any) => void)[] = [];
    private MEMORY_KEY = 'nexus_spine_memory';

    constructor() {
        this.restoreMemory();
        // Auto-save every 5 seconds
        setInterval(() => this.saveMemory(), 5000);

        // --- SPINAL REFLEX ARC ---
        // Automatically route pain signals to Proprioception
        this.subscribe((event) => {
            if (event.type === 'REFLEX_PAIN') {
                console.warn('[NEXUS_SPINE] Reflex Arc Triggered:', event.payload);
                import('./ai/contextService').then(({ contextService }) => {
                    contextService.recordReflexPain(
                        event.payload.provider || 'unknown',
                        event.payload.severity === 'reflex' ? 0.8 : 0.4
                    );
                });
            }
        });
    }

    setEnv(env: 'dev' | 'prod') { this.env = env; }
    setAiMode(mode: any) { this.aiMode = mode; }

    registerJob(job: Omit<NexusJob, 'startTime' | 'priority'> & { priority?: 'reflex' | 'thought' }): NexusJob {
        const fullJob: NexusJob = {
            ...job,
            priority: job.priority || 'thought',
            startTime: Date.now()
        };

        this.jobRegistry.set(job.id, fullJob);
        this.notify({ type: 'JOB_REGISTERED', payload: fullJob });
        this.saveMemory(); // Reflex save
        return fullJob;
    }

    completeJob(id: string) {
        this.jobRegistry.delete(id);
        this.notify({ type: 'JOB_COMPLETED', payload: id });
        this.saveMemory();
    }

    clearCompletedJobs() {
        // Since getJobs() returns current ones, and we delete on complete,
        // this might be for a "history" feature later.
        // For now, if we had a history, we'd clear it.
        // But the UI shows currently running ones.
        // If the user wants to "FLUSH", maybe they mean force clear all?
        // Or maybe they mean clear 'finished' ones if we kept them.
        // Let's implement a 'panic-lite' that just clears non-reflex jobs.
        this.jobRegistry.forEach((job, id) => {
            if (job.priority !== 'reflex') {
                job.abortController.abort();
                this.jobRegistry.delete(id);
            }
        });
        this.notify({ type: 'JOBS_FLUSHED' });
        this.saveMemory();
    }

    panic() {
        console.warn('[NEXUS_PANIC] TERMINATING ALL JOBS');
        this.jobRegistry.forEach(job => {
            job.abortController.abort();
        });
        this.jobRegistry.clear();
        localStorage.removeItem(this.MEMORY_KEY); // Wipe memory
        this.notify({ type: 'PANIC_TRIGGERED' });
    }

    dispatchEvent(type: string, payload?: any) {
        this.notify({ type, payload });
    }

    private notify(action: any) {
        this.listeners.forEach(l => l(action));
    }

    subscribe(listener: (action: any) => void) {
        this.listeners.push(listener);
        return () => { this.listeners = this.listeners.filter(l => l !== listener); };
    }

    getJobs() { return Array.from(this.jobRegistry.values()); }

    // --- Spine Memory (Persistence) ---
    private saveMemory() {
        const jobs = Array.from(this.jobRegistry.values()).map(j => ({
            ...j,
            abortController: undefined // Cannot serialize AbortController
        }));
        localStorage.setItem(this.MEMORY_KEY, JSON.stringify(jobs));
    }

    private restoreMemory() {
        const saved = localStorage.getItem(this.MEMORY_KEY);
        if (saved) {
            try {
                const jobs = JSON.parse(saved);
                jobs.forEach((j: any) => {
                    // Restore job but with a FRESH AbortController (old one is dead)
                    // If the job was 'running', we might need to assume it failed or needs restart.
                    // For now, we list it but mark it as 'interrupted' or let the system see it.
                    // Actually, for pure UI persistence, we add it back. 
                    this.jobRegistry.set(j.id, {
                        ...j,
                        abortController: new AbortController() // Resurrect the nerve
                    });
                });
                console.log(`[NexusSpine] Restored ${jobs.length} jobs from memory.`);
            } catch (e) {
                console.error('[NexusSpine] Memory Restore Failed', e);
            }
        }
    }
}

export const nexusBus = new NexusCommandBus();
