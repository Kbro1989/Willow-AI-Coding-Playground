import React, { useState, useEffect } from 'react';
import { directorMemory, MemoryEntry } from '../../services/directorMemoryService';
import { sessionService, SessionMetrics } from '../../services/sessionService';
import { logTask } from '../../services/loggingService';
import { Brain, Database, Shield, Zap, Info, Plus, Trash2, Activity } from 'lucide-react';

const Director: React.FC = () => {
    const [memories, setMemories] = useState<MemoryEntry[]>([]);
    const [metrics, setMetrics] = useState<SessionMetrics>(sessionService.getMetrics());
    const [newGuidance, setNewGuidance] = useState('');

    useEffect(() => {
        // Hydrate from service
        const loadMemories = () => {
            const current = directorMemory.getAll();
            if (current.length === 0) {
                // Init defaults if empty
                directorMemory.addMemory("Nexus Execution Doctrine v1.2: Stabilize Control Plane.", 'project', 1.0);
                directorMemory.addMemory("System initialized. Monitoring session telemetry.", 'session', 0.5);
                setMemories(directorMemory.getAll());
            } else {
                setMemories(current);
            }
        };

        loadMemories();
        const unsubSession = sessionService.subscribe(setMetrics);
        // Poll for memory updates (simple approach for now)
        const interval = setInterval(() => setMemories(directorMemory.getAll()), 2000);

        return () => {
            unsubSession();
            clearInterval(interval);
        };
    }, []);

    const addGuidance = async () => {
        if (!newGuidance.trim()) return;
        await directorMemory.addMemory(newGuidance, 'project', 1.0, ['guidance']);
        setNewGuidance('');
        setMemories(directorMemory.getAll());
    };

    const handleDelete = (id: string) => {
        directorMemory.removeMemory(id);
        setMemories(directorMemory.getAll());
    };

    const handleAudit = async () => {
        await logTask({
            taskId: 'manual-audit',
            step: 'DIRECTOR_TRIGGERED',
            status: 'success',
            timestamp: Date.now(),
            metadata: { metrics }
        });
        alert('Global Audit Logged to Nexus Control Plane.'); // Visual feedback
    };

    return (
        <div className="h-full flex flex-col bg-[#050a15] text-cyan-50 font-mono">
            {/* Header / Session HUD */}
            <div className="p-6 border-b border-cyan-500/10 flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20">
                        <Brain className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-[0.3em] text-white">Director Core</h1>
                        <div className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest flex items-center gap-2">
                            <Shield className="w-3 h-3" />
                            Session Overwatch Active
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <HudStat label="Tokens" value={metrics.totalTokens.toLocaleString()} icon={<Zap className="w-3 h-3" />} />
                    <HudStat label="Cost" value={`$${metrics.totalCost.toFixed(3)}`} icon={<Activity className="w-3 h-3" />} color="text-emerald-400" />
                    <HudStat label="Requests" value={metrics.requestCount.toString()} icon={<Database className="w-3 h-3" />} />
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Memory Registry */}
                <div className="w-2/3 border-r border-cyan-500/10 flex flex-col">
                    <div className="p-4 border-b border-cyan-500/10 flex items-center justify-between bg-black/10">
                        <h2 className="text-xs font-black uppercase tracking-widest text-cyan-500 flex items-center gap-2">
                            <Database className="w-3 h-3" />
                            Nexus Memory Registry
                        </h2>
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] text-slate-500 uppercase">Context Injection: ON</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        <div className="p-4 bg-cyan-950/10 border border-cyan-500/20 rounded-2xl">
                            <h3 className="text-[10px] uppercase font-black text-cyan-400 mb-4 flex items-center gap-2">
                                <Plus className="w-3 h-3" />
                                Inject Project Guidance (Permanent)
                            </h3>
                            <div className="flex gap-3">
                                <input
                                    value={newGuidance}
                                    onChange={(e) => setNewGuidance(e.target.value)}
                                    placeholder="e.g. Always use functional patterns for 3D shaders..."
                                    className="flex-1 bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-2 text-sm text-cyan-100 placeholder:text-cyan-900 focus:outline-none focus:border-cyan-400"
                                />
                                <button onClick={addGuidance} className="bg-cyan-500 text-black px-6 py-2 rounded-xl text-xs font-black uppercase hover:bg-cyan-400 transition-colors">
                                    Inject
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {memories.map(mem => (
                                <MemoryItem
                                    key={mem.id}
                                    id={mem.id}
                                    scope={mem.scope}
                                    content={mem.content}
                                    importance={mem.importance}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Controller States */}
                <div className="w-1/3 bg-black/20 p-6 space-y-8 overflow-y-auto">
                    <div>
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <Zap className="w-3 h-3" />
                            Active Orchestrators
                        </h2>
                        <div className="space-y-2">
                            <OrchestratorItem name="TaskClassifier" status="standby" />
                            <OrchestratorItem name="VibeRunner" status="ready" />
                            <OrchestratorItem name="TokenLimiter" status="monitoring" />
                        </div>
                    </div>

                    <div className="p-6 bg-cyan-950/20 border border-cyan-500/20 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                            <Brain className="w-16 h-16 text-cyan-400" />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase mb-2">Autonomous Reflection</h3>
                        <p className="text-[11px] text-cyan-300 leading-relaxed mb-4">
                            Director is analyzing current system telemetry. No anomalies detected in current execution trace.
                        </p>
                        <button onClick={handleAudit} className="w-full py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-[10px] font-black uppercase text-cyan-400 hover:bg-cyan-500/20 transition-all active:scale-95">
                            Trigger Global Audit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const HudStat = ({ label, value, icon, color = 'text-cyan-400' }: { label: string, value: string, icon: React.ReactNode, color?: string }) => (
    <div className="px-4 py-2 bg-black/40 border border-white/5 rounded-xl flex items-center gap-3">
        <div className={`p-1.5 rounded-lg bg-white/5 ${color}`}>{icon}</div>
        <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-widest text-slate-500 font-black">{label}</span>
            <span className="text-xs font-black text-white tracking-tighter">{value}</span>
        </div>
    </div>
);

const MemoryItem = ({ id, scope, content, importance, onDelete }: { id: string, scope: string, content: string, importance: number, onDelete: (id: string) => void }) => (
    <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-start gap-4 hover:border-cyan-500/20 transition-all group">
        <div className={`mt-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${scope === 'project' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
            {scope}
        </div>
        <div className="flex-1">
            <p className="text-xs text-slate-300 leading-relaxed">{content}</p>
            <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 h-0.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500/40" style={{ width: `${importance * 100}%` }}></div>
                </div>
                <span className="text-[9px] text-slate-600 font-bold">Imp: {importance.toFixed(1)}</span>
            </div>
        </div>
        <button onClick={() => onDelete(id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-red-500 transition-all">
            <Trash2 className="w-3 h-3" />
        </button>
    </div>
);

const OrchestratorItem = ({ name, status }: { name: string, status: string }) => (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{name}</span>
        <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${status === 'ready' || status === 'monitoring' ? 'bg-emerald-500 animate-pulse' : 'bg-cyan-500'}`}></div>
            <span className="text-[9px] text-slate-500 uppercase font-bold">{status}</span>
        </div>
    </div>
);

export default Director;
