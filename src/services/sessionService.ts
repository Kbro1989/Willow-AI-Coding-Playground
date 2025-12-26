export interface SessionMetrics {
    totalTokens: number;
    totalCost: number;
    requestCount: number;
    startTime: number;
}

class SessionService {
    private metrics: SessionMetrics = {
        totalTokens: 0,
        totalCost: 0,
        requestCount: 0,
        startTime: Date.now()
    };

    private HARD_COST_LIMIT = 5.00; // $5.00 limit for current session
    private listeners: Array<(m: SessionMetrics) => void> = [];

    getMetrics() {
        return { ...this.metrics };
    }

    updateMetrics(tokens: number, cost: number) {
        this.metrics.totalTokens += tokens;
        this.metrics.totalCost += cost;
        this.metrics.requestCount += 1;
        this.notify();
    }

    isOverQuota(): boolean {
        return this.metrics.totalCost >= this.HARD_COST_LIMIT;
    }

    subscribe(listener: (m: SessionMetrics) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(l => l(this.metrics));
    }

    reset() {
        this.metrics = {
            totalTokens: 0,
            totalCost: 0,
            requestCount: 0,
            startTime: Date.now()
        };
        this.notify();
    }
}

export const sessionService = new SessionService();
export default sessionService;
