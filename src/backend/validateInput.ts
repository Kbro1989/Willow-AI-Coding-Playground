/**
 * validateInput.ts - Input sanitization and safety layer
 */

const MALICIOUS_PATTERNS = [
    /ignore previous instructions/i,
    /drop table/i,
    /rm -rf/i,
    /system\(/i,
    /child_process/i
];

/**
 * Sanitizes user input and prevents malicious AI prompts
 */
export const validatePrompt = (prompt: string): { isValid: boolean; error?: string } => {
    if (prompt.length > 4000) {
        return { isValid: false, error: 'Prompt exceeds maximum length' };
    }

    for (const pattern of MALICIOUS_PATTERNS) {
        if (pattern.test(prompt)) {
            return { isValid: false, error: 'Malicious pattern detected in prompt' };
        }
    }

    return { isValid: true };
};

/**
 * Basic input sanitization
 */
export const sanitizeInput = (input: string): string => {
    return input.replace(/[<>]/g, ''); // Simple HTML tag removal
};
