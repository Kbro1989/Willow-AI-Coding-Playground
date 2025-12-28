/// <reference path="./worker-configuration.d.ts" />

/**
 * Antigravity Bridge Relay Worker (App ID 1)
 * 
 * Bidirectional Message Flow:
 * 1. Agent connects with ?role=agent in URL
 * 2. Clients connect with ?role=client (default)
 * 3. Messages from clients → forwarded to agent
 * 4. Messages from agent → forwarded to all clients
 */

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        // CORS headers for cross-origin requests
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Google Search API endpoint
        if (url.pathname === '/api/google-search') {
            const query = url.searchParams.get('q');
            const cseId = url.searchParams.get('cx') || env.GOOGLE_CSE_ID || '';

            if (!query) {
                return new Response(JSON.stringify({ error: 'Missing query parameter "q"' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            if (!env.GOOGLE_API_KEY) {
                return new Response(JSON.stringify({ error: 'GOOGLE_API_KEY not configured' }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            try {
                const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${env.GOOGLE_API_KEY}&cx=${cseId}&q=${encodeURIComponent(query)}`;
                const response = await fetch(searchUrl);
                const data = await response.json();

                return new Response(JSON.stringify(data), {
                    status: response.status,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            } catch (error) {
                return new Response(JSON.stringify({ error: String(error) }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // WebSocket Bridge Relay (existing logic)
        // Supports: /bridge/:appId?role=agent|client
        const appId = url.pathname.split('/')[2] || '1';

        const id = env.BRIDGE_SESSIONS.idFromName(appId);
        const obj = env.BRIDGE_SESSIONS.get(id);

        return obj.fetch(request);
    }
};

export class BridgeSession {
    state: DurableObjectState;
    agentSocket: WebSocket | null = null;
    clientSockets: Set<WebSocket> = new Set();
    socketRoles: Map<WebSocket, 'agent' | 'client'> = new Map();

    constructor(state: DurableObjectState, env: Env) {
        this.state = state;
    }

    async fetch(request: Request) {
        const url = new URL(request.url);
        // Role from URL query param (browser compatible) or header (Node.js agent)
        const role = url.searchParams.get('role') ||
            request.headers.get('x-bridge-role') ||
            'client';

        if (request.headers.get('Upgrade') !== 'websocket') {
            return new Response(JSON.stringify({
                status: 'ok',
                message: 'Antigravity Bridge Relay',
                usage: 'Connect via WebSocket with ?role=agent or ?role=client',
                agentOnline: this.agentSocket !== null,
                clientCount: this.clientSockets.size
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const pair = new WebSocketPair();
        const [client, server] = [pair[0], pair[1]];

        this.state.acceptWebSocket(server);
        this.socketRoles.set(server, role as 'agent' | 'client');

        if (role === 'agent') {
            // Close existing agent if any
            if (this.agentSocket) {
                this.agentSocket.close(1001, 'New agent connected');
                this.socketRoles.delete(this.agentSocket);
            }
            this.agentSocket = server;
            console.log('[Relay] Agent connected');

            // Notify all clients
            this.clientSockets.forEach(s => {
                s.send(JSON.stringify({ type: 'system', data: 'AGENT_ONLINE' }));
            });
        } else {
            this.clientSockets.add(server);
            console.log('[Relay] Client connected');

            // Notify client of agent status
            if (this.agentSocket) {
                server.send(JSON.stringify({ type: 'system', data: 'AGENT_ONLINE' }));
            } else {
                server.send(JSON.stringify({ type: 'system', data: 'AGENT_OFFLINE' }));
            }
        }

        return new Response(null, {
            status: 101,
            webSocket: client
        } as ResponseInit);
    }

    webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
        const data = typeof message === 'string' ? message : new TextDecoder().decode(message);
        const role = this.socketRoles.get(ws);

        if (role === 'agent') {
            // Agent → All Clients
            console.log(`[Relay] Agent → ${this.clientSockets.size} clients`);
            this.clientSockets.forEach(s => s.send(data));
        } else {
            // Client → Agent
            if (this.agentSocket) {
                console.log('[Relay] Client → Agent');
                this.agentSocket.send(data);
            } else {
                // No agent, send error back to client
                ws.send(JSON.stringify({
                    type: 'error',
                    error: 'AGENT_OFFLINE',
                    message: 'No agent connected to handle this request'
                }));
            }
        }
    }

    webSocketClose(ws: WebSocket) {
        const role = this.socketRoles.get(ws);
        this.socketRoles.delete(ws);

        if (role === 'agent') {
            this.agentSocket = null;
            console.log('[Relay] Agent disconnected');
            // Notify all clients
            this.clientSockets.forEach(s => {
                s.send(JSON.stringify({ type: 'system', data: 'AGENT_OFFLINE' }));
            });
        } else {
            this.clientSockets.delete(ws);
            console.log('[Relay] Client disconnected');
        }
    }

    webSocketError(ws: WebSocket, error: unknown) {
        console.error('[Relay] WebSocket error:', error);
    }
}
