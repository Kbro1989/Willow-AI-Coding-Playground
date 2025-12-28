import React, { useState, useCallback } from 'react';
import {
    Plus,
    X,
    Terminal,
    LayoutDashboard,
    Brain,
    Monitor,
    ShieldAlert,
    Zap,
    MessageSquare,
    Box,
    Hammer
} from 'lucide-react';
import { UIActionDispatcher } from '../../ui/ui-actions';
import { ActiveView } from '../../types';

interface NexusControlProps {
    dispatch: UIActionDispatcher;
    activeView: ActiveView;
}

interface BubbleAction {
    id: string;
    icon: React.ReactNode;
    label: string;
    color: string;
    onClick: () => void;
}

const NexusControl: React.FC<NexusControlProps> = ({ dispatch, activeView }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpanded = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    const handleAction = useCallback((action: () => void) => {
        action();
        setIsExpanded(false);
    }, []);

    const actions: BubbleAction[] = [
        {
            id: 'panic',
            icon: <ShieldAlert className="w-5 h-5" />,
            label: 'CORE PANIC',
            color: 'bg-red-500 shadow-red-500/50',
            onClick: () => dispatch({ type: 'SYSTEM_PANIC' })
        },
        {
            id: 'chat',
            icon: <MessageSquare className="w-5 h-5" />,
            label: 'AI COMPANION',
            color: 'bg-purple-500 shadow-purple-500/50',
            onClick: () => dispatch({ type: 'SYSTEM_TOGGLE_AI_PANEL' })
        },
        {
            id: 'console',
            icon: <Terminal className="w-5 h-5" />,
            label: 'NEURAL CONSOLE',
            color: 'bg-slate-700 shadow-slate-900/50',
            onClick: () => dispatch({ type: 'NAV_SWITCH_VIEW', view: 'console' })
        },
        {
            id: 'forge',
            icon: <Hammer className="w-5 h-5" />,
            label: 'MEDIA FORGE',
            color: 'bg-cyan-600 shadow-cyan-500/50',
            onClick: () => dispatch({ type: 'NAV_SWITCH_VIEW', view: 'forge' })
        },
        {
            id: 'scene',
            icon: <Box className="w-5 h-5" />,
            label: 'SPATIAL MATRIX',
            color: 'bg-emerald-600 shadow-emerald-500/50',
            onClick: () => dispatch({ type: 'NAV_SWITCH_VIEW', view: 'scene' })
        },
        {
            id: 'perf',
            icon: <Zap className="w-5 h-5" />,
            label: 'TELEMETRY',
            color: 'bg-amber-500 shadow-amber-500/50',
            onClick: () => dispatch({ type: 'SYSTEM_TOGGLE_PERFORMANCE_HUD' })
        }
    ];

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">
            {/* Backdrop Layer */}
            {isExpanded && (
                <div
                    className="fixed inset-0 bg-[#050a15]/40 backdrop-blur-md z-[-1] pointer-events-auto animate-in fade-in duration-300"
                    onClick={toggleExpanded}
                />
            )}

            {/* Bubble Cluster */}
            <div className={`flex flex-col gap-4 mb-6 items-end transition-all duration-500 ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-75 translate-y-20 pointer-events-none'}`}>
                {actions.map((action, index) => (
                    <div
                        key={action.id}
                        className="flex items-center gap-3 group pointer-events-auto"
                        style={{
                            transitionDelay: `${isExpanded ? index * 50 : 0}ms`,
                            transform: isExpanded ? 'translateX(0)' : 'translateX(20px)'
                        }}
                    >
                        {/* Label */}
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-2xl">
                            {action.label}
                        </span>

                        {/* Bubble */}
                        <button
                            onClick={() => handleAction(action.onClick)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transform transition-all duration-300 hover:scale-110 active:scale-95 hover:rotate-6 ${action.color}`}
                        >
                            {action.icon}
                        </button>
                    </div>
                ))}
            </div>

            {/* Nexus Heart (Main Button) */}
            <button
                onClick={toggleExpanded}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl pointer-events-auto transition-all duration-500 hover:scale-105 active:scale-95 bg-gradient-to-br from-cyan-500 to-blue-600 relative overflow-hidden group ${isExpanded ? 'rotate-[135deg] from-red-500 to-rose-600' : ''}`}
            >
                {/* Internal Glow */}
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />

                {isExpanded ? (
                    <X className="w-8 h-8 relative z-10" />
                ) : (
                    <Plus className="w-8 h-8 relative z-10" />
                )}

                {/* Status Indicator Dot */}
                {!isExpanded && (
                    <div className="absolute top-3 right-3 w-3 h-3 bg-white rounded-full border-2 border-cyan-500 shadow-[0_0_10px_white] animate-pulse" />
                )}
            </button>
        </div>
    );
};

export default NexusControl;
