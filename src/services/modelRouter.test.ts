import { describe, it, expect, vi, beforeEach } from 'vitest';
import { modelRouter } from './modelRouter';
import geminiProvider from './geminiProvider';
import cloudflareProvider from './cloudflareProvider';

// Mock providers
vi.mock('./geminiProvider', () => ({
    default: {
        textChat: vi.fn(),
        generateImage: vi.fn(),
        isAvailable: vi.fn().mockReturnValue(true)
    },
    geminiProvider: {
        textChat: vi.fn(),
        generateImage: vi.fn(),
        isAvailable: vi.fn().mockReturnValue(true)
    }
}));

vi.mock('./cloudflareProvider', () => ({
    default: {
        textChat: vi.fn(),
        generateImage: vi.fn()
    },
    cloudflareProvider: {
        textChat: vi.fn(),
        generateImage: vi.fn()
    }
}));

vi.mock('./gameData/aiUsageService', () => ({
    default: {
        calculateCost: vi.fn().mockReturnValue(0.001),
        logAIUsage: vi.fn().mockResolvedValue({ success: true })
    },
    calculateCost: vi.fn().mockReturnValue(0.001),
    logAIUsage: vi.fn().mockResolvedValue({ success: true })
}));

vi.mock('./sessionService', () => ({
    default: {
        isOverQuota: vi.fn().mockReturnValue(false),
        updateMetrics: vi.fn()
    }
}));

vi.mock('./nexusCommandBus', () => ({
    nexusBus: {
        registerJob: vi.fn().mockReturnValue({ id: 'mock-job' }),
        completeJob: vi.fn()
    }
}));

describe('ModelRouter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should route TEXT requests to Gemini (Premium Tier)', async () => {
        (geminiProvider.textChat as any).mockResolvedValue({
            content: 'Gemini Response',
            model: 'gemini-2.0-flash-exp'
        });

        const response = await modelRouter.route({
            type: 'text',
            prompt: 'Hello',
            tier: 'premium'
        });

        expect(geminiProvider.textChat).toHaveBeenCalled();
        if ('content' in response) {
            expect(response.content).toBe('Gemini Response');
        } else {
            throw new Error('Expected ModelResponse, got ReadableStream');
        }
    });

    it('should fallback to Cloudflare if Gemini fails (Resilience)', async () => {
        (geminiProvider.textChat as any).mockRejectedValue(new Error('Rate Limit 429'));
        (cloudflareProvider.textChat as any).mockResolvedValue({
            content: 'Cloudflare Fallback',
            model: 'llama-3.3'
        });

        const response = await modelRouter.route({
            type: 'text',
            prompt: 'Hello again',
            tier: 'premium'
        });

        expect(geminiProvider.textChat).toHaveBeenCalled();
        expect(cloudflareProvider.textChat).toHaveBeenCalled();
        if ('content' in response) {
            expect(response.content).toBe('Cloudflare Fallback');
        }
    });

    it('should route IMAGE requests to Cloudflare (Standard)', async () => {
        (cloudflareProvider.generateImage as any).mockResolvedValue({
            imageUrl: 'http://cf.img',
            model: 'flux'
        });

        const response = await modelRouter.route({
            type: 'image',
            prompt: 'A cat',
            tier: 'standard'
        });

        expect(cloudflareProvider.generateImage).toHaveBeenCalled();
        if ('imageUrl' in response) {
            expect(response.imageUrl).toBe('http://cf.img');
        }
    });
});
