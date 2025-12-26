import React from 'react';
import { PenTool, BookOpen, Quote, Sparkles } from 'lucide-react';
import Copywriter from '../Copywriter';

const Narrative: React.FC = () => {
    return (
        <div className="h-full flex flex-col bg-[#050a15]">
            <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                        <PenTool className="w-7 h-7 text-pink-400" />
                        Story Engine
                    </h1>
                    <p className="text-slate-400 text-xs mt-1">Autonomous Narrative Synthesis & World Lore Weaver</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-4 py-2 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-pink-500 hover:text-white transition-all">
                        Synthesize Plot Branch
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <Copywriter />
            </div>
        </div>
    );
};

export default Narrative;
