import React, { useEffect, useState } from 'react';
import { Bot, Sparkles, X, ChevronRight, Brain, Play } from 'lucide-react';
import { contextService, UnifiedContext } from '../../services/ai/contextService';
import { pipelineService } from '../../services/ai/pipelineService';

const AssistantOverlay: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [context, setContext] = useState<UnifiedContext | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activePipeline, setActivePipeline] = useState<string | null>(null);

    useEffect(() => {
        // Poll for context updates (in real app, use subscription)
        const interval = setInterval(async () => {
            if (isOpen) {
                const ctx = await contextService.getUnifiedContext();
                setContext(ctx);
                generateSuggestions(ctx);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [isOpen]);

    const generateSuggestions = (ctx: UnifiedContext) => {
        // Simple heuristic - in real app, AI would generate this
        const newSuggestions = [];
        if (ctx.activeFile?.endsWith('.ts')) newSuggestions.push('Generate Unit Tests');
        if (ctx.activeFile?.endsWith('.css')) newSuggestions.push('Optimize Tailwind Classes');
        if (ctx.activeGraphName) newSuggestions.push('Suggest Optimization Nodes');
        if (ctx.narrativeSummary) newSuggestions.push('Visualize Scene');
        setSuggestions(newSuggestions);
    };

    const runSuggestion = async (action: string) => {
        if (action === 'Visualize Scene') {
            const pid = pipelineService.createPipeline('workspace', [
                { type: 'text_generation', prompt: 'Describe the visual atmosphere based on current narrative.' },
                { type: 'image_generation', prompt: '{{step_0_output}}' }
            ]);
            setActivePipeline(pid);
            pipelineService.runPipeline(pid);
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
                    <Sparkles className="w-4 h-4 text-cyan-400" />
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
            <div className="p-4 space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                <div className="text-[10px] font-black uppercase tracking-widest text-purple-400">Suggested Actions</div>
                {suggestions.map((action, idx) => (
                    <button
                        key={idx}
                        onClick={() => runSuggestion(action)}
                        className="w-full text-left p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors flex items-center justify-between group"
                    >
                        <span className="text-xs font-medium text-purple-100">{action}</span>
                        <Play className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                ))}
                {suggestions.length === 0 && (
                    <div className="text-[10px] text-slate-500 text-center py-4">No suggestions available.</div>
                )}
            </div>

            {/* Pipeline Status */}
            {activePipeline && (
                <div className="p-3 bg-emerald-900/20 border-t border-emerald-500/20">
                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        Pipeline Running
                    </div>
                    <div className="text-[9px] font-mono text-emerald-200 opacity-70 truncate">{activePipeline}</div>
                </div>
            )}
        </div>
    );
};

export default AssistantOverlay;
