import { Buffer } from 'buffer';

// Synchronous side-effect: Ensure Node.js globals are available to all subsequent imports
if (typeof window !== 'undefined') {
    (window as any).Buffer = Buffer;
    (window as any).module = { exports: {} };
    (window as any).exports = (window as any).module.exports;
}
if (typeof globalThis !== 'undefined') {
    (globalThis as any).Buffer = Buffer;
    (globalThis as any).module = (globalThis as any).module || { exports: {} };
    (globalThis as any).exports = (globalThis as any).exports || (globalThis as any).module.exports;
}

console.log('✅ Global Buffer and Module polyfills initialized');
