/**
 * AI Usage Tracking Service
 * Tracks and analyzes AI model usage and costs
 */

import { tx, id } from '@instantdb/react';
import type { AIUsageMetrics } from '../../types';

export const aiUsageService = {
    /**
     * Log AI model usage
     */
    async logUsage(metrics: Omit<AIUsageMetrics, 'id'>): Promise<string> {
        const usageId = id();
        await tx.aiUsage[usageId].update(metrics);
        return usageId;
    },

    /**
     * Get usage stats for a specific model
     */
    async getModelStats(model: string, timeRangeMs: number = 86400000): Promise<{
        totalCalls: number;
        totalCost: number;
        totalTokens: number;
        avgDuration: number;
        successRate: number;
    }> {
        const since = Date.now() - timeRangeMs;
        const { data } = await tx.aiUsage
            .where({ model, timestamp: { $gte: since } })
            .get();

        const metrics = data as AIUsageMetrics[];

        if (metrics.length === 0) {
            return {
                totalCalls: 0,
                totalCost: 0,
                totalTokens: 0,
                avgDuration: 0,
                successRate: 0,
            };
        }

        const totalCalls = metrics.length;
        const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
        const totalTokens = metrics.reduce((sum, m) => sum + m.inputTokens + m.outputTokens, 0);
        const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / totalCalls;
        const successCount = metrics.filter(m => m.success).length;
        const successRate = (successCount / totalCalls) * 100;

        return {
            totalCalls,
            totalCost,
            totalTokens,
            avgDuration,
            successRate,
        };
    },

    /**
     * Get usage by provider
     */
    async getProviderUsage(provider: string, timeRangeMs: number = 86400000): Promise<AIUsageMetrics[]> {
        const since = Date.now() - timeRangeMs;
        const { data } = await tx.aiUsage
            .where({ provider, timestamp: { $gte: since } })
            .get();
        return data as AIUsageMetrics[];
    },

    /**
     * Get total cost for a user
     */
    async getUserCost(userId: string, timeRangeMs: number = 86400000): Promise<number> {
        const since = Date.now() - timeRangeMs;
        const { data } = await tx.aiUsage
            .where({ userId, timestamp: { $gte: since } })
            .get();

        const metrics = data as AIUsageMetrics[];
        return metrics.reduce((sum, m) => sum + m.cost, 0);
    },

    /**
     * Get most used models
     */
    async getTopModels(limit: number = 10): Promise<{ model: string; count: number }[]> {
        const { data } = await tx.aiUsage.get();
        const metrics = data as AIUsageMetrics[];

        const modelCounts = metrics.reduce((acc, m) => {
            acc[m.model] = (acc[m.model] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(modelCounts)
            .map(([model, count]) => ({ model, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    },
};

export default aiUsageService;
