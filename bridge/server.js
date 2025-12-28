const WebSocket = require('ws');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3040;
const wss = new WebSocket.Server({ port: PORT });

// ============ RATE LIMITING ============
const rateLimitMap = new Map(); // IP -> { count, resetTime }
const RATE_LIMIT = 100;         // Max requests per minute
const RATE_WINDOW_MS = 60000;   // 1 minute window

function checkRateLimit(ws) {
    const ip = ws._socket?.remoteAddress || 'unknown';
    const now = Date.now();

    let record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
        // New window
        record = { count: 1, resetTime: now + RATE_WINDOW_MS };
        rateLimitMap.set(ip, record);
        return true;
    }

    record.count++;

    if (record.count > RATE_LIMIT) {
        console.warn(`[RATE_LIMIT] IP ${ip} exceeded ${RATE_LIMIT} requests/minute`);
        return false;
    }

    return true;
}

// Cleanup old rate limit entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
        if (now > record.resetTime) {
            rateLimitMap.delete(ip);
        }
    }
}, 300000);

// ============ AUDIT LOGGING ============
function logAudit(event, data) {
    const timestamp = new Date().toISOString();
    console.log(`[AUDIT ${timestamp}] ${event}:`, JSON.stringify(data));
}

// ============ PATH VALIDATION ============
const BLOCKED_PATHS = [
    /\/etc\//i,
    /\/var\//i,
    /C:\\Windows/i,
    /C:\\Program Files/i,
    /\.\.\//, // Path traversal
    /\.\.\\/, // Windows path traversal
];

function validatePath(filePath) {
    for (const pattern of BLOCKED_PATHS) {
        if (pattern.test(filePath)) {
            return false;
        }
    }
    return true;
}

// ============ MAIN SERVER ============
console.log(`[Antigravity Bridge] Listening on port ${PORT}`);
console.log(`[Antigravity Bridge] Rate Limit: ${RATE_LIMIT} requests/minute`);
console.log(`[Antigravity Bridge] Waiting for Neural Link...`);

let activeSocket = null;

wss.on('connection', (ws) => {
    const ip = ws._socket?.remoteAddress || 'unknown';
    console.log(`[Antigravity Bridge] Client connected from ${ip}`);
    logAudit('CONNECTION', { ip });
    activeSocket = ws;

    ws.send(JSON.stringify({ type: 'system', data: 'Antigravity Local Bridge: ENABLED' }));

    ws.on('message', (message) => {
        // Rate limit check
        if (!checkRateLimit(ws)) {
            ws.send(JSON.stringify({
                type: 'error',
                error: 'Rate limit exceeded. Please slow down.',
                retryAfterMs: RATE_WINDOW_MS
            }));
            return;
        }

        try {
            const data = JSON.parse(message);
            handleMessage(ws, data);
        } catch (e) {
            console.error('Failed to parse message:', e);
        }
    });

    ws.on('close', () => {
        console.log('[Antigravity Bridge] Client disconnected');
        logAudit('DISCONNECTION', { ip });
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
            logAudit('TERMINAL_COMMAND', { command: data.command, cwd: data.cwd });

            const isWin = process.platform === "win32";
            const shell = isWin ? 'powershell.exe' : undefined;

            const proc = exec(data.command, {
                cwd: data.cwd || process.cwd(),
                shell: shell,
                timeout: 60000 // 1 minute timeout
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
            if (!validatePath(data.filePath)) {
                logAudit('BLOCKED_PATH', { operation: 'read', path: data.filePath });
                sendResponse(false, {}, 'Access to this path is not allowed');
                return;
            }
            console.log(`[READ] ${data.filePath}${data.base64 ? ' (base64)' : ''}`);
            logAudit('FILE_READ', { path: data.filePath });

            const encoding = data.base64 ? 'base64' : 'utf8';
            fs.readFile(data.filePath, encoding, (err, content) => {
                if (err) sendResponse(false, {}, err.message);
                else sendResponse(true, { content });
            });
            break;

        case 'fs_write':
            if (!validatePath(data.filePath)) {
                logAudit('BLOCKED_PATH', { operation: 'write', path: data.filePath });
                sendResponse(false, {}, 'Access to this path is not allowed');
                return;
            }
            console.log(`[WRITE] ${data.filePath}`);
            logAudit('FILE_WRITE', { path: data.filePath, size: data.content?.length });

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
            if (!validatePath(data.filePath)) {
                logAudit('BLOCKED_PATH', { operation: 'delete', path: data.filePath });
                sendResponse(false, {}, 'Access to this path is not allowed');
                return;
            }
            console.log(`[DELETE] ${data.filePath}`);
            logAudit('FILE_DELETE', { path: data.filePath });

            fs.unlink(data.filePath, (err) => {
                if (err) sendResponse(false, {}, err.message);
                else sendResponse(true);
            });
            break;

        case 'fs_list':
            if (!validatePath(data.dirPath)) {
                logAudit('BLOCKED_PATH', { operation: 'list', path: data.dirPath });
                sendResponse(false, {}, 'Access to this path is not allowed');
                return;
            }
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
            if (!validatePath(data.filePath)) {
                sendResponse(false, {}, 'Access to this path is not allowed');
                return;
            }
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
            if (!validatePath(data.dirPath)) {
                logAudit('BLOCKED_PATH', { operation: 'mkdir', path: data.dirPath });
                sendResponse(false, {}, 'Access to this path is not allowed');
                return;
            }
            console.log(`[MKDIR] ${data.dirPath}`);
            logAudit('DIR_CREATE', { path: data.dirPath });

            fs.mkdir(data.dirPath, { recursive: true }, (err) => {
                if (err) sendResponse(false, {}, err.message);
                else sendResponse(true);
            });
            break;

        case 'fs_rename':
            if (!validatePath(data.oldPath) || !validatePath(data.newPath)) {
                logAudit('BLOCKED_PATH', { operation: 'rename', oldPath: data.oldPath, newPath: data.newPath });
                sendResponse(false, {}, 'Access to this path is not allowed');
                return;
            }
            console.log(`[RENAME] ${data.oldPath} -> ${data.newPath}`);
            logAudit('FILE_RENAME', { oldPath: data.oldPath, newPath: data.newPath });

            fs.rename(data.oldPath, data.newPath, (err) => {
                if (err) sendResponse(false, {}, err.message);
                else sendResponse(true);
            });
            break;

        default:
            console.warn('Unknown message type:', type);
    }
}
