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
            // Ensure directory exists
            const dir = path.dirname(data.filePath);
            fs.mkdir(dir, { recursive: true }, (mkdirErr) => {
                if (mkdirErr) {
                    sendResponse(false, {}, mkdirErr.message);
                    return;
                }
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
                if (err) {
                    sendResponse(false, {}, err.message);
                    return;
                }
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
                if (err) {
                    sendResponse(false, {}, err.message);
                    return;
                }
                sendResponse(true, {
                    isFile: stats.isFile(),
                    isDirectory: stats.isDirectory(),
                    size: stats.size,
                    modified: stats.mtime.getTime(),
                    created: stats.birthtime.getTime()
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

        case 'fs_rename':
            console.log(`[RENAME] ${data.oldPath} -> ${data.newPath}`);
            fs.rename(data.oldPath, data.newPath, (err) => {
                if (err) sendResponse(false, {}, err.message);
                else sendResponse(true);
            });
            break;

        default:
            console.warn('Unknown message type:', type);
    }
}
