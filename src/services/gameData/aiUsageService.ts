/**
 * AI Usage Service
 * Tracks AI model usage, token consumption, and costs
 * 
 * Uses InstantDB's transact API for data operations
 */

import { id, tx } from '@instantdb/react';
import { db } from '../../lib/db';
import type { AIUsageMetrics } from '../../types';

export interface AIUsageParams {
    model: string;
    provider: 'gemini' | 'cloudflare' | 'local' | 'local-rsmv' | 'unknown';
    taskType: 'text' | 'image' | 'code' | 'video' | 'audio' | '3d_model' | 'reasoning' | 'vision' | '3d';
    inputTokens: number;
    outputTokens: number;
    cost?: number;
    duration?: number;
    latency?: number; // Alias for duration
    success?: boolean;
    userId?: string;
}

/**
 * Log AI usage to InstantDB
 * 
 * @example
 * ```ts
 * await logAIUsage({
 *   model: 'gemini-2.0-flash',
 *   provider: 'gemini',
 *   taskType: 'code',
 *   inputTokens: 1500,
 *   outputTokens: 800,
 *   cost: 0.002,
 *   success: true
 * });
 * ```
 */
export async function logAIUsage(params: AIUsageParams): Promise<string> {
    const usageId = id();

    await db.transact([
        tx.aiUsage[usageId].update({
            model: params.model,
            provider: params.provider,
            taskType: params.taskType,
            inputTokens: params.inputTokens,
            outputTokens: params.outputTokens,
            cost: params.cost || 0,
            duration: params.latency || params.duration || 0,
            success: params.success !== false,
            userId: params.userId || null,
            timestamp: Date.now(),
        })
    ]);

    return usageId;
}

/**
 * Helper to calculate approximate costs based on provider and model
 */
export function calculateCost(
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number
): number {
    // Approximate costs per 1M tokens (in USD)
    const pricingTable: Record<string, { input: number; output: number }> = {
        'gemini-2.0-flash': { input: 0.075, output: 0.30 },
        'gemini-1.5-pro': { input: 1.25, output: 5.00 },
        'gemini-1.5-flash': { input: 0.075, output: 0.30 },
        // Cloudflare Workers AI is typically free tier or very low cost
        'cloudflare': { input: 0.001, output: 0.001 },
    };

    const pricing = pricingTable[model] || pricingTable[provider] || { input: 0, output: 0 };

    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;

    return inputCost + outputCost;
}

/**
 * Query helpers for use in React components
 * 
 * @example
 * ```tsx
 * function UsageStats() {
 *   const { data } = db.useQuery({
 *     aiUsage: {
 *       $: { 
 *         where: { 
 *           userId: currentUser.id,
 *           timestamp: { $gt: Date.now() - 86400000 } // Last 24h
 *         }
 *       }
 *     }
 *   });
 *   
 *   const totalCost = aiUsageHelpers.calculateTotalCost(data.aiUsage);
 * }
 * ```
 */
export const aiUsageHelpers = {
    /**
     * Calculate total cost from usage records
     */
    calculateTotalCost(usageRecords: AIUsageMetrics[]): number {
        return usageRecords.reduce((sum, record) => sum + (record.cost || 0), 0);
    },

    /**
     * Calculate total tokens from usage records
     */
    calculateTotalTokens(usageRecords: AIUsageMetrics[]): {
        input: number;
        output: number;
        total: number;
    } {
        const input = usageRecords.reduce((sum, r) => sum + (r.inputTokens || 0), 0);
        const output = usageRecords.reduce((sum, r) => sum + (r.outputTokens || 0), 0);

        return { input, output, total: input + output };
    },

    /**
     * Group usage by provider
     */
    groupByProvider(usageRecords: AIUsageMetrics[]): Record<string, AIUsageMetrics[]> {
        return usageRecords.reduce((groups, record) => {
            const provider = record.provider || 'unknown';
            if (!groups[provider]) {
                groups[provider] = [];
            }
            groups[provider].push(record);
            return groups;
        }, {} as Record<string, AIUsageMetrics[]>);
    },

    /**
     * Get success rate percentage
     */
    getSuccessRate(usageRecords: AIUsageMetrics[]): number {
        if (usageRecords.length === 0) return 0;

        const successful = usageRecords.filter(r => r.success).length;
        return (successful / usageRecords.length) * 100;
    },
};

export default {
    logAIUsage,
    calculateCost,
    helpers: aiUsageHelpers,
};
