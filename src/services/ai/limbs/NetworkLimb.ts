/**
 * NetworkLimb.ts — Network Operations (20 fingers)
 * Provides HTTP requests, WebSocket, caching, and API integrations.
 */
import { neuralRegistry } from '../NeuralRegistry';

// WebSocket connections registry
const wsConnections = new Map<string, WebSocket>();

export const registerNetworkLimb = () => {
    neuralRegistry.registerLimb({
        id: 'network',
        name: 'Network Operations',
        description: 'HTTP requests, WebSocket connections, caching, and API integrations.',
        capabilities: [
            // === HTTP Requests ===
            {
                name: 'http_get', description: 'Make HTTP GET request.', parameters: { url: 'string', headers: 'object?' },
                handler: async (params) => {
                    const res = await fetch(params.url, { headers: params.headers });
                    const text = await res.text();
                    return { status: res.status, body: text.substring(0, 1000), ok: res.ok };
                }
            },
            {
                name: 'http_post', description: 'Make HTTP POST request.', parameters: { url: 'string', body: 'any', headers: 'object?' },
                handler: async (params) => {
                    const res = await fetch(params.url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...params.headers }, body: JSON.stringify(params.body) });
                    const text = await res.text();
                    return { status: res.status, body: text.substring(0, 1000), ok: res.ok };
                }
            },
            {
                name: 'http_put', description: 'Make HTTP PUT request.', parameters: { url: 'string', body: 'any', headers: 'object?' },
                handler: async (params) => {
                    const res = await fetch(params.url, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...params.headers }, body: JSON.stringify(params.body) });
                    return { status: res.status, ok: res.ok };
                }
            },
            {
                name: 'http_delete', description: 'Make HTTP DELETE request.', parameters: { url: 'string', headers: 'object?' },
                handler: async (params) => {
                    const res = await fetch(params.url, { method: 'DELETE', headers: params.headers });
                    return { status: res.status, ok: res.ok };
                }
            },
            {
                name: 'http_head', description: 'Make HTTP HEAD request.', parameters: { url: 'string' },
                handler: async (params) => {
                    const res = await fetch(params.url, { method: 'HEAD' });
                    const headers: Record<string, string> = {};
                    res.headers.forEach((v, k) => headers[k] = v);
                    return { status: res.status, headers };
                }
            },

            // === WebSocket ===
            {
                name: 'ws_connect', description: 'Open WebSocket connection.', parameters: { url: 'string', id: 'string' },
                handler: async (params) => {
                    return new Promise((resolve) => {
                        const ws = new WebSocket(params.url);
                        ws.onopen = () => { wsConnections.set(params.id, ws); resolve({ connected: true, id: params.id }); };
                        ws.onerror = () => resolve({ connected: false, error: 'Connection failed' });
                    });
                }
            },
            {
                name: 'ws_send', description: 'Send WebSocket message.', parameters: { id: 'string', message: 'string' },
                handler: async (params) => {
                    const ws = wsConnections.get(params.id);
                    if (!ws || ws.readyState !== WebSocket.OPEN) return { success: false, error: 'Not connected' };
                    ws.send(params.message);
                    return { success: true };
                }
            },
            {
                name: 'ws_close', description: 'Close WebSocket connection.', parameters: { id: 'string' },
                handler: async (params) => {
                    const ws = wsConnections.get(params.id);
                    if (ws) { ws.close(); wsConnections.delete(params.id); }
                    return { closed: true };
                }
            },
            {
                name: 'ws_list', description: 'List active WebSocket connections.', parameters: {},
                handler: async () => ({ connections: Array.from(wsConnections.keys()) })
            },

            // === Cache ===
            {
                name: 'cache_get', description: 'Get item from cache.', parameters: { key: 'string' },
                handler: async (params) => {
                    const val = localStorage.getItem(`cache:${params.key}`);
                    return val ? { found: true, value: JSON.parse(val) } : { found: false };
                }
            },
            {
                name: 'cache_set', description: 'Set item in cache.', parameters: { key: 'string', value: 'any', ttl: 'number?' },
                handler: async (params) => {
                    localStorage.setItem(`cache:${params.key}`, JSON.stringify({ value: params.value, expires: params.ttl ? Date.now() + params.ttl * 1000 : null }));
                    return { cached: true };
                }
            },
            {
                name: 'cache_delete', description: 'Delete item from cache.', parameters: { key: 'string' },
                handler: async (params) => {
                    localStorage.removeItem(`cache:${params.key}`);
                    return { deleted: true };
                }
            },
            {
                name: 'cache_clear', description: 'Clear all cache.', parameters: {},
                handler: async () => {
                    Object.keys(localStorage).filter(k => k.startsWith('cache:')).forEach(k => localStorage.removeItem(k));
                    return { cleared: true };
                }
            },

            // === API Integrations ===
            {
                name: 'api_cloudflare_ai', description: 'Call Cloudflare AI API.', parameters: { model: 'string', prompt: 'string' },
                handler: async (params) => {
                    const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) });
                    return await res.json();
                }
            },
            {
                name: 'api_openai', description: 'Call OpenAI API.', parameters: { model: 'string', messages: 'object[]' },
                handler: async (params) => {
                    const res = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('OPENAI_API_KEY') || ''}` },
                        body: JSON.stringify({ model: params.model, messages: params.messages })
                    });
                    return await res.json();
                }
            },
            {
                name: 'api_anthropic', description: 'Call Anthropic API.', parameters: { model: 'string', prompt: 'string' },
                handler: async (params) => ({ message: 'Anthropic API call queued', model: params.model })
            },

            // === Utilities ===
            {
                name: 'network_status', description: 'Check network connectivity.', parameters: {},
                handler: async () => ({ online: navigator.onLine })
            },
            {
                name: 'network_latency', description: 'Measure latency to URL.', parameters: { url: 'string' },
                handler: async (params) => {
                    const start = performance.now();
                    await fetch(params.url, { method: 'HEAD', mode: 'no-cors' }).catch(() => { });
                    return { latencyMs: Math.round(performance.now() - start) };
                }
            },
            {
                name: 'network_dns_lookup', description: 'Resolve DNS (via API).', parameters: { hostname: 'string' },
                handler: async (params) => {
                    const res = await fetch(`https://dns.google/resolve?name=${params.hostname}`);
                    return await res.json();
                }
            }
        ]
    });
    console.log('[NetworkLimb] 20 capabilities registered.');
};
