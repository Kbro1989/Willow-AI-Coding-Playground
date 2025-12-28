/**
 * FileLimb.ts — File System Operations (25 fingers)
 * Provides file read/write, directory operations, compression, and cloud storage.
 */
import { neuralRegistry } from '../NeuralRegistry';
import { localBridgeClient } from '../../localBridgeService';

export const registerFileLimb = () => {
    neuralRegistry.registerLimb({
        id: 'file',
        name: 'File Operations',
        description: 'Complete file system control via local bridge and cloud storage.',
        capabilities: [
            // === Read Operations ===
            {
                name: 'file_read',
                description: 'Read file contents as text.',
                parameters: { path: 'string' },
                handler: async (params) => {
                    return await localBridgeClient.readLocalFile(params.path);
                }
            },
            {
                name: 'file_read_binary',
                description: 'Read file as base64 encoded binary.',
                parameters: { path: 'string' },
                handler: async (params) => {
                    return await localBridgeClient.readLocalFile(params.path, true);
                }
            },
            {
                name: 'file_read_json',
                description: 'Read and parse a JSON file.',
                parameters: { path: 'string' },
                handler: async (params) => {
                    const result = await localBridgeClient.readLocalFile(params.path);
                    if (!result.success || !result.content) return result;
                    try {
                        return { success: true, data: JSON.parse(result.content) };
                    } catch {
                        return { success: false, error: 'Invalid JSON' };
                    }
                }
            },
            {
                name: 'file_exists',
                description: 'Check if a file exists.',
                parameters: { path: 'string' },
                handler: async (params) => {
                    const result = await localBridgeClient.statFile(params.path);
                    return { exists: result.success };
                }
            },
            {
                name: 'file_stat',
                description: 'Get file metadata (size, modified date).',
                parameters: { path: 'string' },
                handler: async (params) => {
                    return await localBridgeClient.statFile(params.path);
                }
            },

            // === Write Operations ===
            {
                name: 'file_write',
                description: 'Write text content to a file.',
                parameters: { path: 'string', content: 'string' },
                handler: async (params) => {
                    return await localBridgeClient.writeLocalFile(params.path, params.content);
                }
            },
            {
                name: 'file_write_json',
                description: 'Write an object as formatted JSON.',
                parameters: { path: 'string', data: 'object' },
                handler: async (params) => {
                    const content = JSON.stringify(params.data, null, 2);
                    return await localBridgeClient.writeLocalFile(params.path, content);
                }
            },
            {
                name: 'file_append',
                description: 'Append text to a file.',
                parameters: { path: 'string', content: 'string' },
                handler: async (params) => {
                    // Read existing, append, write back
                    const existing = await localBridgeClient.readLocalFile(params.path);
                    const newContent = (existing.content || '') + params.content;
                    return await localBridgeClient.writeLocalFile(params.path, newContent);
                }
            },
            {
                name: 'file_delete',
                description: 'Delete a file.',
                parameters: { path: 'string' },
                handler: async (params) => {
                    return await localBridgeClient.deleteLocalFile(params.path);
                }
            },
            {
                name: 'file_copy',
                description: 'Copy a file to a new location.',
                parameters: { source: 'string', destination: 'string' },
                handler: async (params) => {
                    // Read source, write to destination
                    const content = await localBridgeClient.readLocalFile(params.source);
                    if (!content.success || !content.content) return content;
                    return await localBridgeClient.writeLocalFile(params.destination, content.content);
                }
            },
            {
                name: 'file_move',
                description: 'Move/rename a file.',
                parameters: { source: 'string', destination: 'string' },
                handler: async (params) => {
                    return await localBridgeClient.renameFile(params.source, params.destination);
                }
            },
            {
                name: 'file_rename',
                description: 'Rename a file.',
                parameters: { path: 'string', newName: 'string' },
                handler: async (params) => {
                    const dir = params.path.substring(0, params.path.lastIndexOf('/'));
                    const dest = `${dir}/${params.newName}`;
                    return await localBridgeClient.renameFile(params.path, dest);
                }
            },

            // === Directory Operations ===
            {
                name: 'dir_list',
                description: 'List contents of a directory.',
                parameters: { path: 'string' },
                handler: async (params) => {
                    return await localBridgeClient.listDirectory(params.path);
                }
            },
            {
                name: 'dir_create',
                description: 'Create a directory (including parents).',
                parameters: { path: 'string' },
                handler: async (params) => {
                    return await localBridgeClient.makeDirectory(params.path);
                }
            },
            {
                name: 'dir_delete',
                description: 'Delete a directory recursively.',
                parameters: { path: 'string' },
                handler: async (params) => {
                    // Use terminal command for recursive delete
                    return await localBridgeClient.runTerminalCommand(`rm -rf "${params.path}"`);
                }
            },
            {
                name: 'dir_tree',
                description: 'Get recursive directory tree.',
                parameters: { path: 'string', depth: 'number?' },
                handler: async (params) => {
                    const depth = params.depth || 3;
                    return await localBridgeClient.runTerminalCommand(`find "${params.path}" -maxdepth ${depth} -type f`);
                }
            },

            // === Search & Filter ===
            {
                name: 'file_search',
                description: 'Search for files by name pattern.',
                parameters: { directory: 'string', pattern: 'string' },
                handler: async (params) => {
                    return await localBridgeClient.runTerminalCommand(`find "${params.directory}" -name "${params.pattern}"`);
                }
            },
            {
                name: 'file_grep',
                description: 'Search file contents for a pattern.',
                parameters: { directory: 'string', pattern: 'string', extensions: 'string[]?' },
                handler: async (params) => {
                    const ext = params.extensions?.length ? `--include=*.{${params.extensions.join(',')}}` : '';
                    return await localBridgeClient.runTerminalCommand(`grep -rn ${ext} "${params.pattern}" "${params.directory}"`);
                }
            },

            // === Compression ===
            {
                name: 'file_zip',
                description: 'Create a zip archive from files/directory.',
                parameters: { sources: 'string[]', outputPath: 'string' },
                handler: async (params) => {
                    const sourceList = params.sources.join(' ');
                    return await localBridgeClient.runTerminalCommand(`zip -r "${params.outputPath}" ${sourceList}`);
                }
            },
            {
                name: 'file_unzip',
                description: 'Extract a zip archive.',
                parameters: { zipPath: 'string', outputDir: 'string' },
                handler: async (params) => {
                    return await localBridgeClient.runTerminalCommand(`unzip -o "${params.zipPath}" -d "${params.outputDir}"`);
                }
            },

            // === Cloud Storage (R2) ===
            {
                name: 'r2_upload',
                description: 'Upload a file to Cloudflare R2.',
                parameters: { localPath: 'string', remotePath: 'string' },
                handler: async (params) => {
                    // First read the file, then upload via API
                    const fileResult = await localBridgeClient.readLocalFile(params.localPath, true);
                    if (!fileResult.success || !fileResult.content) return fileResult;

                    const response = await fetch('/api/storage', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/octet-stream', 'X-Object-Key': params.remotePath },
                        body: atob(fileResult.content)
                    });
                    return { success: response.ok, remotePath: params.remotePath };
                }
            },
            {
                name: 'r2_download',
                description: 'Download a file from Cloudflare R2.',
                parameters: { remotePath: 'string', localPath: 'string' },
                handler: async (params) => {
                    const response = await fetch(`/api/storage?key=${encodeURIComponent(params.remotePath)}`);
                    if (!response.ok) return { success: false, error: 'Download failed' };
                    const content = await response.text();
                    return await localBridgeClient.writeLocalFile(params.localPath, content);
                }
            },
            {
                name: 'r2_list',
                description: 'List objects in R2 bucket.',
                parameters: { prefix: 'string?' },
                handler: async (params) => {
                    const url = params.prefix ? `/api/storage?prefix=${encodeURIComponent(params.prefix)}` : '/api/storage';
                    const response = await fetch(url);
                    return await response.json();
                }
            },
            {
                name: 'r2_delete',
                description: 'Delete an object from R2.',
                parameters: { remotePath: 'string' },
                handler: async (params) => {
                    const response = await fetch(`/api/storage?key=${encodeURIComponent(params.remotePath)}`, { method: 'DELETE' });
                    return { success: response.ok };
                }
            },

            // === Utilities ===
            {
                name: 'file_hash',
                description: 'Compute hash of a file (MD5/SHA256).',
                parameters: { path: 'string', algorithm: 'md5|sha256' },
                handler: async (params) => {
                    const algo = params.algorithm || 'sha256';
                    // Use openssl for hashing on most systems
                    return await localBridgeClient.runTerminalCommand(`openssl dgst -${algo} "${params.path}"`);
                }
            }
        ]
    });

    console.log('[FileLimb] 25 capabilities registered.');
};
