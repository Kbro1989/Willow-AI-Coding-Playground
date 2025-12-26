import { readCloudFile, writeCloudFile, deleteCloudFile } from './cloudFsService';
import { executeRemoteCommand } from './remoteTerminalService';
import { SyncMode } from '../types';

class LocalBridgeClient {
  private ws: WebSocket | null = null;
  private messageHandlers: Map<string, (response: any) => void> = new Map();
  private commandCounter = 0;
  private isCloudMode: boolean = false;
  private syncMode: SyncMode = SyncMode.LOCAL;

  constructor() {
    this.connect();
  }

  public setBridgeUrl(url: string) {
    localStorage.setItem('antigravity_bridge_url', url);
    if (this.ws) {
      this.ws.close();
    }
    this.connect();
  }

  public setSyncMode(mode: SyncMode) {
    this.syncMode = mode;
    console.log(`[LocalBridge] Sync Mode set to: ${mode}`);
  }

  private connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const bridgeUrl = localStorage.getItem('antigravity_bridge_url') || "ws://localhost:3040";

    try {
      this.ws = new WebSocket(bridgeUrl); // Connect to dynamic bridge URL
    } catch (e) {
      console.error("[LocalBridge] Invalid URL provided, reverting to Cloud Mode.", e);
      this.isCloudMode = true;
      return;
    }

    this.ws.onopen = () => {
      console.log(`[LocalBridge] Connected to ${bridgeUrl}`);
      this.isCloudMode = false;
    };

    this.ws.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data as string);
        if (response.type && this.messageHandlers.has(response.type)) {
          this.messageHandlers.get(response.type)?.(response);
        } else if (response.type === 'output' || response.type === 'system') {
          console.log(`[Terminal] ${response.data}`);
        }
      } catch (e) {
        console.error("[LocalBridge] Error parsing message:", e, event.data);
      }
    };

    this.ws.onclose = () => {
      console.log("[LocalBridge] Disconnected. Reconnecting in 5s or staying in Cloud Mode.");
      this.isCloudMode = true;
      setTimeout(() => this.connect(), 5000);
    };

    this.ws.onerror = (error) => {
      console.error("[LocalBridge] WebSocket Error:", error);
      this.isCloudMode = true;
    };
  }

  getStatus(): { isConnected: boolean, isCloudMode: boolean, syncMode: SyncMode } {
    return {
      isConnected: this.ws?.readyState === WebSocket.OPEN && !this.isCloudMode,
      isCloudMode: this.isCloudMode,
      syncMode: this.syncMode
    };
  }

  private sendMessage(type: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState !== WebSocket.OPEN) {
        return reject(new Error("WebSocket is not open."));
      }

      const messageId = `cmd-${this.commandCounter++}`;
      const handler = (response: any) => {
        if (response.messageId === messageId) {
          this.messageHandlers.delete(response.type); // One-time handler
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || "Unknown error during local bridge operation."));
          }
        }
      };

      this.messageHandlers.set(`${type}_response`, handler);

      this.ws.send(JSON.stringify({ type, messageId, ...payload }));
    });
  }

  async runTerminalCommand(command: string): Promise<{ success: boolean, output?: string, error?: string }> {
    if (this.isCloudMode) {
      const result = await executeRemoteCommand(command);
      return { success: result !== null, output: result?.output };
    }
    try {
      // For terminal commands, we don't expect a direct response, but rather output via the 'output' type messages.
      // We will send the command and rely on the broadcastToTerminals in server.js to send output.
      if (this.ws?.readyState !== WebSocket.OPEN) {
        throw new Error("WebSocket is not open. Cannot run terminal command.");
      }
      this.ws.send(JSON.stringify({ type: 'terminal_command', command }));
      return { success: true };
    } catch (e: any) {
      console.warn("[LocalBridge] Terminal command failed, switching to Cloud Mode.", e);
      this.isCloudMode = true;
      return this.runTerminalCommand(command);
    }
  }

  async readLocalFile(filePath: string): Promise<{ success: boolean, content?: string, error?: string }> {
    if (this.isCloudMode) {
      const content = await readCloudFile(filePath);
      return { success: content !== null, content: content || undefined };
    }
    try {
      const response = await this.sendMessage('fs_read', { filePath });
      return { success: true, content: response.content };
    } catch (e: any) {
      console.warn("[LocalBridge] Read file failed, switching to Cloud Mode.", e);
      this.isCloudMode = true;
      return this.readLocalFile(filePath);
    }
  }

  async writeLocalFile(filePath: string, content: string): Promise<{ success: boolean, error?: string }> {
    if (this.syncMode === SyncMode.OFFLINE) {
      console.log(`[LocalBridge] OFFLINE Mode: Suppression write to ${filePath}`);
      return { success: true };
    }

    // 1. Determine targets based on syncMode
    const writeToCloud = this.isCloudMode || this.syncMode === SyncMode.CLOUD || this.syncMode === SyncMode.DUAL;
    const writeToLocal = !this.isCloudMode && (this.syncMode === SyncMode.LOCAL || this.syncMode === SyncMode.DUAL);

    let cloudResult = { success: true };
    let localResult = { success: true };

    if (writeToCloud) {
      const result = await writeCloudFile(filePath, content);
      cloudResult = { success: result.success };
      if (!result.success) console.error(`[LocalBridge] Cloud Write Failed: ${result.message}`);
    }

    if (writeToLocal) {
      try {
        await this.sendMessage('fs_write', { filePath, content });
      } catch (e: any) {
        console.warn("[LocalBridge] Local write failed during sync.", e);
        localResult = { success: false };
      }
    }

    return { success: cloudResult.success && localResult.success };
  }

  async deleteLocalFile(filePath: string): Promise<{ success: boolean, error?: string }> {
    if (this.isCloudMode) {
      const result = await deleteCloudFile(filePath);
      return { success: result.success, error: result.message };
    }
    try {
      await this.sendMessage('fs_delete', { filePath });
      return { success: true };
    } catch (e: any) {
      console.warn("[LocalBridge] Delete file failed, switching to Cloud Mode.", e);
      this.isCloudMode = true;
      return this.deleteLocalFile(filePath);
    }
  }

  async listDirectory(dirPath: string): Promise<{ success: boolean, files?: Array<{ name: string, isDirectory: boolean, path: string }>, error?: string }> {
    if (this.isCloudMode) {
      // For cloud mode, return empty list or implement cloud directory listing
      return { success: true, files: [] };
    }
    try {
      const response = await this.sendMessage('fs_list', { dirPath });
      return { success: true, files: response.files };
    } catch (e: any) {
      console.warn("[LocalBridge] List directory failed, switching to Cloud Mode.", e);
      this.isCloudMode = true;
      return this.listDirectory(dirPath);
    }
  }

  async statFile(filePath: string): Promise<{ success: boolean, stats?: { isFile: boolean, isDirectory: boolean, size: number, modified: number, created: number }, error?: string }> {
    if (this.isCloudMode) {
      return { success: false, error: 'Cloud mode does not support stat' };
    }
    try {
      const response = await this.sendMessage('fs_stat', { filePath });
      return { success: true, stats: response };
    } catch (e: any) {
      console.warn("[LocalBridge] Stat file failed.", e);
      return { success: false, error: e.message };
    }
  }

  async makeDirectory(dirPath: string): Promise<{ success: boolean, error?: string }> {
    if (this.isCloudMode) {
      return { success: false, error: 'Cloud mode does not support mkdir' };
    }
    try {
      await this.sendMessage('fs_mkdir', { dirPath });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async renameFile(oldPath: string, newPath: string): Promise<{ success: boolean, error?: string }> {
    if (this.isCloudMode) {
      return { success: false, error: 'Cloud mode does not support rename' };
    }
    try {
      await this.sendMessage('fs_rename', { oldPath, newPath });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const localBridgeClient = new LocalBridgeClient();

export const setBridgeUrl = (url: string) => {
  localBridgeClient.setBridgeUrl(url);
};
