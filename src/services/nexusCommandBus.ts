
export interface NexusJob {
    id: string;
    type: 'ai' | 'build' | 'pipeline' | 'long_running' | 'workflow' | 'rsmv_compile';
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

    setEnv(env: 'dev' | 'prod') { this.env = env; }
    setAiMode(mode: any) { this.aiMode = mode; }

    registerJob(job: Omit<NexusJob, 'startTime'>): NexusJob {
        const fullJob = { ...job, startTime: Date.now() };
        this.jobRegistry.set(job.id, fullJob);
        this.notify({ type: 'JOB_REGISTERED', payload: fullJob });
        return fullJob;
    }

    completeJob(id: string) {
        this.jobRegistry.delete(id);
        this.notify({ type: 'JOB_COMPLETED', payload: id });
    }

    panic() {
        console.warn('[NEXUS_PANIC] TERMINATING ALL JOBS');
        this.jobRegistry.forEach(job => {
            job.abortController.abort();
        });
        this.jobRegistry.clear();
        this.notify({ type: 'PANIC_TRIGGERED' });
    }

    private notify(action: any) {
        this.listeners.forEach(l => l(action));
    }

    subscribe(listener: (action: any) => void) {
        this.listeners.push(listener);
        return () => { this.listeners = this.listeners.filter(l => l !== listener); };
    }

    getJobs() { return Array.from(this.jobRegistry.values()); }
}

export const nexusBus = new NexusCommandBus();
