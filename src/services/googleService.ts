/**
 * Google Services Integration
 * Enhancing Antigravity with Search, Vision, and Creative Tools
 */

export interface SearchResult {
    title: string;
    link: string;
    snippet: string;
}

// Bridge-relay URL (deployed worker or local dev)
const BRIDGE_RELAY_URL = import.meta.env.VITE_BRIDGE_RELAY_URL || 'https://antigravity-bridge-relay.kristain33rs.workers.dev';
const SEARCH_ENGINE_ID = localStorage.getItem('google_cse_id') || import.meta.env.VITE_GOOGLE_CSE_ID || '';

import { chat } from './modelRouter';

export const googleSearch = async (query: string): Promise<SearchResult[]> => {
    if (!query.trim()) return [];

    try {
        // Use bridge-relay to proxy the request (keeps API key server-side)
        const url = `${BRIDGE_RELAY_URL}/api/google-search?q=${encodeURIComponent(query)}&cx=${encodeURIComponent(SEARCH_ENGINE_ID)}`;
        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Search failed: ${response.statusText}`);
        }

        const data = await response.json();

        return (data.items || []).map((item: any) => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet
        }));
    } catch (error) {
        console.error('[Google] Search error:', error);
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
