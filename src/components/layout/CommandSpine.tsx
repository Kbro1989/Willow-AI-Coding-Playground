
import React from 'react';
import {
    Blocks, ChevronDown, Search, Undo2, Redo2, Cpu, Bell, ShieldAlert
} from 'lucide-react';
import { ProjectEnv, AIModelMode } from '../../types';

interface CommandSpineProps {
    projectEnv: ProjectEnv;
    setProjectEnv: (env: ProjectEnv) => void;
    aiMode: AIModelMode;
    setAiMode: (mode: AIModelMode) => void;
    showPerformanceHUD: boolean;
    setShowPerformanceHUD: (show: boolean) => void;
    isPanic: boolean;
    onPanic: () => void;
}

export const CommandSpine: React.FC<CommandSpineProps> = ({
    projectEnv, setProjectEnv, aiMode, setAiMode,
    showPerformanceHUD, setShowPerformanceHUD, isPanic, onPanic
}) => {
    return (
        <div className="h-14 bg-[#0a1222] border-b border-cyan-500/20 flex items-center justify-between px-4 shrink-0 z-50 shadow-2xl">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 px-3 py-1.5 bg-black/40 border border-white/5 rounded-xl cursor-not-allowed group">
                    <Blocks className="w-4 h-4 text-cyan-400" />
                    <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none">Nexus Cluster</span>
                        <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">ANTIGRAVITY v4.2 PRO</span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-600" />
                </div>
                <div className="h-8 w-px bg-white/5" />
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 gap-1">
                    {(['dev', 'prod'] as ProjectEnv[]).map(env => (
                        <button key={env} onClick={() => setProjectEnv(env)} className={`px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${projectEnv === env ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'text-slate-500 hover:text-white'}`}>
                            {env}
                        </button>
                    ))}
                </div>
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 gap-1">
                    {(['assist', 'co-pilot', 'autonomous'] as AIModelMode[]).map(mode => (
                        <button key={mode} onClick={() => setAiMode(mode)} className={`px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${aiMode === mode ? 'bg-purple-500 text-white' : 'text-slate-500 hover:text-white'}`}>
                            {mode}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input type="text" placeholder="CMD+K SEARCH" className="bg-black/40 border border-white/5 rounded-xl py-1.5 pl-9 pr-4 text-[10px] font-black tracking-widest text-white focus:outline-none focus:border-cyan-500/50" />
                </div>
                <div className="flex gap-2">
                    <Undo2 className="w-4 h-4 text-slate-500 hover:text-white cursor-pointer" />
                    <Redo2 className="w-4 h-4 text-slate-500 hover:text-white cursor-pointer" />
                </div>
                <div className="h-8 w-px bg-white/5" />
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowPerformanceHUD(!showPerformanceHUD)} className={`p-2 rounded-xl transition-all ${showPerformanceHUD ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-500 hover:bg-white/5'}`}>
                        <Cpu className="w-4 h-4" />
                    </button>
                    <Bell className="w-4 h-4 text-slate-500 hover:text-white" />
                    <button onClick={onPanic} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isPanic ? 'bg-red-500 text-white animate-bounce' : 'bg-red-900/20 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white'}`}>
                        PANIC (KILL)
                    </button>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-purple-600 border border-white/10 flex items-center justify-center text-[10px] font-black text-white">OP</div>
            </div>
        </div>
    );
};
