const WebSocket = require('ws');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Antigravity Local Bridge Agent
 * Mode 1: Local Server (ws://localhost:3040) - For direct browser connection
 * Mode 2: Cloud Relay (Connects OUTBOUND to Cloudflare App ID 1) - For cloud frontend
 * 
 * Environment Variables:
 *   PORT - Local server port (default: 3040)
 *   RELAY_URL - Cloud relay WebSocket URL (e.g., wss://antigravity-bridge-relay.workers.dev/bridge/1)
 *   APP_ID - Your unique App ID for the relay
 */

const PORT = process.env.PORT || 3040;
const RELAY_URL = process.env.RELAY_URL || null;
const APP_ID = process.env.APP_ID || "1";

// Placeholder website for testing
const PLACEHOLDER_TEST_URL = "https://jsonplaceholder.typicode.com";

console.log("=====================================================");
console.log("   ANTIGRAVITY LOCAL BRIDGE AGENT v1.0");
console.log("=====================================================");

if (RELAY_URL) {
    console.log(`[MODE] CLOUD RELAY`);
    console.log(`[RELAY] ${RELAY_URL}`);
    console.log(`[APP_ID] ${APP_ID}`);
    console.log("-----------------------------------------------------");
    connectToRelay();
} else {
    console.log(`[MODE] LOCAL SERVER`);
    console.log(`[PORT] ${PORT}`);
    console.log("-----------------------------------------------------");

    const wss = new WebSocket.Server({ port: PORT });
    console.log(`[STATUS] Listening on ws://localhost:${PORT}`);

    wss.on('connection', (ws) => {
        console.log('[CLIENT] Browser connected');
        ws.send(JSON.stringify({ type: 'system', data: 'Antigravity Local Bridge: ENABLED' }));
        setupSocket(ws);
    });
}

function connectToRelay() {
    console.log('[STATUS] Connecting to Cloud Relay...');

    // Append role=agent to URL for browser-compatible role detection
    const relayUrlWithRole = RELAY_URL.includes('?')
        ? `${RELAY_URL}&role=agent`
        : `${RELAY_URL}?role=agent`;

    const ws = new WebSocket(relayUrlWithRole, {
        headers: {
            'x-app-id': APP_ID,
            'x-bridge-role': 'agent'
        }
    });

    ws.on('open', () => {
        console.log(`[STATUS] ✓ Linked to Cloud Relay`);
        ws.send(JSON.stringify({ type: 'system', data: `Agent ID ${APP_ID} Operational` }));
    });

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, data);
        } catch (e) {
            console.error('[ERROR] Failed to parse relay message:', e.message);
        }
    });

    ws.on('error', (err) => {
        console.error('[ERROR] Relay Error:', err.message);
    });

    ws.on('close', (code, reason) => {
        console.log(`[STATUS] Relay connection closed (${code}). Reconnecting in 5s...`);
        setTimeout(connectToRelay, 5000);
    });
}

function setupSocket(ws) {
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, data);
        } catch (e) {
            console.error('[ERROR] Failed to parse message:', e.message);
        }
    });

    ws.on('close', () => {
        console.log('[CLIENT] Browser disconnected');
    });
}

function handleMessage(ws, data) {
    const { type, messageId } = data;

    const sendResponse = (success, payload = {}, error = null) => {
        ws.send(JSON.stringify({
            type: `${type}_response`,
            messageId,
            success,
            ...payload,
            error
        }));
    };

    switch (type) {
        case 'terminal_command':
            console.log(`[EXEC] ${data.command}`);
            const isWin = process.platform === "win32";
            const proc = exec(data.command, {
                cwd: data.cwd || process.cwd(),
                shell: isWin ? 'powershell.exe' : undefined,
                timeout: 30000
            });

            let output = '';
            proc.stdout.on('data', (d) => {
                output += d.toString();
                ws.send(JSON.stringify({ type: 'output', data: d.toString() }));
            });

            proc.stderr.on('data', (d) => {
                output += d.toString();
                ws.send(JSON.stringify({ type: 'output', data: d.toString() }));
            });

            proc.on('close', (code) => {
                if (messageId) sendResponse(code === 0, { output });
                ws.send(JSON.stringify({ type: 'system', data: `Process exited: ${code}` }));
            });
            break;

        case 'fs_read':
            console.log(`[READ] ${data.filePath}`);
            fs.readFile(data.filePath, data.base64 ? 'base64' : 'utf8', (err, content) => {
                if (err) sendResponse(false, {}, err.message);
                else sendResponse(true, { content });
            });
            break;

        case 'fs_write':
            console.log(`[WRITE] ${data.filePath}`);
            const dir = path.dirname(data.filePath);
            fs.mkdir(dir, { recursive: true }, (mkdirErr) => {
                if (mkdirErr) return sendResponse(false, {}, mkdirErr.message);
                fs.writeFile(data.filePath, data.content, (err) => {
                    if (err) sendResponse(false, {}, err.message);
                    else sendResponse(true);
                });
            });
            break;

        case 'fs_delete':
            console.log(`[DELETE] ${data.filePath}`);
            fs.unlink(data.filePath, (err) => {
                if (err) sendResponse(false, {}, err.message);
                else sendResponse(true);
            });
            break;

        case 'fs_list':
            console.log(`[LIST] ${data.dirPath}`);
            fs.readdir(data.dirPath, { withFileTypes: true }, (err, files) => {
                if (err) return sendResponse(false, {}, err.message);
                const fileList = files.map(f => ({
                    name: f.name,
                    isDirectory: f.isDirectory(),
                    path: path.join(data.dirPath, f.name)
                }));
                sendResponse(true, { files: fileList });
            });
            break;

        case 'fs_stat':
            console.log(`[STAT] ${data.filePath}`);
            fs.stat(data.filePath, (err, stats) => {
                if (err) return sendResponse(false, {}, err.message);
                sendResponse(true, {
                    isFile: stats.isFile(),
                    isDirectory: stats.isDirectory(),
                    size: stats.size,
                    modified: stats.mtime.getTime()
                });
            });
            break;

        case 'fs_mkdir':
            console.log(`[MKDIR] ${data.dirPath}`);
            fs.mkdir(data.dirPath, { recursive: true }, (err) => {
                if (err) sendResponse(false, {}, err.message);
                else sendResponse(true);
            });
            break;

        case 'http_fetch':
            // Placeholder test - fetch from external website
            console.log(`[HTTP] ${data.url || PLACEHOLDER_TEST_URL}`);
            const url = data.url || `${PLACEHOLDER_TEST_URL}/posts/1`;

            fetch(url, { method: data.method || 'GET' })
                .then(res => res.json())
                .then(json => {
                    sendResponse(true, { data: json });
                })
                .catch(err => {
                    sendResponse(false, {}, err.message);
                });
            break;

        case 'ping':
            sendResponse(true, { pong: Date.now() });
            break;

        default:
            console.warn('[WARN] Unknown message type:', type);
            sendResponse(false, {}, `Unknown command type: ${type}`);
    }
}
