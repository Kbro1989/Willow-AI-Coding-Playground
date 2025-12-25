import { readCloudFile, writeCloudFile, deleteCloudFile } from './cloudFsService';
import { executeRemoteCommand } from './remoteTerminalService';

class LocalBridgeClient {
  private ws: WebSocket | null = null;
  private messageHandlers: Map<string, (response: any) => void> = new Map();
  private commandCounter = 0;
  private isCloudMode: boolean = false; // New flag to indicate if we are in cloud mode

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

  getStatus(): { isConnected: boolean, isCloudMode: boolean } {
    return { isConnected: this.ws?.readyState === WebSocket.OPEN && !this.isCloudMode, isCloudMode: this.isCloudMode };
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
    if (this.isCloudMode) {
      const result = await writeCloudFile(filePath, content);
      return { success: result.success, error: result.message };
    }
    try {
      await this.sendMessage('fs_write', { filePath, content });
      return { success: true };
    } catch (e: any) {
      console.warn("[LocalBridge] Write file failed, switching to Cloud Mode.", e);
      this.isCloudMode = true;
      return this.writeLocalFile(filePath, content);
    }
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
