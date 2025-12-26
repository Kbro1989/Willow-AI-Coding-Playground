
import React from 'react';
import {
    LayoutDashboard, Brain, Code2, Box, Hammer, Blocks,
    Bot, Library, Globe, Database, Users, Activity,
    Ship, Settings, Zap, PenTool
} from 'lucide-react';
import { ActiveView } from '../../types';

interface PrimaryNavProps {
    activeView: ActiveView;
    setActiveView: (view: ActiveView) => void;
}

export const PrimaryNav: React.FC<PrimaryNavProps> = ({ activeView, setActiveView }) => {
    const navItems: { id: ActiveView; label: string; icon: any; category: string }[] = [
        { id: 'dashboard', label: 'SYSTEM Overview', icon: LayoutDashboard, category: 'Main' },
        { id: 'director', label: 'AI DIRECTOR', icon: Brain, category: 'Main' },
        { id: 'editor', label: 'SOURCE EDITOR', icon: Code2, category: 'Main' },
        { id: 'matrix', label: 'MATRIX RUNTIME', icon: Box, category: 'Main' },
        { id: 'forge', label: 'NEURAL FORGE', icon: Hammer, category: 'Creative' },
        { id: 'pipelines', label: 'AUTOMATION', icon: Blocks, category: 'Creative' },
        { id: 'behavior', label: 'LOGIC TREES', icon: Bot, category: 'Creative' },
        { id: 'narrative', label: 'NARRATIVE', icon: PenTool, category: 'Creative' },
        { id: 'assets', label: 'REGISTRY', icon: Library, category: 'Assets' },
        { id: 'world', label: 'WORLD GEN', icon: Globe, category: 'Assets' },
        { id: 'data', label: 'PERSISTENCE', icon: Database, category: 'Data' },
        { id: 'collab', label: 'MULTI-LINK', icon: Users, category: 'Collab' },
        { id: 'diagnostics', label: 'TRACING', icon: Activity, category: 'Audit' },
        { id: 'deploy', label: 'SHIPPER', icon: Ship, category: 'Audit' },
        { id: 'settings', label: 'CONFIG', icon: Settings, category: 'Config' },
    ];

    return (
        <div className="w-16 bg-[#0a1222] border-r border-cyan-500/10 flex flex-col items-center py-4 gap-4 shrink-0 z-40">
            <Zap className="w-6 h-6 text-cyan-400 mb-4 animate-pulse" fill="currentColor" />
            {navItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative nexus-btn ${activeView === item.id ? 'bg-cyan-500/10 text-cyan-400 nexus-nav-active' : 'text-slate-600 hover:text-white hover:bg-white/5'}`}
                    title={item.label}
                >
                    <item.icon className="w-5 h-5" />
                    {activeView === item.id && <div className="absolute left-0 w-1 h-6 bg-cyan-500 rounded-r-full shadow-[0_0_10px_#00f2ff]"></div>}
                    <div className="absolute left-full ml-4 px-2 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap border border-white/10 shadow-xl">
                        {item.label}
                    </div>
                </button>
            ))}
        </div>
    );
};
