export interface CodeAnalysis {
    language: string;
    lineCount: number;
    score: number; // 0-100
    isExecutable: boolean;
}

/**
 * Detects language based on snippet content
 */
export const detectLanguage = (code: string): string => {
    if (code.includes('import React') || code.includes('export default')) return 'typescript';
    if (code.includes('def ') || code.includes('import os')) return 'python';
    if (code.includes('extends Player') || code.includes('func _ready()')) return 'gdscript';
    return 'javascript';
};

/**
 * Analyzes code quality and returns a score
 */
export const analyzeCodeQuality = (code: string): number => {
    let score = 100;
    if (code.length < 10) score -= 50;
    if (code.includes('TODO')) score -= 10;
    if (!code.includes(';') && detectLanguage(code) === 'javascript') score -= 5;
    return Math.max(0, score);
};

/**
 * Returns basic metrics for a code snippet
 */
export const processCodeSnippet = (code: string): CodeAnalysis => {
    return {
        language: detectLanguage(code),
        lineCount: code.split('\n').length,
        score: analyzeCodeQuality(code),
        isExecutable: true
    };
};
