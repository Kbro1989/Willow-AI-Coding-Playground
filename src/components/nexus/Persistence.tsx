import React from 'react';
import { Database, Table, Key, Filter, Cpu, Box, Layers } from 'lucide-react';
import { SceneObject, GameAsset, EngineLog } from '../../types';

interface PersistenceProps {
    variableData: Record<string, any>;
    sceneObjects: SceneObject[];
    assets: GameAsset[];
    engineLogs: EngineLog[];
}

const Persistence: React.FC<PersistenceProps> = ({ variableData, sceneObjects, assets, engineLogs }) => {

    // Calculate real stats
    const totalEntities = sceneObjects.length;
    const activeVariables = Object.keys(variableData).length;
    const totalAssets = assets.length;
    const aiEvents = engineLogs.filter(l => l.source.includes('Agent') || l.source.includes('Nexus')).length;
    const storageEstimates = ((totalEntities * 2) + (totalAssets * 15)).toFixed(1); // Mock size calc based on count

    const stats = [
        { label: 'Total Entities', value: totalEntities.toString(), color: 'cyan' },
        { label: 'Synced Variables', value: activeVariables.toString(), color: 'emerald' },
        { label: 'Schema Version', value: 'v4.2.0', color: 'purple' },
        { label: 'Est. Memory', value: `${storageEstimates} KB`, color: 'orange' }
    ];

    const entities = [
        { name: 'scene_objects', count: totalEntities, lastUpdate: 'Live Sync', icon: Box, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        { name: 'game_assets', count: totalAssets, lastUpdate: 'Live Sync', icon: Layers, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { name: 'ai_logs', count: aiEvents, lastUpdate: 'Stream', icon: Cpu, color: 'text-pink-400', bg: 'bg-pink-500/10' },
        { name: 'global_vars', count: activeVariables, lastUpdate: 'State', icon: Key, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
    ];

    return (
        <div className="h-full flex flex-col bg-[#050a15] p-6 overflow-y-auto custom-scrollbar">
            <div className="mb-8">
                <h1 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                    <Database className="w-7 h-7 text-orange-400" />
                    Persistence Plane
                </h1>
                <p className="text-slate-400 text-xs mt-1">InstantDB Real-time Data Explorer & Schema Audit</p>
            </div>

            <div className="grid grid-cols-4 gap-6 mb-8">
                {stats.map(s => (
                    <div key={s.label} className="bg-black/40 border border-white/5 p-5 rounded-2xl">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{s.label}</div>
                        <div className={`text-2xl font-black text-${s.color}-400`}>{s.value}</div>
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Table className="w-4 h-4" />
                    Entity Metadata
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    {entities.map(e => (
                        <div key={e.name} className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg ${e.bg} ${e.color} flex items-center justify-center`}>
                                    <e.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white capitalize">{e.name.replace('_', ' ')}</div>
                                    <div className="text-[10px] text-slate-500">{e.count} records indexed</div>
                                </div>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono italic">Last Commit: {e.lastUpdate}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Live Variable State</h3>
                <div className="bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-xs text-slate-400 overflow-x-auto">
                    {activeVariables > 0 ? (
                        <pre>{JSON.stringify(variableData, null, 2)}</pre>
                    ) : (
                        <span className="italic opacity-50">No global variables active.</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Persistence;
