const WebSocket = require('ws');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3040;
const wss = new WebSocket.Server({ port: PORT });

console.log(`[Antigravity Bridge] Listening on port ${PORT}`);
console.log(`[Antigravity Bridge] Waiting for Neural Link...`);

let activeSocket = null;

wss.on('connection', (ws) => {
    console.log('[Antigravity Bridge] Client connected');
    activeSocket = ws;

    ws.send(JSON.stringify({ type: 'system', data: 'Antigravity Local Bridge: ENABLED' }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, data);
        } catch (e) {
            console.error('Failed to parse message:', e);
        }
    });

    ws.on('close', () => {
        console.log('[Antigravity Bridge] Client disconnected');
        activeSocket = null;
    });
});

function handleMessage(ws, data) {
    const { type, messageId } = data;

    // Helper to send response matching messageId
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
            const shell = isWin ? 'powershell.exe' : undefined;

            const proc = exec(data.command, {
                cwd: data.cwd || process.cwd(),
                shell: shell
            });

            proc.stdout.on('data', (d) => {
                ws.send(JSON.stringify({ type: 'output', data: d.toString() }));
            });

            proc.stderr.on('data', (d) => {
                ws.send(JSON.stringify({ type: 'output', data: d.toString() }));
            });

            proc.on('close', (code) => {
                if (messageId) {
                    sendResponse(code === 0);
                }
                ws.send(JSON.stringify({ type: 'system', data: `Process exited with code ${code}` }));
            });
            break;

        case 'fs_read':
            console.log(`[READ] ${data.filePath}`);
            fs.readFile(data.filePath, 'utf8', (err, content) => {
                if (err) sendResponse(false, {}, err.message);
                else sendResponse(true, { content });
            });
            break;

        case 'fs_write':
            console.log(`[WRITE] ${data.filePath}`);
            fs.writeFile(data.filePath, data.content, (err) => {
                if (err) sendResponse(false, {}, err.message);
                else sendResponse(true);
            });
            break;

        case 'fs_delete':
            console.log(`[DELETE] ${data.filePath}`);
            fs.unlink(data.filePath, (err) => {
                if (err) sendResponse(false, {}, err.message);
                else sendResponse(true);
            });
            break;

        default:
            console.warn('Unknown message type:', type);
    }
}
