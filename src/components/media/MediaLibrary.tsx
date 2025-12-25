/**
 * Media Library Component
 * Centralized browser for all media assets with search, filtering, and quick actions
 */

import React, { useState, useEffect, useRef } from 'react';
import mediaContext from '../../services/media/mediaContextService';
import type { MediaAsset, MediaType, MediaQuery } from '../../types/media';

interface MediaLibraryProps {
    onSelect?: (asset: MediaAsset) => void;
    onClose?: () => void;
    filterType?: MediaType;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({ onSelect, onClose, filterType }) => {
    const [assets, setAssets] = useState<MediaAsset[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<MediaType | 'all'>(filterType || 'all');
    const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
    const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt' | 'usageCount'>('updatedAt');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load assets
    useEffect(() => {
        const query: MediaQuery = {
            search: searchTerm || undefined,
            type: selectedType === 'all' ? undefined : selectedType,
            sortBy,
            sortOrder: 'desc'
        };

        const results = mediaContext.query(query);
        setAssets(results);
    }, [searchTerm, selectedType, sortBy]);

    // Subscribe to asset changes
    useEffect(() => {
        return mediaContext.subscribe(() => {
            const query: MediaQuery = {
                search: searchTerm || undefined,
                type: selectedType === 'all' ? undefined : selectedType,
                sortBy,
                sortOrder: 'desc'
            };
            setAssets(mediaContext.query(query));
        });
    }, [searchTerm, selectedType, sortBy]);

    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const result = await mediaContext.importAsset(file);
            if (result.success) {
                console.log(`[MEDIA_LIBRARY] Imported: ${file.name}`);
            } else {
                console.error(`[MEDIA_LIBRARY] Failed to import ${file.name}:`, result.error);
            }
        }
    };

    const handleDelete = (asset: MediaAsset) => {
        if (confirm(`Delete "${asset.name}"?`)) {
            mediaContext.delete(asset.id);
            if (selectedAsset?.id === asset.id) {
                setSelectedAsset(null);
            }
        }
    };

    const handleExport = (asset: MediaAsset) => {
        if (!asset.url) return;

        // Download the asset
        const a = document.createElement('a');
        a.href = asset.url;
        a.download = asset.name;
        a.click();
    };

    const getTypeIcon = (type: MediaType): string => {
        const icons: Record<MediaType, string> = {
            image: '🖼️',
            audio: '🎵',
            video: '🎬',
            model: '🎭',
            code: '💻',
            texture: '🎨',
            material: '✨',
            animation: '🎞️',
            sketch: '✏️'
        };
        return icons[type] || '📄';
    };

    const getStatusColor = (status: string): string => {
        const colors: Record<string, string> = {
            raw: 'text-slate-500',
            processing: 'text-yellow-500',
            optimized: 'text-emerald-500',
            failed: 'text-red-500',
            archived: 'text-slate-600'
        };
        return colors[status] || 'text-slate-400';
    };

    const formatFileSize = (bytes?: number): string => {
        if (!bytes) return 'Unknown';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    };

    const formatDate = (timestamp: number): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

        return date.toLocaleDateString();
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#050a15] text-white">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-cyan-500/30 bg-[#0a1222] shrink-0">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-widest text-cyan-400 flex items-center gap-3">
                        📁 Media Library
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                        {assets.length} asset{assets.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Import
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileImport}
                        className="hidden"
                        accept="image/*,audio/*,video/*,.glb,.gltf,.fbx,.obj"
                    />
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-all"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 p-4 border-b border-slate-700 bg-[#0a1222]/50 shrink-0">
                {/* Search */}
                <div className="flex-1 relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search assets..."
                        className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2 text-sm text-cyan-100 outline-none transition-colors"
                    />
                </div>

                {/* Type Filter */}
                <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as MediaType | 'all')}
                    className="bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-2 text-sm text-cyan-400 outline-none"
                >
                    <option value="all">All Types</option>
                    <option value="image">🖼️ Images</option>
                    <option value="audio">🎵 Audio</option>
                    <option value="video">🎬 Video</option>
                    <option value="model">🎭 3D Models</option>
                    <option value="code">💻 Code</option>
                    <option value="texture">🎨 Textures</option>
                    <option value="material">✨ Materials</option>
                    <option value="animation">🎞️ Animations</option>
                    <option value="sketch">✏️ Sketches</option>
                </select>

                {/* Sort */}
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-2 text-sm text-cyan-400 outline-none"
                >
                    <option value="updatedAt">Recently Updated</option>
                    <option value="createdAt">Recently Created</option>
                    <option value="name">Name</option>
                    <option value="usageCount">Most Used</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-slate-900 rounded-xl p-1 border border-slate-700">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="Grid view"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        title="List view"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Asset Grid/List */}
            <div className="flex-1 overflow-y-auto p-6">
                {assets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                        <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p className="text-sm font-black uppercase tracking-widest mb-2">No assets found</p>
                        <p className="text-xs mb-4">Import files to get started</p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                            Import Assets
                        </button>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {assets.map(asset => (
                            <div
                                key={asset.id}
                                onClick={() => {
                                    setSelectedAsset(asset);
                                    onSelect?.(asset);
                                    mediaContext.recordUsage(asset.id);
                                }}
                                className={`group relative bg-[#0a1222] border rounded-2xl overflow-hidden cursor-pointer transition-all hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(0,242,255,0.15)] ${selectedAsset?.id === asset.id ? 'border-cyan-500 shadow-[0_0_20px_rgba(0,242,255,0.3)]' : 'border-slate-700'
                                    }`}
                            >
                                {/* Thumbnail */}
                                <div className="aspect-square bg-slate-900 flex items-center justify-center overflow-hidden">
                                    {asset.type === 'image' && asset.url ? (
                                        <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-5xl opacity-30">{getTypeIcon(asset.type)}</span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-3 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="text-xs font-bold text-cyan-50 truncate flex-1" title={asset.name}>
                                            {asset.name}
                                        </span>
                                        <span className="text-xs shrink-0">{getTypeIcon(asset.type)}</span>
                                    </div>

                                    <div className="flex items-center justify-between text-[10px]">
                                        <span className={`font-black uppercase ${getStatusColor(asset.status)}`}>
                                            {asset.status}
                                        </span>
                                        <span className="text-slate-500">{formatDate(asset.updatedAt)}</span>
                                    </div>

                                    {asset.aiGenerated && (
                                        <div className="flex items-center gap-1 text-[9px] text-purple-400 font-black uppercase">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                            </svg>
                                            AI Generated
                                        </div>
                                    )}
                                </div>

                                {/* Quick Actions (on hover) */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleExport(asset); }}
                                        className="p-1.5 bg-black/60 hover:bg-cyan-600 backdrop-blur-sm rounded-lg transition-all"
                                        title="Export"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(asset); }}
                                        className="p-1.5 bg-black/60 hover:bg-red-600 backdrop-blur-sm rounded-lg transition-all"
                                        title="Delete"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Tags */}
                                {asset.tags.length > 0 && (
                                    <div className="absolute bottom-14 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex flex-wrap gap-1">
                                            {asset.tags.slice(0, 3).map(tag => (
                                                <span key={tag} className="text-[9px] bg-cyan-600/30 text-cyan-300 px-1.5 py-0.5 rounded font-bold">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {assets.map(asset => (
                            <div
                                key={asset.id}
                                onClick={() => {
                                    setSelectedAsset(asset);
                                    onSelect?.(asset);
                                    mediaContext.recordUsage(asset.id);
                                }}
                                className={`group flex items-center gap-4 p-4 bg-[#0a1222] border rounded-xl cursor-pointer transition-all hover:border-cyan-500/50 ${selectedAsset?.id === asset.id ? 'border-cyan-500' : 'border-slate-700'
                                    }`}
                            >
                                {/* Icon */}
                                <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
                                    {asset.type === 'image' && asset.url ? (
                                        <img src={asset.url} alt={asset.name} className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                        <span className="text-2xl">{getTypeIcon(asset.type)}</span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-bold text-cyan-50 truncate">{asset.name}</span>
                                        {asset.aiGenerated && (
                                            <span className="text-[9px] bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded font-black uppercase shrink-0">
                                                AI
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                        <span>{formatFileSize(asset.fileSize)}</span>
                                        <span>•</span>
                                        <span className={getStatusColor(asset.status)}>{asset.status}</span>
                                        <span>•</span>
                                        <span>{formatDate(asset.updatedAt)}</span>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleExport(asset); }}
                                        className="p-2 bg-slate-800 hover:bg-cyan-600 rounded-lg transition-all"
                                        title="Export"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(asset); }}
                                        className="p-2 bg-slate-800 hover:bg-red-600 rounded-lg transition-all"
                                        title="Delete"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MediaLibrary;
