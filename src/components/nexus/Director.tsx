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

    const handleStressTest = async () => {
        const { diagnosticService } = await import('../../services/diagnosticService');
        const results = await diagnosticService.runStressTest(5);
        alert(`Stress Test Complete: ${results.success}/${results.total} flows verified.`);
        setMemories(directorMemory.getAll());
    };

    return (
        <div className="h-full flex flex-col bg-[#050a15] text-cyan-50 font-mono relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 blur-[120px] pointer-events-none" />

            {/* Header / Session HUD */}
            <div className="p-6 border-b border-cyan-500/10 flex items-center justify-between bg-black/40 backdrop-blur-xl z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/20 nexus-glass shadow-[0_0_20px_rgba(0,242,255,0.1)]">
                        <Brain className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-[0.3em] text-white text-glow-cyan">Director Core</h1>
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

            <div className="flex-1 flex overflow-hidden z-10">
                {/* Left: Memory Registry */}
                <div className="w-2/3 border-r border-cyan-500/10 flex flex-col bg-black/10">
                    <div className="p-4 border-b border-cyan-500/10 flex items-center justify-between bg-black/20 backdrop-blur-md">
                        <h2 className="text-xs font-black uppercase tracking-widest text-cyan-500 flex items-center gap-2">
                            <Database className="w-3 h-3" />
                            Nexus Memory Registry
                        </h2>
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] text-slate-500 uppercase font-bold">Context Injection: ON</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                        <div className="p-5 bg-cyan-950/10 border border-cyan-500/20 rounded-3xl nexus-glass">
                            <h3 className="text-[10px] uppercase font-black text-cyan-400 mb-4 flex items-center gap-2">
                                <Plus className="w-3 h-3" />
                                Inject Project Guidance (Permanent)
                            </h3>
                            <div className="flex gap-3">
                                <input
                                    value={newGuidance}
                                    onChange={(e) => setNewGuidance(e.target.value)}
                                    placeholder="e.g. Always use functional patterns for 3D shaders..."
                                    className="flex-1 nexus-input bg-black/60"
                                />
                                <button onClick={addGuidance} className="nexus-btn-primary px-8 py-2 text-xs font-black uppercase tracking-widest rounded-xl">
                                    Inject
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {memories.map(mem => (
                                <MemoryItem
                                    key={mem.id}
                                    id={mem.id}
                                    scope={mem.scope}
                                    content={mem.content}
                                    importance={mem.importance}
                                    tags={mem.tags}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Controller States */}
                <div className="w-1/3 bg-black/30 p-6 space-y-8 overflow-y-auto backdrop-blur-md">
                    <div>
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <Zap className="w-3 h-3" />
                            Active Orchestrators
                        </h2>
                        <div className="space-y-3">
                            <OrchestratorItem name="TaskClassifier" status="standby" />
                            <OrchestratorItem name="VibeRunner" status="ready" />
                            <OrchestratorItem name="TokenLimiter" status="monitoring" />
                        </div>
                    </div>

                    <div className="p-8 bg-cyan-950/20 border border-cyan-500/20 rounded-3xl relative overflow-hidden group nexus-glass shadow-2xl">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                            <Brain className="w-20 h-20 text-cyan-400" />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase mb-3 tracking-widest">Autonomous Reflection</h3>
                        <p className="text-[11px] text-cyan-300/80 leading-relaxed mb-6 font-medium">
                            Director is analyzing current system telemetry. Current state indicates high coherence across all creative nodes.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={handleAudit} className="nexus-btn-primary py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl">
                                Trigger Audit
                            </button>
                            <button onClick={handleStressTest} className="nexus-btn-accent py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl">
                                Stress Test
                            </button>
                        </div>
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

const MemoryItem = ({ id, scope, content, importance, tags, onDelete }: { id: string, scope: string, content: string, importance: number, tags?: string[], onDelete: (id: string) => void }) => (
    <div className="p-5 bg-black/40 border border-white/5 rounded-2xl flex items-start gap-5 hover:border-cyan-500/30 transition-all group nexus-glass shadow-lg">
        <div className={`mt-1 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] shadow-sm ${scope === 'project' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
            {scope}
        </div>
        <div className="flex-1">
            <p className="text-xs text-slate-200 leading-relaxed font-medium">{content}</p>
            {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                    {tags.map(t => <span key={t} className="text-[7px] bg-white/5 text-slate-500 px-1.5 py-0.5 rounded-md uppercase font-bold border border-white/5">{t}</span>)}
                </div>
            )}
            <div className="flex items-center gap-4 mt-4">
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500/30 shadow-[0_0_10px_rgba(0,242,255,0.2)]" style={{ width: `${importance * 100}%` }}></div>
                </div>
                <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Weight: {importance.toFixed(1)}</span>
            </div>
        </div>
        <button onClick={() => onDelete(id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-red-500 transition-all rounded-lg hover:bg-red-500/10">
            <Trash2 className="w-4 h-4" />
        </button>
    </div>
);

const OrchestratorItem = ({ name, status }: { name: string, status: string }) => (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group nexus-glass">
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-white transition-colors">{name}</span>
        <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${status === 'ready' || status === 'monitoring' ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]' : 'bg-cyan-500 shadow-[0_0_10px_#00f2ff]'}`}></div>
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">{status}</span>
        </div>
    </div>
);

export default Director;
