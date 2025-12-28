/**
 * validateInput.ts - Input sanitization and security layer
 * Enhanced with prompt injection protection
 */

// Prompt injection patterns to block
const PROMPT_INJECTION_PATTERNS = [
    /ignore\s*(all\s*)?(previous|prior|above)\s*(instructions?|prompts?|commands?)/i,
    /disregard\s*(all\s*)?(previous|prior)\s*(instructions?|prompts?)/i,
    /forget\s*(everything|all|your)\s*(previous|prior)?/i,
    /you are now\s*(a|an)?/i,
    /new\s*instructions?:/i,
    /system\s*prompt:/i,
    /\[system\]/i,
    /\[INST\]/i,
    /\<\|system\|\>/i,
    /act as if you/i,
    /pretend (that )?you/i,
    /override\s*(all\s*)?safety/i,
    /bypass\s*(filters?|restrictions?)/i,
];

// Code injection patterns
const CODE_INJECTION_PATTERNS = [
    /drop\s+table/i,
    /delete\s+from/i,
    /rm\s+-rf/i,
    /system\s*\(/i,
    /child_process/i,
    /eval\s*\(/i,
    /exec\s*\(/i,
    /require\s*\(\s*['"]child/i,
    /import\s+\*\s+from\s+['"]child/i,
];

// Path traversal patterns
const PATH_TRAVERSAL_PATTERNS = [
    /\.\.\//g,
    /\.\.\\/,
    /%2e%2e%2f/i,
    /%252e%252e%252f/i,
];

/**
 * Sanitizes AI input and blocks prompt injection attacks
 */
export const sanitizeAIInput = (input: string): string => {
    let sanitized = input;

    // Replace prompt injection patterns with [BLOCKED]
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
        sanitized = sanitized.replace(pattern, '[BLOCKED_INJECTION]');
    }

    return sanitized;
};

/**
 * Validates a prompt for malicious patterns
 */
export const validatePrompt = (prompt: string): { isValid: boolean; error?: string; sanitized?: string } => {
    const MAX_PROMPT_LENGTH = 50000; // 50k chars max

    if (!prompt || typeof prompt !== 'string') {
        return { isValid: false, error: 'Invalid prompt type' };
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
        return { isValid: false, error: `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters` };
    }

    // Check for code injection (hard block)
    for (const pattern of CODE_INJECTION_PATTERNS) {
        if (pattern.test(prompt)) {
            console.warn('[SECURITY] Code injection pattern detected:', pattern);
            return { isValid: false, error: 'Malicious code pattern detected' };
        }
    }

    // Sanitize prompt injection attempts (soft block - replace, don't reject)
    const sanitized = sanitizeAIInput(prompt);
    const wasModified = sanitized !== prompt;

    if (wasModified) {
        console.warn('[SECURITY] Prompt injection attempt sanitized');
    }

    return { isValid: true, sanitized };
};

/**
 * Validates file paths to prevent traversal attacks
 */
export const validateFilePath = (filePath: string, allowedBasePaths?: string[]): { isValid: boolean; error?: string } => {
    // Check for path traversal
    for (const pattern of PATH_TRAVERSAL_PATTERNS) {
        if (pattern.test(filePath)) {
            return { isValid: false, error: 'Path traversal detected' };
        }
    }

    // If allowed base paths specified, verify path starts with one
    if (allowedBasePaths && allowedBasePaths.length > 0) {
        const normalizedPath = filePath.replace(/\\/g, '/');
        const isAllowed = allowedBasePaths.some(base =>
            normalizedPath.startsWith(base.replace(/\\/g, '/'))
        );

        if (!isAllowed) {
            return { isValid: false, error: 'Path outside allowed directories' };
        }
    }

    return { isValid: true };
};

/**
 * Basic HTML/script sanitization
 */
export const sanitizeInput = (input: string): string => {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};
