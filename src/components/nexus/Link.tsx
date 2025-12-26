import React from 'react';
import { Users, Link2, MousePointer2, MessageSquare } from 'lucide-react';
import { CollaborativeCanvas } from '../media/CollaborativeCanvas';

const Link: React.FC = () => {
    return (
        <div className="h-full flex flex-col bg-[#050a15]">
            <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                        <Users className="w-7 h-7 text-blue-400" />
                        Multi-Link
                    </h1>
                    <p className="text-slate-400 text-xs mt-1">Cross-Link Presence & Shared Brainstorming Canvas</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all">
                        Invite Contributor
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                <CollaborativeCanvas />

                {/* Presence Sidebar (Floating) */}
                <div className="absolute top-6 right-6 w-64 bg-black/80 backdrop-blur-2xl border border-white/5 p-4 rounded-2xl z-20 shadow-2xl">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                        <MousePointer2 className="w-3 h-3 text-cyan-400" />
                        Active Transmitters
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-cyan-600 border border-white/10 flex items-center justify-center text-[8px] font-black">OP</div>
                                <span className="text-xs font-bold">Operator (You)</span>
                            </div>
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Link;
