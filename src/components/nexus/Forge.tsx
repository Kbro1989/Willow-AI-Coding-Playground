import React, { useState } from 'react';
import ImageStudio from '../media/ImageStudio';
import AudioWorkshop from '../media/AudioWorkshop';
import { VideoStudio } from '../media/VideoStudio';
import ModelStudio from '../media/ModelStudio';
import { forgeMedia, ForgeAsset } from '../../services/forgeMediaService';
import { Hammer, Image as ImageIcon, Music, Video, Box, Layers, History, ExternalLink, Trash2 } from 'lucide-react';

type ForgeTab = 'image' | 'audio' | 'video' | 'model' | 'library';

const Forge: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ForgeTab>('image');

    return (
        <div className="h-full flex flex-col bg-[#050a15] text-cyan-50 font-mono">
            {/* Forge Sub-Navigation */}
            <div className="p-4 border-b border-purple-500/10 flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <Hammer className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-black uppercase tracking-widest text-white">Neural Forge</span>
                    </div>

                    <nav className="flex gap-2">
                        <ForgeNavButton active={activeTab === 'image'} onClick={() => setActiveTab('image')} icon={<ImageIcon className="w-3 h-3" />} label="Image" />
                        <ForgeNavButton active={activeTab === 'audio'} onClick={() => setActiveTab('audio')} icon={<Music className="w-3 h-3" />} label="Audio" />
                        <ForgeNavButton active={activeTab === 'video'} onClick={() => setActiveTab('video')} icon={<Video className="w-3 h-3" />} label="Video" />
                        <ForgeNavButton active={activeTab === 'model'} onClick={() => setActiveTab('model')} icon={<Box className="w-3 h-3" />} label="3D" />
                        <div className="w-px h-6 bg-white/5 mx-2" />
                        <ForgeNavButton active={activeTab === 'library'} onClick={() => setActiveTab('library')} icon={<Layers className="w-3 h-3" />} label="Assets" />
                    </nav>
                </div>

                <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase">
                    Status: <span className="text-emerald-500">Factory Ready</span>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 relative flex flex-col overflow-hidden">
                    {activeTab === 'image' && <ImageStudio />}
                    {activeTab === 'audio' && <AudioWorkshop />}
                    {activeTab === 'video' && <VideoStudio />}
                    {activeTab === 'model' && <ModelStudio />}
                    {activeTab === 'library' && <ForgeLibrary />}
                </div>

                {/* Right Pipeline Sidebar (Recent Generations) */}
                <ForgeSidebar />
            </div>
        </div>
    );
};

const ForgeLibrary = () => {
    const [assets, setAssets] = useState<ForgeAsset[]>(forgeMedia.getAssets());
    const [filter, setFilter] = useState<string>('all');

    React.useEffect(() => {
        return forgeMedia.subscribe(setAssets);
    }, []);

    const filteredAssets = assets.filter(a => filter === 'all' || a.type === filter);

    return (
        <div className="flex flex-col h-full bg-[#0a1222]">
            {/* Toolbar */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex gap-2">
                    {['all', 'image', 'audio', 'video', 'model'].map(t => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all ${filter === t
                                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
                <div className="text-[10px] text-slate-500 font-black uppercase">{filteredAssets.length} Assets</div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredAssets.map(asset => (
                    <div key={asset.id} className="group relative bg-black/40 border border-white/5 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all">
                        <div className="aspect-square bg-white/5 flex items-center justify-center relative">
                            {asset.type === 'image' && <img src={asset.url} alt={asset.prompt} className="w-full h-full object-cover" />}
                            {asset.type === 'video' && <video src={asset.url} className="w-full h-full object-cover" />}
                            {asset.type === 'audio' && <Music className="w-12 h-12 text-yellow-500/50" />}
                            {asset.type === 'model' && <Box className="w-12 h-12 text-purple-500/50" />}

                            {/* Overlay Actions */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    onClick={() => window.open(asset.url, '_blank')}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
                                    title="Open / Download"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => forgeMedia.removeAsset(asset.id)}
                                    className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-full text-red-400"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="p-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-[8px] font-black uppercase px-1.5 rounded ${getTypeColor(asset.type)}`}>{asset.type}</span>
                                <span className="text-[8px] text-slate-600">{new Date(asset.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 line-clamp-1 truncate" title={asset.prompt}>{asset.prompt || 'Untitled Asset'}</p>
                        </div>
                    </div>
                ))}
                {filteredAssets.length === 0 && (
                    <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-700">
                        <Box className="w-12 h-12 mb-4 opacity-20" />
                        <span className="text-xs font-black uppercase tracking-widest">No Assets Found</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const ForgeNavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button
        onClick={onClick}
        className={`px-4 py-1.5 rounded-xl flex items-center gap-2 transition-all border ${active ? 'bg-purple-500/20 border-purple-500/40 text-white' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'}`}
    >
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
);

const ForgeSidebar = () => {
    const [assets, setAssets] = useState<ForgeAsset[]>(forgeMedia.getAssets());

    React.useEffect(() => {
        return forgeMedia.subscribe(setAssets);
    }, []);

    return (
        <div className="w-80 border-l border-white/5 bg-black/30 flex flex-col">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                    <History className="w-3 h-3" />
                    Recent Forge Trace
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {assets.length === 0 ? (
                    <div className="h-40 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 opacity-30">
                        <Box className="w-6 h-6" />
                        <span className="text-[8px] uppercase font-black">Waiting for generation...</span>
                    </div>
                ) : (
                    assets.map(asset => (
                        <div key={asset.id} className="p-3 bg-white/5 border border-white/5 rounded-2xl hover:border-purple-500/30 transition-all group">
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${getTypeColor(asset.type)}`}>
                                    {asset.type}
                                </span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => window.open(asset.url, '_blank')} className="text-slate-500 hover:text-white"><ExternalLink className="w-3 h-3" /></button>
                                    <button onClick={() => forgeMedia.removeAsset(asset.id)} className="text-slate-500 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            </div>
                            {asset.type === 'image' && asset.url && (
                                <img src={asset.url} alt="Generation" className="w-full h-24 object-cover rounded-lg mb-2 border border-white/10" />
                            )}
                            <p className="text-[9px] text-slate-400 line-clamp-2 italic">"{asset.prompt || 'Manual ingest'}"</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

const getTypeColor = (type: string) => {
    switch (type) {
        case 'image': return 'bg-cyan-500/10 text-cyan-400';
        case 'audio': return 'bg-yellow-500/10 text-yellow-400';
        case 'video': return 'bg-red-500/10 text-red-400';
        case 'model': return 'bg-purple-500/10 text-purple-400';
        default: return 'bg-slate-500/10 text-slate-400';
    }
}

export default Forge;
