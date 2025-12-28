
export interface AIActionCapability {
    name: string;
    description: string;
    parameters: Record<string, any>;
    handler: (params: any) => Promise<any>;
}

export interface NeuralLimb {
    id: string;
    name: string;
    description: string;
    capabilities: AIActionCapability[];
    getContext?: () => any;
}

export class NeuralRegistry {
    private limbs: Map<string, NeuralLimb> = new Map();
    private listeners: (() => void)[] = [];
    private events: Map<string, ((data: any) => void)[]> = new Map();

    public emit(event: string, data: any) {
        console.log(`[NeuralRegistry] Emitting: ${event}`, data);
        const handlers = this.events.get(event) || [];
        handlers.forEach(h => h(data));
    }

    public on(event: string, handler: (data: any) => void) {
        if (!this.events.has(event)) this.events.set(event, []);
        this.events.get(event)!.push(handler);
        return () => {
            const handlers = this.events.get(event) || [];
            this.events.set(event, handlers.filter(h => h !== handler));
        };
    }

    public registerLimb(limb: NeuralLimb) {
        console.log(`[NeuralRegistry] Registering Limb: ${limb.name} (${limb.id})`);
        this.limbs.set(limb.id, limb);
        this.notify();
    }

    public unregisterLimb(id: string) {
        this.limbs.delete(id);
        this.notify();
    }

    public getLimb(id: string): NeuralLimb | undefined {
        return this.limbs.get(id);
    }

    public getAllLimbs(): NeuralLimb[] {
        return Array.from(this.limbs.values());
    }

    public getCapability(limbId: string, capabilityName: string): AIActionCapability | undefined {
        const limb = this.limbs.get(limbId);
        return limb?.capabilities.find(c => c.name === capabilityName);
    }

    public async callCapability(limbId: string, capabilityName: string, params: any): Promise<any> {
        const cap = this.getCapability(limbId, capabilityName);
        if (!cap) throw new Error(`Capability ${capabilityName} not found on limb ${limbId}`);
        return await cap.handler(params);
    }

    public getNeuralSchema() {
        return this.getAllLimbs().map(limb => ({
            id: limb.id,
            name: limb.name,
            description: limb.description,
            capabilities: limb.capabilities.map(c => ({
                name: c.name,
                description: c.description,
                parameters: c.parameters
            }))
        }));
    }

    private notify() {
        this.listeners.forEach(l => l());
    }

    public subscribe(listener: () => void) {
        this.listeners.push(listener);
        return () => { this.listeners = this.listeners.filter(l => l !== listener); };
    }
}

export const neuralRegistry = new NeuralRegistry();
