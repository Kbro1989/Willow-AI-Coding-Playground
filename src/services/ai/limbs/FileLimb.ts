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
                    const result = await localBridgeClient.execute({ type: 'read-file', path: params.path });
                    return result;
                }
            },
            {
                name: 'file_read_binary',
                description: 'Read file as base64 encoded binary.',
                parameters: { path: 'string' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({ type: 'read-file-binary', path: params.path });
                    return result;
                }
            },
            {
                name: 'file_read_json',
                description: 'Read and parse a JSON file.',
                parameters: { path: 'string' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({ type: 'read-file', path: params.path });
                    try {
                        return { success: true, data: JSON.parse(result.content || '{}') };
                    } catch (e) {
                        return { success: false, error: 'Invalid JSON' };
                    }
                }
            },
            {
                name: 'file_exists',
                description: 'Check if a file exists.',
                parameters: { path: 'string' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({ type: 'file-exists', path: params.path });
                    return result;
                }
            },
            {
                name: 'file_stat',
                description: 'Get file metadata (size, modified date).',
                parameters: { path: 'string' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({ type: 'file-stat', path: params.path });
                    return result;
                }
            },

            // === Write Operations ===
            {
                name: 'file_write',
                description: 'Write text content to a file.',
                parameters: { path: 'string', content: 'string' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({ type: 'write-file', path: params.path, content: params.content });
                    return result;
                }
            },
            {
                name: 'file_write_json',
                description: 'Write an object as formatted JSON.',
                parameters: { path: 'string', data: 'object' },
                handler: async (params) => {
                    const content = JSON.stringify(params.data, null, 2);
                    const result = await localBridgeClient.execute({ type: 'write-file', path: params.path, content });
                    return result;
                }
            },
            {
                name: 'file_append',
                description: 'Append text to a file.',
                parameters: { path: 'string', content: 'string' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({ type: 'append-file', path: params.path, content: params.content });
                    return result;
                }
            },
            {
                name: 'file_delete',
                description: 'Delete a file.',
                parameters: { path: 'string' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({ type: 'delete-file', path: params.path });
                    return result;
                }
            },
            {
                name: 'file_copy',
                description: 'Copy a file to a new location.',
                parameters: { source: 'string', destination: 'string' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({ type: 'copy-file', source: params.source, destination: params.destination });
                    return result;
                }
            },
            {
                name: 'file_move',
                description: 'Move/rename a file.',
                parameters: { source: 'string', destination: 'string' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({ type: 'move-file', source: params.source, destination: params.destination });
                    return result;
                }
            },
            {
                name: 'file_rename',
                description: 'Rename a file.',
                parameters: { path: 'string', newName: 'string' },
                handler: async (params) => {
                    const dir = params.path.substring(0, params.path.lastIndexOf('/'));
                    const dest = `${dir}/${params.newName}`;
                    const result = await localBridgeClient.execute({ type: 'move-file', source: params.path, destination: dest });
                    return result;
                }
            },

            // === Directory Operations ===
            {
                name: 'dir_list',
                description: 'List contents of a directory.',
                parameters: { path: 'string' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({ type: 'list-directory', path: params.path });
                    return result;
                }
            },
            {
                name: 'dir_create',
                description: 'Create a directory (including parents).',
                parameters: { path: 'string' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({ type: 'create-directory', path: params.path });
                    return result;
                }
            },
            {
                name: 'dir_delete',
                description: 'Delete a directory recursively.',
                parameters: { path: 'string' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({ type: 'delete-directory', path: params.path });
                    return result;
                }
            },
            {
                name: 'dir_tree',
                description: 'Get recursive directory tree.',
                parameters: { path: 'string', depth: 'number?' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({ type: 'directory-tree', path: params.path, depth: params.depth || 3 });
                    return result;
                }
            },

            // === Search & Filter ===
            {
                name: 'file_search',
                description: 'Search for files by name pattern.',
                parameters: { directory: 'string', pattern: 'string' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({ type: 'search-files', directory: params.directory, pattern: params.pattern });
                    return result;
                }
            },
            {
                name: 'file_grep',
                description: 'Search file contents for a pattern.',
                parameters: { directory: 'string', pattern: 'string', extensions: 'string[]?' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({ type: 'grep-files', directory: params.directory, pattern: params.pattern, extensions: params.extensions });
                    return result;
                }
            },

            // === Compression ===
            {
                name: 'file_zip',
                description: 'Create a zip archive from files/directory.',
                parameters: { sources: 'string[]', outputPath: 'string' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({ type: 'zip', sources: params.sources, output: params.outputPath });
                    return result;
                }
            },
            {
                name: 'file_unzip',
                description: 'Extract a zip archive.',
                parameters: { zipPath: 'string', outputDir: 'string' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({ type: 'unzip', zipPath: params.zipPath, outputDir: params.outputDir });
                    return result;
                }
            },

            // === Cloud Storage (R2) ===
            {
                name: 'r2_upload',
                description: 'Upload a file to Cloudflare R2.',
                parameters: { localPath: 'string', remotePath: 'string' },
                handler: async (params) => {
                    // First read the file, then upload via API
                    const fileResult = await localBridgeClient.execute({ type: 'read-file-binary', path: params.localPath });
                    if (!fileResult.success) return fileResult;

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
                    const result = await localBridgeClient.execute({ type: 'write-file', path: params.localPath, content });
                    return result;
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
                    const result = await localBridgeClient.execute({ type: 'file-hash', path: params.path, algorithm: params.algorithm || 'sha256' });
                    return result;
                }
            }
        ]
    });

    console.log('[FileLimb] 25 capabilities registered.');
};
