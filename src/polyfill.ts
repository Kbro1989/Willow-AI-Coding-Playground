import { Buffer } from 'buffer';

// Synchronous side-effect: Ensure Buffer is available to all subsequent imports
if (typeof window !== 'undefined') {
    (window as any).Buffer = Buffer;
}
if (typeof globalThis !== 'undefined') {
    (globalThis as any).Buffer = Buffer;
}

console.log('✅ Global Buffer polyfill initialized');
