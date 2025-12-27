import React, { useEffect, useState } from 'react';
import { Bot, Sparkles, X, ChevronRight, Brain, Play, Sparkles as SparkleIcon } from 'lucide-react';
import { contextService, UnifiedContext } from '../../services/ai/contextService';
import { pipelineService } from '../../services/ai/pipelineService';
import { universalOrchestrator } from '../../services/ai/universalOrchestrator';
import { agentSprintService, SprintState } from '../../services/ai/agentSprintService';

const AssistantOverlay: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [context, setContext] = useState<UnifiedContext | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activePipeline, setActivePipeline] = useState<string | null>(null);
    const [command, setCommand] = useState('');
    const [sprintState, setSprintState] = useState<SprintState | null>(null);
    const [isThinking, setIsThinking] = useState(false);

    useEffect(() => {
        const unsubscribe = agentSprintService.subscribe(setSprintState);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchAndSuggest = async () => {
            if (isOpen) {
                const ctx = await contextService.getUnifiedContext();
                setContext(ctx);
                generateSuggestions(ctx);
            }
        };

        const interval = setInterval(fetchAndSuggest, 5000);
        fetchAndSuggest();

        return () => clearInterval(interval);
    }, [isOpen]);

    const generateSuggestions = (ctx: UnifiedContext) => {
        const base = ['Synthesize optimized asset', 'Analyze project performance', 'Generate code tests'];
        if (ctx.activeFile) base.push(`Refactor ${ctx.activeFile.split('/').pop()}`);
        if (ctx.activeGraphName) base.push(`Optimize ${ctx.activeGraphName} pipeline`);
        setSuggestions(base);
    };

    const handleCommand = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!command.trim()) return;

        setIsThinking(true);
        const currentCommand = command;
        setCommand('');

        try {
            await universalOrchestrator.dispatch(currentCommand);
        } finally {
            setIsThinking(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-12 h-12 bg-cyan-500 rounded-full shadow-[0_0_20px_rgba(0,242,255,0.4)] flex items-center justify-center hover:scale-110 transition-transform z-50 group"
            >
                <Bot className="w-6 h-6 text-white" />
                <div className="absolute -top-10 right-0 bg-black/80 px-3 py-1 rounded-lg text-[10px] text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-cyan-500/30">
                    AI Assistant Active
                </div>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-80 bg-black/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-bottom-4 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-cyan-900/20 to-transparent">
                <div className="flex items-center gap-2">
                    <SparkleIcon className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-white">Nexus Assistant</span>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X className="w-4 h-4 text-slate-400" />
                </button>
            </div>

            {/* Context Summary */}
            <div className="p-4 bg-white/5 text-[10px] space-y-2 border-b border-white/5">
                <div className="flex items-center gap-2 text-slate-400">
                    <Brain className="w-3 h-3" />
                    <span className="uppercase font-bold">Active Context</span>
                </div>
                {context ? (
                    <div className="grid grid-cols-2 gap-2 text-cyan-100">
                        <div className="truncate opacity-70">File: {context.activeFile || 'None'}</div>
                        <div className="truncate opacity-70">Env: {context.projectEnv}</div>
                        {context.activeGraphName && <div className="col-span-2 truncate opacity-70">Graph: {context.activeGraphName}</div>}
                    </div>
                ) : (
                    <div className="text-slate-500 italic">Analyzing workspace...</div>
                )}
            </div>

            {/* Suggestions */}
            <div className="p-4 space-y-3 max-h-60 overflow-y-auto custom-scrollbar flex-1">
                {sprintState && sprintState.status !== 'idle' ? (
                    <div className="space-y-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center justify-between">
                            Active Mission
                            <span className={`px-2 py-0.5 rounded ${sprintState.status === 'running' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                {sprintState.status}
                            </span>
                        </div>
                        <div className="text-xs font-bold text-white leading-relaxed">"{sprintState.goal}"</div>

                        <div className="space-y-2">
                            {sprintState.steps.map((step, i) => (
                                <div key={step.id} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] font-black ${step.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-black' :
                                            step.status === 'running' ? 'border-amber-500 text-amber-500 animate-pulse' :
                                                'border-slate-700 text-slate-700'
                                            }`}>
                                            {step.status === 'completed' ? '✓' : i + 1}
                                        </div>
                                        {i < sprintState.steps.length - 1 && <div className="w-px h-full bg-slate-800 my-1"></div>}
                                    </div>
                                    <div className={`text-[10px] pb-3 ${step.status === 'running' ? 'text-white' : 'text-slate-500'}`}>
                                        {step.description}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {sprintState.status === 'completed' && (
                            <button
                                onClick={() => agentSprintService.reset()}
                                className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                            >
                                Dismiss Project
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="text-[10px] font-black uppercase tracking-widest text-purple-400">Tactical Suggestions</div>
                        {suggestions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => universalOrchestrator.dispatch(action)}
                                className="w-full text-left p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors flex items-center justify-between group"
                            >
                                <span className="text-xs font-medium text-purple-100">{action}</span>
                                <ChevronRight className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </>
                )}
            </div>

            {/* Global Dispatch Input */}
            <div className="p-4 bg-black border-t border-white/5">
                <form onSubmit={handleCommand} className="relative">
                    <input
                        type="text"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        placeholder={isThinking ? "Thinking..." : "AI or Human First... Command Nexus"}
                        disabled={isThinking}
                        className="w-full bg-white/5 border border-cyan-500/30 rounded-xl py-3 pl-4 pr-12 text-xs text-white placeholder:text-slate-600 outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(0,242,255,0.15)] transition-all"
                    />
                    <button
                        type="submit"
                        disabled={isThinking || !command.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-cyan-500 text-black flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale transition-all"
                    >
                        {isThinking ? (
                            <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <ChevronRight className="w-4 h-4" />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AssistantOverlay;
