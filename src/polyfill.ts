import { Buffer } from 'buffer';

// Synchronous side-effect: Ensure Node.js globals are available to all subsequent imports
if (typeof window !== 'undefined') {
    (window as any).Buffer = Buffer;
    (window as any).module = (window as any).module || {
        exports: {},
        config: () => ({}) // Satisfy Monaco/AMD loaders
    };
    (window as any).exports = (window as any).module.exports;
    (window as any).require = (window as any).require || ((id: string) => {
        console.warn(`[RE-SHIM] Legacy require('${id}') trapped. Returning empty module.`, id);
        return (window as any).module.exports;
    });
    // Add config stub for Monaco/AMD loaders
    if (!(window as any).require.config) {
        (window as any).require.config = () => {
            console.log('[RE-SHIM] require.config() invoked and satisfied.');
            return (window as any).require;
        };
    }
}
if (typeof globalThis !== 'undefined') {
    (globalThis as any).Buffer = Buffer;
    (globalThis as any).module = (globalThis as any).module || {
        exports: {},
        config: () => ({})
    };
    (globalThis as any).exports = (globalThis as any).exports || (globalThis as any).module.exports;
    (globalThis as any).require = (globalThis as any).require || ((window as any).require);
}

console.log('✅ Global Buffer, Module, and Require polyfills initialized');
