import React, { useEffect, useState } from 'react';
import { directorMemory } from '../../services/directorMemoryService';
import { matrixProbe } from '../../services/matrixSceneProbe';
import { aiMaterialService } from '../../services/aiMaterialService';
import { Box, Settings, Zap, History, Database, Wand2, Info, ChevronRight, Layers, Cpu } from 'lucide-react';

import { graphStateService } from '../../services/gameData/graphStateService';

const Matrix: React.FC = () => {
    const [selectedEntity, setSelectedEntity] = useState<any>(null);
    const [isGeneratingMat, setIsGeneratingMat] = useState(false);
    const [matPrompt, setMatPrompt] = useState('');
    const [activeInspectorTab, setActiveInspectorTab] = useState<'Scene' | 'Physics' | 'Lighting' | 'XR'>('Scene');
    const [graphName, setGraphName] = useState('My Neural Net');

    useEffect(() => {
        directorMemory.addMemory('Matrix Scene Active: Monitoring WebGL telemetry.', 'session', 0.8, ['matrix', 'status']);
        matrixProbe.updateEntity({ id: 'world-origin', type: 'SpatialRoot', position: [0, 0, 0] });
        return () => matrixProbe.clear();
    }, []);

    const handleSaveGraph = async () => {
        try {
            // Mock nodes/edges for now - in full implementation, read from state
            const mockNodes: any[] = [{ id: 'input-1', type: 'input' }, { id: 'output-1', type: 'output' }];
            const mockEdges: any[] = [{ id: 'e1-2', source: 'input-1', target: 'output-1' }];

            await graphStateService.saveGraph(graphName, mockNodes, mockEdges);
            alert(`Graph "${graphName}" saved to Neural Cloud!`);
        } catch (e) {
            console.error('Failed to save graph', e);
        }
    };

    const handleGenMaterial = async () => {
        if (!matPrompt.trim()) return;
        setIsGeneratingMat(true);
        try {
            const result = await aiMaterialService.generateMaterial(matPrompt);
            console.log('[MATRIX] AI Material Generated:', result.mapUrl.substring(0, 50) + '...');
        } catch (error) {
            console.error('[MATRIX] Material generation failed:', error);
        } finally {
            setIsGeneratingMat(false);
            setMatPrompt('');
        }
    }

    return (
        <div className="h-full flex bg-[#050a15] text-cyan-50 font-mono">
            {/* 3D Viewport (Main) */}
            <div className="flex-1 flex flex-col relative overflow-hidden group">
                <div className="absolute top-4 left-4 z-10 flex gap-2 w-full pr-8 justify-between">
                    <div className="flex gap-2">
                        {['Scene', 'Physics', 'Lighting', 'XR'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveInspectorTab(tab as any)}
                                className={`px-4 py-1.5 backdrop-blur-md border text-[10px] font-black uppercase rounded-full transition-all nexus-btn ${activeInspectorTab === tab
                                    ? 'bg-cyan-500 text-white border-cyan-400 shadow-[0_0_15px_rgba(0,242,255,0.4)]'
                                    : 'bg-black/60 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2 bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/10">
                        <input
                            type="text"
                            value={graphName}
                            onChange={(e) => setGraphName(e.target.value)}
                            className="bg-transparent text-white text-[10px] font-mono px-3 outline-none w-32 text-right"
                        />
                        <button
                            onClick={handleSaveGraph}
                            className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-full hover:bg-cyan-500 hover:text-white transition-all"
                            title="Save Graph State"
                        >
                            <Database className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* Simulated WebGL Viewport */}
                <div className="flex-1 border-4 border-dashed border-cyan-900/10 m-8 rounded-[40px] flex items-center justify-center relative bg-black/20">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,242,255,0.02)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="text-center">
                        <div className="text-6xl mb-6 drop-shadow-[0_0_15px_rgba(0,255,255,0.3)] animate-float">🛰️</div>
                        <div className="text-xl font-black text-slate-800 uppercase tracking-[0.8em]">Matrix Runtime</div>
                        <div className="text-[10px] text-cyan-900 font-bold uppercase mt-4 tracking-widest">Awaiting Neural Link</div>
                    </div>

                    {/* Simple Clickable Entity for Demo */}
                    <div
                        onClick={() => setSelectedEntity({ id: 'cube-01', type: 'MeshInstance (Cube)', pos: [2, 0, -5] })}
                        className="absolute bottom-20 left-1/2 -translate-x-1/2 w-16 h-16 border-2 border-cyan-500/20 rounded-xl cursor-pointer hover:border-cyan-400 hover:bg-cyan-400/10 transition-all flex items-center justify-center group/ent"
                    >
                        <Box className="w-6 h-6 text-cyan-500/40 group-hover/ent:text-cyan-400" />
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] uppercase font-black text-cyan-600 opacity-0 group-hover/ent:opacity-100 transition-opacity">Select Entity</div>
                    </div>
                </div>

                {/* Bottom Stats Overlay */}
                <div className="absolute bottom-12 left-12 flex gap-8">
                    <MatrixStat label="Draw Calls" value="127" />
                    <MatrixStat label="Triangles" value="42.1k" />
                    <MatrixStat label="VRAM" value="2.4 GB" />
                </div>
            </div>

            {/* Matrix Inspector Sidebar */}
            <div className="w-96 border-l border-cyan-500/10 bg-black/40 flex flex-col">
                <div className="p-4 border-b border-cyan-500/10 bg-black/20">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-500 flex items-center gap-2">
                        <Settings className="w-3 h-3" />
                        Matrix Inspector
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {selectedEntity ? (
                        <div className="space-y-6">
                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                <div className="text-[10px] text-slate-500 uppercase font-black mb-1">Active Entity</div>
                                <div className="text-sm font-black text-white">{selectedEntity.id}</div>
                                <div className="text-[9px] text-cyan-600 uppercase font-bold mt-2">{selectedEntity.type}</div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                                    <Wand2 className="w-3 h-3 text-purple-400" />
                                    AI Media Synthesis
                                </h3>
                                <div className="p-4 bg-purple-950/10 border border-purple-500/20 rounded-2xl space-y-3">
                                    <label className="nexus-label !text-purple-400">Generate PBR Material</label>
                                    <textarea
                                        value={matPrompt}
                                        onChange={(e) => setMatPrompt(e.target.value)}
                                        placeholder="Describe a 3D material... (e.g. Scratched obsidian with lava veins)"
                                        className="nexus-textarea w-full h-24 resize-none"
                                    />
                                    <button
                                        onClick={handleGenMaterial}
                                        disabled={isGeneratingMat || !matPrompt.trim()}
                                        className="w-full nexus-btn-accent py-3 font-black uppercase tracking-widest"
                                    >
                                        {isGeneratingMat ? 'Synthesizing...' : 'Ignite Texture'}
                                    </button>
                                </div>
                            </div>

                            {activeInspectorTab === 'Physics' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        <Zap className="w-3 h-3 text-amber-400" />
                                        Physics Overrides
                                    </h3>
                                    <div className="p-4 bg-amber-950/10 border border-amber-500/20 rounded-2xl space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] text-amber-500 font-bold uppercase">Gravity Link</span>
                                            <div className="w-12 h-1 bg-amber-500/20 rounded-full overflow-hidden">
                                                <div className="w-full h-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></div>
                                            </div>
                                        </div>
                                        <button className="w-full py-3 nexus-btn-primary text-[9px] font-black uppercase tracking-widest">Recalculate Bounds</button>
                                    </div>
                                </div>
                            )}

                            {activeInspectorTab === 'Scene' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        <Layers className="w-3 h-3" />
                                        Transform
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <TransformInput label="X" value={selectedEntity.pos[0]} />
                                        <TransformInput label="Y" value={selectedEntity.pos[1]} />
                                        <TransformInput label="Z" value={selectedEntity.pos[2]} />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 gap-4">
                            <Cpu className="w-12 h-12" />
                            <div className="text-[10px] uppercase font-black tracking-widest max-w-[120px]">Select an entry in the viewport to inspect</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MatrixStat = ({ label, value }: { label: string, value: string }) => (
    <div className="flex flex-col">
        <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-1">{label}</span>
        <span className="text-xl font-black text-white tracking-tighter">{value}</span>
    </div>
);

const TransformInput = ({ label, value }: { label: string, value: any }) => (
    <div className="px-3 py-2 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between">
        <span className="text-[9px] font-black text-slate-600">{label}</span>
        <span className="text-[10px] font-bold text-cyan-400">{value}</span>
    </div>
);

export default Matrix;
