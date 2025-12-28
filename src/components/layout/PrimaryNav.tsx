
import React from 'react';
import {
    Code2, Box, Library, Settings, Activity,
    Hammer, Blocks, Bot, Globe, Database,
    Users, Ship, LayoutDashboard, Zap, Search,
    Sparkles, Cpu
} from 'lucide-react';
import { ActiveView, NavItem } from '../../types';
import { UIActionDispatcher } from '../../ui/ui-actions';
import { nexusBus } from '../../services/nexusCommandBus';
import { localBridgeClient } from '../../services/localBridgeService';

interface PrimaryNavProps {
    activeView: ActiveView;
    dispatch: UIActionDispatcher;
}

export const PrimaryNav: React.FC<PrimaryNavProps> = ({ activeView, dispatch }) => {
    const [jobs, setJobs] = React.useState(nexusBus.getJobs());
    const [bridge, setBridge] = React.useState(localBridgeClient.getStatus());

    React.useEffect(() => {
        const unsubBus = nexusBus.subscribe(() => setJobs(nexusBus.getJobs()));
        const unsubBridge = localBridgeClient.onStatusChange((s) => setBridge(s));
        return () => { unsubBus(); unsubBridge(); };
    }, []);

    const navItems: { id: ActiveView, label: string, icon: any }[] = [
        { id: 'editor', label: 'SOURCE EDITOR', icon: Code2 },
        { id: 'scene', label: 'MATRIX RUNTIME', icon: Box },
        { id: 'forge', label: 'CREATION FORGE', icon: Hammer },
        { id: 'pipelines', label: 'N8N PIPELINES', icon: Blocks },
        { id: 'behavior', label: 'AGENT BEHAVIOR', icon: Bot },
        { id: 'narrative', label: 'NARRATIVE SYNTH', icon: Search },
        { id: 'world', label: 'WORLD GEN', icon: Globe },
        { id: 'persistence', label: 'DATA PERSISTENCE', icon: Database },
        { id: 'collab', label: 'NEURAL LINK', icon: Users },
        { id: 'deploy', label: 'SHIP / DEPLOY', icon: Ship },
        { id: 'shader', label: 'SHADER LAB', icon: Zap },
        { id: 'matrix', label: 'ORACLE WHISPERS', icon: Sparkles },
        { id: 'assets', label: 'REGISTRY', icon: Library },
        { id: 'limbs', label: 'NEURAL LIMBS', icon: Cpu },
        { id: 'console', label: 'SYSTEM CONSOLE', icon: Activity },
        { id: 'settings', label: 'CONFIG', icon: Settings },
    ];

    const isSystemActive = jobs.length > 0;

    return (
        <div className="w-16 bg-[#0a1222] border-r border-cyan-500/10 flex flex-col items-center py-4 gap-2 shrink-0 z-40 overflow-y-auto overflow-x-hidden scrollbar-hide select-none transition-all">
            <div className="relative mb-4">
                <div className={`w-2 h-2 rounded-full ${isSystemActive ? 'bg-cyan-500 animate-pulse shadow-[0_0_10px_#00f2ff]' : 'bg-slate-800'}`}></div>
            </div>

            {navItems.map(item => {
                const isActiveJob = jobs.some(j => j.description.toLowerCase().includes(item.id));
                const isBridgeAlert = item.id === 'assets' && !bridge.isConnected;

                return (
                    <button
                        key={item.id}
                        onClick={() => dispatch({ type: 'NAV_SWITCH_VIEW', view: item.id })}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative nexus-btn ${activeView === item.id ? 'bg-cyan-500/10 text-cyan-400 nexus-nav-active' : 'text-slate-600 hover:text-white hover:bg-white/5'}`}
                        title={item.label}
                    >
                        <item.icon className={`w-5 h-5 ${isActiveJob ? 'text-purple-400 animate-pulse' : ''} ${isBridgeAlert ? 'text-red-500 animate-bounce' : ''}`} />

                        {/* Selected Indicator */}
                        {activeView === item.id && <div className="absolute left-0 w-1 h-6 bg-cyan-500 rounded-r-full shadow-[0_0_10px_#00f2ff]"></div>}

                        {/* Activity Pulsar */}
                        {(isActiveJob || isBridgeAlert) && (
                            <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${isBridgeAlert ? 'bg-red-500' : 'bg-purple-500 shadow-[0_0_5px_#a855f7]'}`}></div>
                        )}

                        <div className="absolute left-full ml-4 px-2 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap border border-white/10 shadow-xl">
                            {item.label}
                            {isActiveJob && <span className="ml-2 text-purple-400 text-[8px] animate-pulse">● ACTIVE</span>}
                            {isBridgeAlert && <span className="ml-2 text-red-500 text-[8px]">● OFFLINE</span>}
                        </div>
                    </button>
                );
            })}
        </div>
    );
};
