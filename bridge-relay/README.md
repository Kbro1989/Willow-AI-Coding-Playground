# Antigravity Bridge Relay

A Cloudflare Durable Object Worker that acts as a secure relay between local agents and cloud frontends.

## Architecture

```
[Cloud Frontend (App 2)]  <-->  [Bridge Relay Worker]  <-->  [Local Agent (App 1)]
         |                           |                            |
    Browser WS                 Cloudflare DO                 Node.js WS
```

## Quick Start

### 1. Deploy the Relay Worker

```bash
cd bridge-relay
npm install
npm run deploy
```

This deploys to: `https://antigravity-bridge-relay.<your-subdomain>.workers.dev`

### 2. Start Local Agent (Relay Mode)

```bash
# Set environment variables
$env:RELAY_URL = "wss://antigravity-bridge-relay.<your-subdomain>.workers.dev/bridge/1"
$env:APP_ID = "1"

# Start the agent
node bridge/agent.js
```

### 3. Connect Frontend

In your browser app, connect to the same relay:
```javascript
const ws = new WebSocket('wss://antigravity-bridge-relay.<your-subdomain>.workers.dev/bridge/1');
```

## Local Development (Direct Mode)

For local-only development without cloud relay:

```bash
node bridge/agent.js
# Connects at ws://localhost:3040
```

## Supported Commands

| Type | Description | Payload |
|------|-------------|---------|
| `terminal_command` | Execute shell command | `{ command: string, cwd?: string }` |
| `fs_read` | Read file | `{ filePath: string, base64?: boolean }` |
| `fs_write` | Write file | `{ filePath: string, content: string }` |
| `fs_delete` | Delete file | `{ filePath: string }` |
| `fs_list` | List directory | `{ dirPath: string }` |
| `fs_stat` | Get file stats | `{ filePath: string }` |
| `fs_mkdir` | Create directory | `{ dirPath: string }` |
| `http_fetch` | Fetch URL (placeholder) | `{ url?: string, method?: string }` |
| `ping` | Health check | - |
