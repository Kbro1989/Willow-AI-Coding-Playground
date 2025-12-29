
import { nexusBus } from './nexusCommandBus';

export interface RouteRequest {
    priority?: 'critical' | 'high' | 'normal' | 'background';
    allowPaidOverflow?: boolean;
    provider?: string;
    model?: string;
    context?: any;
}

export interface RouteResult {
    success: boolean;
    provider?: string;
    model?: string;
    error?: string;
    retryAfter?: number;
    queued?: boolean;
}

const QUOTA_LIMITS = {
    CLOUDFLARE_DAILY: 100000,
    GEMINI_FLASH_DAILY: 1500, // 1500 free requests/day
    PAID_HARD_LIMIT_USD: 1.00
};

class HardBlockEnforcer {
    private isPaidServicesEnabled = false; // Default to FALSE (Kill Switch Active)
    private dailyUsage = {
        cloudflare: 0,
        gemini: 0,
        paidUsd: 0.0
    };
    private lastReset = Date.now();

    constructor() {
        this.loadState();
        this.checkReset();
    }

    private loadState() {
        const saved = localStorage.getItem('antigravity_hardblock_state');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.dailyUsage = state.dailyUsage || { cloudflare: 0, gemini: 0, paidUsd: 0 };
                this.lastReset = state.lastReset || Date.now();
            } catch (e) {
                console.warn('[HardBlock] Failed to load state, resetting.');
            }
        }

        // Sync global kill switch if set externally
        if ((globalThis as any).ALLOW_PAID_SERVICES !== undefined) {
            this.isPaidServicesEnabled = (globalThis as any).ALLOW_PAID_SERVICES;
        }
    }

    private saveState() {
        localStorage.setItem('antigravity_hardblock_state', JSON.stringify({
            dailyUsage: this.dailyUsage,
            lastReset: this.lastReset
        }));
        // Broadcast update for UI
        nexusBus.dispatchEvent('hardblock_update', this.getStats());
    }

    private checkReset() {
        const now = new Date();
        const last = new Date(this.lastReset);

        // Reset at 00:00 UTC
        if (now.getUTCDate() !== last.getUTCDate() || now.getTime() - last.getTime() > 24 * 60 * 60 * 1000) {
            console.log('[HardBlock] 🔄 DAILY QUOTA RESET');
            this.dailyUsage = { cloudflare: 0, gemini: 0, paidUsd: 0 }; // Keep paid reset? Or monthly? Plan said Daily/Monthly reset logic. Let's do daily for now for simplicity of the prompt's request.
            this.lastReset = Date.now();
            this.saveState();
        }
    }

    public canUseProvider(provider: 'cloudflare' | 'gemini' | 'paid'): boolean {
        this.checkReset();

        if (provider === 'cloudflare') {
            return this.dailyUsage.cloudflare < QUOTA_LIMITS.CLOUDFLARE_DAILY;
        }

        if (provider === 'gemini') {
            return this.dailyUsage.gemini < QUOTA_LIMITS.GEMINI_FLASH_DAILY;
        }

        if (provider === 'paid') {
            if (!this.isPaidServicesEnabled) return false;
            // Strict $1.00 limit
            return this.dailyUsage.paidUsd < QUOTA_LIMITS.PAID_HARD_LIMIT_USD;
        }

        return false;
    }

    public trackUsage(provider: 'cloudflare' | 'gemini' | 'paid', costUsd: number = 0) {
        if (provider === 'cloudflare') this.dailyUsage.cloudflare++;
        if (provider === 'gemini') this.dailyUsage.gemini++;
        if (provider === 'paid') this.dailyUsage.paidUsd += costUsd;
        this.saveState();
    }

    public getStats() {
        this.checkReset();
        return {
            usage: { ...this.dailyUsage },
            limits: QUOTA_LIMITS,
            isPaidEnabled: this.isPaidServicesEnabled,
            timeUntilReset: this.getTimeUntilReset()
        };
    }

    public setKillSwitch(allowPaid: boolean) {
        this.isPaidServicesEnabled = allowPaid;
        (globalThis as any).ALLOW_PAID_SERVICES = allowPaid;
        this.saveState();
    }

    private getTimeUntilReset(): string {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setUTCDate(now.getUTCDate() + 1);
        tomorrow.setUTCHours(0, 0, 0, 0);
        const diff = tomorrow.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }
}

export const hardBlockEnforcer = new HardBlockEnforcer();
