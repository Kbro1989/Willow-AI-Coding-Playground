/**
 * Google Services Integration
 * Enhancing Antigravity with Search, Vision, and Creative Tools
 */

export interface SearchResult {
    title: string;
    link: string;
    snippet: string;
}

const SEARCH_ENGINE_ID = localStorage.getItem('google_cse_id') || import.meta.env.VITE_GOOGLE_CSE_ID || 'YOUR_PSE_ID';
const API_KEY = localStorage.getItem('google_api_key') || import.meta.env.VITE_GOOGLE_API_KEY || import.meta.env.VITE_CF_RSC_API_KEY || 'AIzaSyBRrgq6OH9TBDNIkJ-02RTEBNpohyNGGkg';

import { chat } from './modelRouter';

export const googleSearch = async (query: string): Promise<SearchResult[]> => {
    // If keys are not configured, return smart mock data


    try {
        const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Search failed: ${response.statusText}`);
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

        return response.content || "No content generated.";
    } catch (error) {
        console.error('[Google] Copy generation error:', error);
        return "I couldn't generate the copy at this moment. Please check the neural link.";
    }
};
