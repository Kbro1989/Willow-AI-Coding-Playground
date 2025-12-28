/**
 * rsmvLoader.ts — Lazy loader for RSMV 3D service
 * Reduces initial bundle size by loading RSMV only when needed.
 */

let rsmvServiceInstance: any = null;
let loadingPromise: Promise<any> | null = null;

/**
 * Lazy load the RSMV service (only when 3D viewport is opened)
 */
export const loadRSMV = async (): Promise<any> => {
    // Return cached instance
    if (rsmvServiceInstance) {
        return rsmvServiceInstance;
    }

    // Return existing loading promise if already loading
    if (loadingPromise) {
        return loadingPromise;
    }

    console.log('[RSMVLoader] Starting lazy load of RSMV service...');
    const startTime = Date.now();

    loadingPromise = (async () => {
        try {
            // Dynamic import - this chunk won't load until called
            const module = await import('../rsmvService');
            rsmvServiceInstance = module.RSMVEngine.getInstance();

            console.log(`[RSMVLoader] RSMV service loaded in ${Date.now() - startTime}ms`);
            return rsmvServiceInstance;
        } catch (error) {
            console.error('[RSMVLoader] Failed to load RSMV service:', error);
            loadingPromise = null;
            throw error;
        }
    })();

    return loadingPromise;
};

/**
 * Check if RSMV is already loaded
 */
export const isRSMVLoaded = (): boolean => {
    return rsmvServiceInstance !== null;
};

/**
 * Preload RSMV in background (call when user hovers over 3D tab)
 */
export const preloadRSMV = (): void => {
    if (!rsmvServiceInstance && !loadingPromise) {
        loadRSMV().catch(() => { }); // Silent preload
    }
};

/**
 * Unload RSMV to free memory (if supported)
 */
export const unloadRSMV = (): void => {
    rsmvServiceInstance = null;
    loadingPromise = null;
    console.log('[RSMVLoader] RSMV service unloaded');
};

export default {
    loadRSMV,
    isRSMVLoaded,
    preloadRSMV,
    unloadRSMV
};
