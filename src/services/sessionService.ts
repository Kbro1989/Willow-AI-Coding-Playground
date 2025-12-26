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
    private isHardBudgetEnabled = true;
    private listeners: Array<(m: SessionMetrics & { isHardBudgetEnabled: boolean }) => void> = [];

    getMetrics() {
        return { ...this.metrics, isHardBudgetEnabled: this.isHardBudgetEnabled };
    }

    setHardBudgetEnabled(enabled: boolean) {
        this.isHardBudgetEnabled = enabled;
        this.notify();
    }

    updateMetrics(tokens: number, cost: number) {
        this.metrics.totalTokens += tokens;
        this.metrics.totalCost += cost;
        this.metrics.requestCount += 1;
        this.notify();
    }

    isOverQuota(): boolean {
        return this.isHardBudgetEnabled && this.metrics.totalCost >= this.HARD_COST_LIMIT;
    }

    subscribe(listener: (m: SessionMetrics & { isHardBudgetEnabled: boolean }) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        const fullMetrics = { ...this.metrics, isHardBudgetEnabled: this.isHardBudgetEnabled };
        this.listeners.forEach(l => l(fullMetrics));
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
