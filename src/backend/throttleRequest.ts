/**
 * throttleRequest.ts - API throttling and rate limiting
 */

const requestLog: Map<string, number[]> = new Map();
const WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS = 30; // 30 requests per minute

/**
 * Throttles requests to external AI APIs
 */
export const throttle = (key: string): boolean => {
    const now = Date.now();
    const timestamps = requestLog.get(key) || [];

    // Filter out old timestamps
    const recentRequests = timestamps.filter(ts => now - ts < WINDOW_MS);

    if (recentRequests.length >= MAX_REQUESTS) {
        console.warn(`[THROTTLE] Rate limit exceeded for ${key}`);
        return false;
    }

    recentRequests.push(now);
    requestLog.set(key, recentRequests);
    return true;
};

/**
 * Wait promise for manual delays
 */
export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
