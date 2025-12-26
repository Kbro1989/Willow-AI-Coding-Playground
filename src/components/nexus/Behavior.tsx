import React, { useState } from 'react';
import BehaviorTreeEditor from '../BehaviorTreeEditor';
import { behaviorSynthesis } from '../../services/behaviorSynthesisService';
import { Bot, Zap, History, Database, Cpu, Brain, Sparkles, MessageSquare } from 'lucide-react';

const Behavior: React.FC = () => {
    const [activeTree, setActiveTree] = useState<any[]>([]);
    const [isRefactoring, setIsRefactoring] = useState(false);
    const [goal, setGoal] = useState('');
    const [rationale, setRationale] = useState<string | null>(null);

    const handleRefactor = async () => {
        if (!goal.trim()) return;
        setIsRefactoring(true);
        setRationale(null);
        try {
            const result = await behaviorSynthesis.refactorTree(activeTree, goal);
            setActiveTree(result.suggestedTree);
            setRationale(result.rationale);
        } catch (error) {
            console.error('[BEHAVIOR] Refactor error:', error);
        } finally {
            setIsRefactoring(false);
        }
    };

    return (
        <div className="h-full flex bg-[#050a15] text-cyan-50 font-mono">
            {/* Main Visual Editor Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                <BehaviorTreeEditor
                    onSave={setActiveTree}
                    onDebug={(id) => console.log(`[BEHAVIOR] Debugging node: ${id}`)}
                />
            </div>

            {/* Behavior Synthesis Sidebar */}
            <div className="w-96 border-l border-purple-500/10 bg-black/40 flex flex-col">
                <div className="p-4 border-b border-purple-500/10 bg-black/20 flex items-center justify-between">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-purple-400 flex items-center gap-2">
                        <Brain className="w-3 h-3" />
                        Logic Synthesis
                    </h2>
                    <span className="text-[10px] font-black text-slate-500 uppercase">Status: <span className="text-purple-500">Neural Sync</span></span>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            AI Directive Optimizer
                        </div>
                        <div className="p-4 bg-purple-950/10 border border-purple-500/20 rounded-2xl space-y-4">
                            <div className="text-[9px] text-purple-400 font-bold uppercase">Behavioral Objective</div>
                            <textarea
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                placeholder="Describe the desired behavior logic... (e.g. Optimize combat avoidance if health is below 20%)"
                                className="w-full bg-black/40 border border-purple-500/20 rounded-xl p-3 text-xs text-purple-50 focus:outline-none focus:border-purple-500/50 min-h-[100px]"
                            />
                            <button
                                onClick={handleRefactor}
                                disabled={isRefactoring || !goal.trim()}
                                className="w-full py-3 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isRefactoring ? (
                                    <>
                                        <Cpu className="w-4 h-4 animate-spin" />
                                        Refactoring Logic...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4" />
                                        Optimize Behavior Tree
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {rationale && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom duration-500">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <MessageSquare className="w-3 h-3" />
                                Architect Rationale
                            </h3>
                            <div className="p-4 text-[11px] text-slate-300 leading-relaxed border border-white/5 rounded-2xl bg-white/2 italic">
                                {rationale}
                            </div>
                        </div>
                    ) || (
                            <div className="h-40 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 opacity-20">
                                <History className="w-6 h-6" />
                                <span className="text-[9px] uppercase font-black">History Trace Awaiting Data</span>
                            </div>
                        )}

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <Database className="w-3 h-3" />
                            Entity Registry Sync
                        </h3>
                        <div className="space-y-2">
                            <EntityStatusItem name="follower_bot_01" status="IDLE" />
                            <EntityStatusItem name="player_proxy" status="ACTIVE" />
                            <EntityStatusItem name="environmental_controller" status="SLEEP" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const EntityStatusItem = ({ name, status }: { name: string, status: string }) => (
    <div className="px-3 py-2 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between group hover:border-cyan-500/20 transition-all">
        <span className="text-[9px] font-black text-slate-300 group-hover:text-white transition-colors">{name}</span>
        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
            {status}
        </span>
    </div>
);

export default Behavior;
