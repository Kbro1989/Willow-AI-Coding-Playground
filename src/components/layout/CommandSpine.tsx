
import React from 'react';
import {
    Blocks, ChevronDown, Search, Undo2, Redo2, Cpu, Bell, ShieldAlert, Brain
} from 'lucide-react';
import { ProjectEnv, AIModelMode, AIIntent } from '../../types';
import { localBridgeClient } from '../../services/localBridgeService';
import { Network, Link2, Link2Off } from 'lucide-react';
import { UIActionDispatcher } from '../../ui/ui-actions';

interface CommandSpineProps {
    projectEnv: ProjectEnv;
    aiMode: AIModelMode;
    activeView: string;
    showPerformanceHUD: boolean;
    isAiPanelVisible: boolean;
    isPanic: boolean;
    dispatch: UIActionDispatcher;
}

export const CommandSpine: React.FC<CommandSpineProps> = ({
    projectEnv, aiMode, activeView, showPerformanceHUD, isAiPanelVisible, isPanic, dispatch
}) => {
    const [searchValue, setSearchValue] = React.useState('');
    const [isSearching, setIsSearching] = React.useState(false);
    const [isPulsing, setIsPulsing] = React.useState(false);

    const [bridgeStatus, setBridgeStatus] = React.useState(localBridgeClient.getStatus());

    React.useEffect(() => {
        let unsubBus: (() => void) | undefined;

        import('../../services/nexusCommandBus').then(({ nexusBus }) => {
            unsubBus = nexusBus.subscribe(() => {
                setIsPulsing(true);
                setTimeout(() => setIsPulsing(false), 800);
            });
        });

        const unsubBridge = localBridgeClient.onStatusChange(s => setBridgeStatus({ ...s, syncMode: localBridgeClient.getStatus().syncMode }));

        return () => {
            if (unsubBus) unsubBus();
            unsubBridge();
        };
    }, []);

    const placeholderMap: Record<AIModelMode, string> = {
        assist: 'ASK / SEARCH / COMMAND',
        refactor: 'DESCRIBE CHANGE TO APPLY',
        explain: 'WHAT SHOULD I EXPLAIN?',
        generate: 'WHAT SHOULD I CREATE?',
        lockdown: 'AUDIT / VERIFY / HARDEN'
    };

    const handleSearch = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && searchValue.trim()) {
            setIsSearching(true);
            try {
                let verb: AIIntent['verb'] = 'search';
                let text = searchValue.trim();

                // Prefix detection
                if (text.startsWith('/refactor ')) {
                    verb = 'refactor';
                    text = text.replace('/refactor ', '');
                } else if (text.startsWith('/explain ')) {
                    verb = 'explain';
                    text = text.replace('/explain ', '');
                } else if (text.startsWith('/generate ')) {
                    verb = 'generate';
                    text = text.replace('/generate ', '');
                } else if (text.startsWith('/audit ')) {
                    verb = 'audit';
                    text = text.replace('/audit ', '');
                } else if (text.startsWith('/sprint ')) {
                    verb = 'sprint';
                    text = text.replace('/sprint ', '');
                } else {
                    // Default verb mapping based on current AI Mode
                    const modeVerbMap: Record<AIModelMode, AIIntent['verb']> = {
                        assist: 'search',
                        refactor: 'refactor',
                        explain: 'explain',
                        generate: 'generate',
                        lockdown: 'audit'
                    };
                    verb = modeVerbMap[aiMode] || 'search';
                }

                const { universalOrchestrator } = await import('../../services/ai/universalOrchestrator');
                await universalOrchestrator.dispatchIntent({
                    source: 'omnibar',
                    verb,
                    payload: { text },
                    context: {
                        aiMode,
                        projectEnv,
                        bridgeStatus: bridgeStatus.isConnected ? 'direct' : 'offline',
                        panic: isPanic,
                        view: activeView as any
                    }
                });
                setSearchValue('');
            } catch (err) {
                console.error('[OMNI_BAR] Dispatch failed:', err);
            } finally {
                setIsSearching(false);
            }
        }
    };

    const projectEnvs: ProjectEnv[] = ['local', 'cloud', 'hybrid'];
    const aiModes: AIModelMode[] = ['assist', 'refactor', 'explain', 'generate', 'lockdown'];

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
                    {projectEnvs.map(env => (
                        <button key={env} onClick={() => dispatch({ type: 'ENV_SET_PROJECT_ENV', env })} className={`px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all nexus-btn ${projectEnv === env ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                            {env}
                        </button>
                    ))}
                </div>
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 gap-1">
                    {aiModes.map(mode => (
                        <button key={mode} onClick={() => dispatch({ type: 'AI_SET_MODE', mode })} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all nexus-btn ${aiMode === mode ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'text-slate-600 hover:text-white hover:bg-white/5'}`}>
                            {mode}
                        </button>
                    ))}
                </div>
                <div className="h-8 w-px bg-white/5" />
                <button
                    onClick={() => dispatch({ type: 'BRIDGE_TOGGLE_RELAY' })}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${bridgeStatus.isConnected
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'bg-red-500/10 border-red-500/50 text-red-500'
                        }`}
                >
                    {bridgeStatus.isConnected ? <Link2 className="w-3.5 h-3.5" /> : <Link2Off className="w-3.5 h-3.5" />}
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        Neural Link: {bridgeStatus.isConnected ? (localStorage.getItem('antigravity_bridge_url')?.includes('workers.dev') ? 'RELAY' : 'DIRECT') : 'OFFLINE'}
                    </span>
                </button>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative group">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isSearching ? 'text-cyan-400 animate-spin' : 'text-slate-500'}`} />
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyDown={handleSearch}
                        placeholder={isSearching ? `INTENT: SEARCH | MODE: ${aiMode.toUpperCase()} | ENV: ${projectEnv.toUpperCase()}` : placeholderMap[aiMode]}
                        className="bg-black/40 border border-white/5 rounded-xl py-1.5 pl-9 pr-4 text-[10px] font-black tracking-widest text-white focus:outline-none focus:border-cyan-500/50 min-w-[300px] nexus-glass"
                    />
                </div>
                <div className="flex gap-2">
                    <Undo2 className="w-4 h-4 text-slate-500 hover:text-white cursor-pointer" />
                    <Redo2 className="w-4 h-4 text-slate-500 hover:text-white cursor-pointer" />
                </div>
                <div className="h-8 w-px bg-white/5" />
                <div className="flex items-center gap-3">
                    <button onClick={() => dispatch({ type: 'SYSTEM_TOGGLE_PERFORMANCE_HUD' })} className={`p-2 rounded-xl transition-all ${showPerformanceHUD ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-500 hover:bg-white/5'}`}>
                        <Cpu className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => dispatch({ type: 'SYSTEM_TOGGLE_AI_PANEL' })}
                        className={`p-2 rounded-xl transition-all relative ${isAiPanelVisible ? 'bg-purple-500/10 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'text-slate-500 hover:bg-white/5'}`}
                        title="Toggle Cognitive Sidebar"
                    >
                        <Brain className={`w-4 h-4 transition-all duration-300 ${isPulsing ? 'scale-125 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : ''}`} />
                        {isPulsing && <div className="absolute inset-0 bg-purple-500/20 rounded-xl animate-ping" />}
                    </button>
                    <Bell className="w-4 h-4 text-slate-500 hover:text-white" />
                    <button onClick={() => dispatch({ type: 'SYSTEM_PANIC' })} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isPanic ? 'bg-red-500 text-white animate-bounce' : 'bg-red-900/20 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white'}`}>
                        PANIC (KILL)
                    </button>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-purple-600 border border-white/10 flex items-center justify-center text-[10px] font-black text-white">OP</div>
            </div>
        </div >
    );
};
