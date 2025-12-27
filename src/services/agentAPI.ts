/**
 * AI Agent API
 * Exposes terminal and file system operations to AI agents via window.agentAPI
 */

import { localBridgeClient } from './localBridgeService';
import { SyncMode } from '../types';

export interface AgentAPI {
    // Terminal operations
    terminal: {
        run: (command: string) => Promise<{ success: boolean; output?: string; error?: string }>;
        cd: (path: string) => Promise<{ success: boolean }>;
        git: (args: string) => Promise<{ success: boolean; output?: string }>;
        gemini: (args: string) => Promise<{ success: boolean; output?: string }>;
    };

    // File system operations
    fs: {
        read: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>;
        write: (path: string, content: string) => Promise<{ success: boolean; error?: string }>;
        readBase64: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>;
        delete: (path: string) => Promise<{ success: boolean; error?: string }>;
        list: (dirPath: string) => Promise<{ success: boolean; files?: Array<{ name: string, isDirectory: boolean, path: string }>; error?: string }>;
        mkdir: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
        rename: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;
        stat: (path: string) => Promise<{ success: boolean; stats?: any; error?: string }>;
    };

    // Bridge status
    bridge: {
        getStatus: () => { isConnected: boolean; isCloudMode: boolean; syncMode: SyncMode };
        setBridgeUrl: (url: string) => void;
        setSyncMode: (mode: SyncMode) => void;
    };
}

export function initializeAgentAPI(): AgentAPI {
    const api: AgentAPI = {
        terminal: {
            run: async (command: string) => {
                const result = await localBridgeClient.runTerminalCommand(command);
                return result;
            },

            cd: async (path: string) => {
                const result = await localBridgeClient.runTerminalCommand(`cd "${path}"`);
                return { success: result.success };
            },

            git: async (args: string) => {
                const result = await localBridgeClient.runTerminalCommand(`git ${args}`);
                return result;
            },

            gemini: async (args: string) => {
                const result = await localBridgeClient.runTerminalCommand(`gemini ${args}`);
                return result;
            }
        },

        fs: {
            read: async (path: string) => {
                return await localBridgeClient.readLocalFile(path);
            },

            write: async (path: string, content: string) => {
                return await localBridgeClient.writeLocalFile(path, content);
            },

            readBase64: async (path: string) => {
                return await localBridgeClient.readLocalFile(path, true); // Pass true for base64
            },

            delete: async (path: string) => {
                return await localBridgeClient.deleteLocalFile(path);
            },

            list: async (dirPath: string) => {
                return await localBridgeClient.listDirectory(dirPath);
            },

            mkdir: async (dirPath: string) => {
                return await localBridgeClient.makeDirectory(dirPath);
            },

            rename: async (oldPath: string, newPath: string) => {
                return await localBridgeClient.renameFile(oldPath, newPath);
            },

            stat: async (path: string) => {
                return await localBridgeClient.statFile(path);
            }
        },

        bridge: {
            getStatus: () => localBridgeClient.getStatus(),
            setBridgeUrl: (url: string) => localBridgeClient.setBridgeUrl(url),
            setSyncMode: (mode: SyncMode) => localBridgeClient.setSyncMode(mode)
        }
    };

    // Expose to window for AI agents
    (window as any).agentAPI = api;

    console.log('[AgentAPI] Initialized and exposed as window.agentAPI');
    console.log('[AgentAPI] Available commands:');
    console.log('  - window.agentAPI.terminal.run("ls")');
    console.log('  - window.agentAPI.terminal.cd("../folder")');
    console.log('  - window.agentAPI.terminal.git("status")');
    console.log('  - window.agentAPI.terminal.gemini("-y")');
    console.log('  - window.agentAPI.fs.read("path/to/file.ts")');
    console.log('  - window.agentAPI.fs.write("path/to/file.ts", content)');
    console.log('  - window.agentAPI.fs.list("./src")');
    console.log('  - window.agentAPI.bridge.getStatus()');
    console.log('  - window.agentAPI.bridge.setSyncMode("dual")');

    return api;
}
