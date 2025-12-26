import React from 'react';
import { Database, Table, Key, Filter } from 'lucide-react';

const Persistence: React.FC = () => {
    const stats = [
        { label: 'Total Entities', value: '4,281', color: 'cyan' },
        { label: 'Active Links', value: '12', color: 'emerald' },
        { label: 'Schema Version', value: 'v1.0.4', color: 'purple' },
        { label: 'Storage Usage', value: '12.4 MB', color: 'orange' }
    ];

    const entities = [
        { name: 'characters', count: 124, lastUpdate: '2m ago' },
        { name: 'assets', count: 3280, lastUpdate: '10s ago' },
        { name: 'aiUsage', count: 852, lastUpdate: 'Just now' },
        { name: 'events', count: 25, lastUpdate: '1h ago' }
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
                                <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                                    <Key className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white capitalize">{e.name}</div>
                                    <div className="text-[10px] text-slate-500">{e.count} records indexed</div>
                                </div>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono italic">Last Commit: {e.lastUpdate}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Persistence;
