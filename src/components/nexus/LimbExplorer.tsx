import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Box, Search, ExternalLink, Activity, Info } from 'lucide-react';
import { neuralRegistry } from '../../services/ai/NeuralRegistry';
import { nexusBus } from '../../services/nexusCommandBus';

const LimbExplorer: React.FC = () => {
    const [capabilities, setCapabilities] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLimb, setSelectedLimb] = useState<any | null>(null);

    useEffect(() => {
        const fetchRegistry = () => {
            const limbs = neuralRegistry.getAllLimbs();
            const allCaps: any[] = [];
            limbs.forEach((limb: any) => {
                limb.capabilities.forEach((cap: any) => {
                    allCaps.push({ ...cap, limbId: limb.id, limbName: limb.name });
                });
            });
            setCapabilities(allCaps);
        };

        fetchRegistry();
        const unsubRegistered = neuralRegistry.on('capability_registered', fetchRegistry);
        const unsubRegistry = neuralRegistry.subscribe(fetchRegistry);

        return () => {
            unsubRegistered();
            unsubRegistry();
        };
    }, []);

    const filteredCapabilities = capabilities.filter(cap =>
        cap.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cap.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cap.limbId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col bg-[#050a15] text-cyan-50 font-sans selection:bg-cyan-500/30 overflow-hidden">
            {/* Header */}
            <div className="p-8 border-b border-cyan-500/10 bg-black/40 backdrop-blur-xl flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                        <Cpu className="w-8 h-8 text-cyan-400" />
                        Limb Explorer
                    </h1>
                    <p className="text-[10px] text-cyan-500/70 font-black uppercase tracking-[0.3em] mt-1">Neural Registry & Capability Interface</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="SEARCH CAPABILITIES..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-black/60 border border-cyan-500/20 rounded-xl py-2.5 pl-10 pr-4 text-[10px] font-black tracking-widest text-white focus:outline-none focus:border-cyan-400 transition-all w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* List Section */}
                <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar">
                    {filteredCapabilities.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] text-slate-500 gap-4">
                            <Box className="w-12 h-12 opacity-20" />
                            <span className="text-[10px] uppercase font-black tracking-widest">No matching limbs found</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {filteredCapabilities.map((cap, idx) => (
                                <div
                                    key={`${cap.limbId}-${cap.name}-${idx}`}
                                    onClick={() => setSelectedLimb(cap)}
                                    className={`p-6 bg-black/40 border transition-all cursor-pointer group rounded-[2rem] hover:translate-y-[-2px] ${selectedLimb?.name === cap.name ? 'border-cyan-400 bg-cyan-950/10 shadow-[0_0_30px_rgba(0,242,255,0.1)]' : 'border-white/5 hover:border-cyan-500/30'}`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                                                <Zap className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-cyan-500 font-black uppercase tracking-widest">{cap.limbId}</span>
                                                <h3 className="text-sm font-black text-white uppercase tracking-tight">{cap.name}</h3>
                                            </div>
                                        </div>
                                        <Activity className={`w-4 h-4 ${selectedLimb?.name === cap.name ? 'text-cyan-400 animate-pulse' : 'text-slate-700'}`} />
                                    </div>
                                    <p className="text-[11px] text-slate-400 leading-relaxed mb-4 line-clamp-2">{cap.description}</p>
                                    <div className="flex items-center gap-2">
                                        {Object.keys(cap.parameters || {}).map(p => (
                                            <span key={p} className="text-[8px] px-2 py-0.5 bg-white/5 border border-white/5 rounded-md text-slate-500 font-black uppercase">@{p}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Properties Panel */}
                <div className="w-96 bg-black/40 border-l border-cyan-500/10 p-8 overflow-y-auto no-scrollbar backdrop-blur-3xl font-mono">
                    {selectedLimb ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 mb-6 flex items-center gap-2">
                                    <Info className="w-4 h-4" />
                                    Capability Specs
                                </h2>
                                <div className="space-y-6">
                                    <div className="p-5 bg-black/60 border border-white/5 rounded-2xl">
                                        <span className="text-[8px] text-slate-500 uppercase font-black block mb-2">Internal Method</span>
                                        <span className="text-xs text-white font-black truncate block">{selectedLimb.name}</span>
                                    </div>
                                    <div className="p-5 bg-black/60 border border-white/5 rounded-2xl">
                                        <span className="text-[8px] text-slate-500 uppercase font-black block mb-2">Schema Definition</span>
                                        <pre className="text-[10px] text-cyan-400/80 mt-2 overflow-x-auto">
                                            {JSON.stringify(selectedLimb.parameters, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => neuralRegistry.emit('nexus:job_start', { description: `Invoking ${selectedLimb.name}...` })}
                                className="w-full nexus-btn-primary py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 group"
                            >
                                Execute Proxy
                                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </button>

                            <div className="mt-8 pt-8 border-t border-white/5">
                                <span className="text-[8px] text-slate-600 uppercase font-black block mb-4">Limb Status</span>
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-slate-400 uppercase font-black tracking-widest">Readiness</span>
                                    <span className="text-emerald-500 font-black">STABLE</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] mt-2">
                                    <span className="text-slate-400 uppercase font-black tracking-widest">Invocation Count</span>
                                    <span className="text-white font-black">1.2k</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                            <Cpu className="w-12 h-12 text-slate-600 mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-relaxed px-12">
                                Select a capability from the registry to inspect its neural schema and parameters.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LimbExplorer;
