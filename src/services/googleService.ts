/**
 * Google Services Integration
 * Enhancing Antigravity with Search, Vision, and Creative Tools
 */

export interface SearchResult {
    title: string;
    link: string;
    snippet: string;
}

// Uses same-origin Pages Function in production, or can override for local dev
const API_BASE = import.meta.env.VITE_API_BASE || '';
const SEARCH_ENGINE_ID = localStorage.getItem('google_cse_id') || import.meta.env.VITE_GOOGLE_CSE_ID || '';

import { chat } from './modelRouter';

export const googleSearch = async (query: string): Promise<SearchResult[]> => {
    if (!query.trim()) return [];

    if (!SEARCH_ENGINE_ID) {
        console.warn('[Google] Search aborted: Missing VITE_GOOGLE_CSE_ID. Please configure in .env or Settings.');
        return [];
    }

    try {
        // Uses Pages Function at /api/google-search (same origin in production)
        const url = `${API_BASE}/api/google-search?q=${encodeURIComponent(query)}&cx=${encodeURIComponent(SEARCH_ENGINE_ID)}`;
        const response = await fetch(url);

        if (!response.ok) {
            // Log warning but don't crash the engine; return empty results
            console.error(`[Google] API failure: ${response.status} ${response.statusText}`);
            return [];
        }

        const data = await response.json();

        return (data.items || []).map((item: any) => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet
        }));
    } catch (error) {
        console.error('[Google] Search network error:', error);
        return [];
    }
};

export const generateCopy = async (topic: string, tone: 'professional' | 'creative' | 'marketing'): Promise<string> => {
    try {
        const systemPrompt = `You are an expert copywriter. Write engaging, high-quality copy for the following topic. 
Tone: ${tone.toUpperCase()}.
Topic: ${topic}
Format: Markdown.`;

        const response = await chat(
            `Please generate the copy for "${topic}".`,
            [], // History
            systemPrompt // System prompt
        );

        if (response instanceof ReadableStream) {
            throw new Error('Streaming not supported for copy generation');
        }

        return response.content || "No content generated.";
    } catch (error) {
        console.error('[Google] Copy generation error:', error);
        return "I couldn't generate the copy at this moment. Please check the neural link.";
    }
};
