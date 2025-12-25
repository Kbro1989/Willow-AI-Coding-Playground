/**
 * File Browser Component
 * Displays local files (when bridge connected) or cloud files (when disconnected)
 * with desktop-like context menu operations
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { localBridgeClient } from '../services/localBridgeService';
import type { FileNode } from '../types';

interface FileBrowserProps {
    files: FileNode[];
    activeFile: string | null;
    onSelectFile: (path: string) => void;
    onCreateNode: (parentPath: string | null, name: string, type: 'file' | 'dir') => void;
    onFileUpdate?: (path: string, content: string) => void;
}

interface ContextMenuState {
    x: number;
    y: number;
    node: FileNode;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({
    files,
    activeFile,
    onSelectFile,
    onCreateNode,
    onFileUpdate
}) => {
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [bridgeStatus, setBridgeStatus] = useState({ isConnected: false, isCloudMode: true });
    const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
    const [renaming, setRenaming] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const contextMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setBridgeStatus(localBridgeClient.getStatus());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    const handleContextMenu = useCallback((e: React.MouseEvent, node: FileNode) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, node });
    }, []);

    const handleRename = async () => {
        if (!contextMenu || !newName) return;

        const oldPath = contextMenu.node.path;
        const pathParts = oldPath.split('/');
        pathParts[pathParts.length - 1] = newName;
        const newPath = pathParts.join('/');

        // Read content, delete old, create new
        if (contextMenu.node.type === 'file') {
            const result = await localBridgeClient.readLocalFile(oldPath);
            if (result.success && result.content) {
                await localBridgeClient.deleteLocalFile(oldPath);
                await localBridgeClient.writeLocalFile(newPath, result.content);
                onFileUpdate?.(newPath, result.content);
            }
        } else {
            // For directories, would need recursive operation
            alert('Directory renaming requires full tree copy - not yet implemented');
        }

        setRenaming(null);
        setNewName('');
        setContextMenu(null);
    };

    const handleDelete = async () => {
        if (!contextMenu) return;

        if (!confirm(`Delete ${contextMenu.node.name}?`)) return;

        const result = await localBridgeClient.deleteLocalFile(contextMenu.node.path);
        if (result.success) {
            console.log(`[FILE_BROWSER] Deleted: ${contextMenu.node.path}`);
        } else {
            alert(`Failed to delete: ${result.error}`);
        }
        setContextMenu(null);
    };

    const handleCopy = () => {
        if (!contextMenu) return;
        navigator.clipboard.writeText(contextMenu.node.path);
        setContextMenu(null);
    };

    const handleNewFile = () => {
        if (!contextMenu) return;
        const parentPath = contextMenu.node.type === 'dir' ? contextMenu.node.path : null;
        const name = prompt('File name:');
        if (name) {
            onCreateNode(parentPath, name, 'file');
        }
        setContextMenu(null);
    };

    const handleNewFolder = () => {
        if (!contextMenu) return;
        const parentPath = contextMenu.node.type === 'dir' ? contextMenu.node.path : null;
        const name = prompt('Folder name:');
        if (name) {
            onCreateNode(parentPath, name, 'dir');
        }
        setContextMenu(null);
    };

    const handleOpenInEditor = () => {
        if (!contextMenu || contextMenu.node.type !== 'file') return;
        onSelectFile(contextMenu.node.path);
        setContextMenu(null);
    };

    const handleRevealInExplorer = async () => {
        if (!contextMenu) return;
        // This would open the file in native file explorer
        await localBridgeClient.runTerminalCommand(`explorer /select,"${contextMenu.node.path}"`);
        setContextMenu(null);
    };

    const toggleDir = (path: string) => {
        setExpandedDirs(prev => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });
    };

    const renderNode = (node: FileNode, depth: number = 0): JSX.Element => {
        const isExpanded = expandedDirs.has(node.path);
        const isActive = activeFile === node.path;
        const isRenaming = renaming === node.path;

        return (
            <div key={node.path}>
                <div
                    className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-cyan-900/10 transition-colors ${isActive ? 'bg-cyan-600/20 border-l-2 border-cyan-500' : ''
                        }`}
                    style={{ paddingLeft: `${depth * 16 + 8}px` }}
                    onClick={() => {
                        if (node.type === 'dir') toggleDir(node.path);
                        else onSelectFile(node.path);
                    }}
                    onContextMenu={(e) => handleContextMenu(e, node)}
                >
                    {/* Icon */}
                    <span className="text-xs shrink-0">
                        {node.type === 'dir' ? (isExpanded ? '📂' : '📁') : '📄'}
                    </span>

                    {/* Name or Rename Input */}
                    {isRenaming ? (
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename();
                                if (e.key === 'Escape') {
                                    setRenaming(null);
                                    setNewName('');
                                }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="flex-1 bg-slate-800 border border-cyan-500 rounded px-2 py-0.5 text-xs text-cyan-100 outline-none"
                        />
                    ) : (
                        <span className={`text-xs truncate flex-1 ${isActive ? 'text-cyan-400 font-bold' : 'text-slate-300'}`}>
                            {node.name}
                        </span>
                    )}

                    {/* Cloud/Local indicator */}
                    {node.type === 'file' && (
                        <span className="text-[9px] text-slate-500 shrink-0">
                            {bridgeStatus.isConnected ? '💻' : '☁️'}
                        </span>
                    )}
                </div>

                {/* Children */}
                {node.type === 'dir' && isExpanded && node.children && (
                    <div>
                        {node.children.map(child => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="relative h-full flex flex-col bg-[#0a1222]">
            {/* Header */}
            <div className="p-3 border-b border-slate-700 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-slate-400">Files</span>
                    <div className={`w-2 h-2 rounded-full ${bridgeStatus.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                    <span className="text-[9px] text-slate-500">
                        {bridgeStatus.isConnected ? 'Local' : 'Cloud'}
                    </span>
                </div>
                <button
                    onClick={() => onCreateNode(null, prompt('File name:') || 'untitled.txt', 'file')}
                    className="p-1 hover:bg-slate-700 rounded transition-colors"
                    title="New File"
                >
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>

            {/* File Tree */}
            <div className="flex-1 overflow-y-auto">
                {files.map(node => renderNode(node))}
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    className="fixed bg-[#0a1222] border border-slate-700 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.8)] py-1 z-50 min-w-[200px]"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {contextMenu.node.type === 'file' && (
                        <button
                            onClick={handleOpenInEditor}
                            className="w-full text-left px-4 py-2 text-xs text-cyan-100 hover:bg-cyan-600/20 transition-colors flex items-center gap-3"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Open in Editor
                        </button>
                    )}

                    <button
                        onClick={() => {
                            setRenaming(contextMenu.node.path);
                            setNewName(contextMenu.node.name);
                            setContextMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-cyan-100 hover:bg-cyan-600/20 transition-colors flex items-center gap-3"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Rename
                    </button>

                    <button
                        onClick={handleCopy}
                        className="w-full text-left px-4 py-2 text-xs text-cyan-100 hover:bg-cyan-600/20 transition-colors flex items-center gap-3"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Copy Path
                    </button>

                    {contextMenu.node.type === 'dir' && (
                        <>
                            <div className="h-px bg-slate-700 my-1" />
                            <button
                                onClick={handleNewFile}
                                className="w-full text-left px-4 py-2 text-xs text-cyan-100 hover:bg-cyan-600/20 transition-colors flex items-center gap-3"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                New File
                            </button>
                            <button
                                onClick={handleNewFolder}
                                className="w-full text-left px-4 py-2 text-xs text-cyan-100 hover:bg-cyan-600/20 transition-colors flex items-center gap-3"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                                New Folder
                            </button>
                        </>
                    )}

                    <div className="h-px bg-slate-700 my-1" />

                    {bridgeStatus.isConnected && (
                        <button
                            onClick={handleRevealInExplorer}
                            className="w-full text-left px-4 py-2 text-xs text-cyan-100 hover:bg-cyan-600/20 transition-colors flex items-center gap-3"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Reveal in Explorer
                        </button>
                    )}

                    <button
                        onClick={handleDelete}
                        className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-600/20 transition-colors flex items-center gap-3"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
};

export default FileBrowser;
