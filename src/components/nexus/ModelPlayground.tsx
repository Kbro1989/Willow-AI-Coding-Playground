
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Terminal, Cpu, Send, Trash2, Layers, Brain, Zap } from 'lucide-react';
import { nexusBus } from '../../services/nexusCommandBus';
import { modelRouter } from '../../services/modelRouter';
import { ModelKey } from '../../types';

interface ModelMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    model?: string;
    timestamp: number;
}

const CLOUDFLARE_MODELS = [
    { id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', name: 'Llama 3.3 (70B)', type: 'Chat' },
    { id: '@cf/meta/llama-3.1-8b-instruct', name: 'Llama 3.1 (8B)', type: 'Fast' },
    { id: '@cf/qwen/qwen2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder', type: 'Code' },
    { id: '@cf/mistral/mistral-7b-instruct-v0.3', name: 'Mistral 7B', type: 'Chat' },
    { id: '@cf/deepseek-ai/deepseek-math-7b-instruct', name: 'DeepSeek Math', type: 'Logic' },
    { id: '@cf/meta/llama-2-7b-chat-fp8', name: 'Llama 2 (Legacy)', type: 'Chat' }
];

export const ModelPlayground: React.FC = () => {
    const [selectedModel, setSelectedModel] = useState(CLOUDFLARE_MODELS[0].id);
    const [prompt, setPrompt] = useState('');
    const [messages, setMessages] = useState<ModelMessage[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [latency, setLatency] = useState<number | null>(null);
    const [systemPrompt, setSystemPrompt] = useState('You are the Antigravity Engine Oracle, a direct interface to Cloudflare Workers AI. Be concise, technical, and precise.');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    const handleSend = async () => {
        if (!prompt.trim() || isThinking) return;

        const userMsg: ModelMessage = {
            role: 'user',
            content: prompt,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setPrompt('');
        setIsThinking(true);
        const startTime = Date.now();

        try {
            const { neuralRegistry } = await import('../../services/ai/NeuralRegistry');

            // We use the modelRouter directly with the specific model ID
            const response = await modelRouter.route({
                type: 'text',
                prompt,
                systemPrompt,
                history: messages.map(m => ({
                    role: m.role === 'assistant' ? 'model' : 'user' as 'user' | 'model',
                    content: m.content
                })),
                options: { model: selectedModel }
            });

            setLatency(Date.now() - startTime);

            const assistantMsg: ModelMessage = {
                role: 'assistant',
                content: typeof response === 'object' && 'content' in response ? response.content || "Neural pulse lost." : "Neural pulse lost.",
                model: selectedModel,
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, assistantMsg]);

            // Trigger a Neural Pulse on the Spine
            neuralRegistry.emit('job:start', { id: `oracle-${Date.now()}`, description: `Direct Inference: ${selectedModel}` });
            setTimeout(() => neuralRegistry.emit('job:success', { id: `oracle-${Date.now()}` }), 500);

        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `ERROR: ${err instanceof Error ? err.message : 'Connectivity failure.'}`,
                timestamp: Date.now()
            }]);
        } finally {
            setIsThinking(false);
        }
    };

    const clearChat = () => setMessages([]);

    return (
        <div className="h-full flex flex-col bg-[#050a15] text-white">
            {/* Header */}
            <div className="h-16 border-b border-white/5 bg-black/40 flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-[0.2em]">Oracle Playground</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Direct Line to Cloudflare AI</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-[10px] font-black uppercase text-slate-300">Latency: {latency !== null ? `${latency}ms` : '---'}</span>
                    </div>
                    <button onClick={clearChat} className="p-2 text-slate-500 hover:text-rose-400 transition-colors" title="Purge Context">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Chat Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
                                <Brain className="w-16 h-16 text-cyan-500" />
                                <p className="text-xs font-black uppercase tracking-[0.4em]">Establish Neural Connection</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-6 rounded-[2rem] border ${msg.role === 'user' ? 'bg-cyan-600/10 border-cyan-500/30' : 'bg-white/5 border-white/10'} nexus-glass-edge`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-cyan-400' : 'text-purple-400'}`}>
                                            {msg.role === 'user' ? 'Local Architect' : (msg.model ? msg.model.split('/').pop() : 'The Oracle')}
                                        </span>
                                        <span className="text-[8px] text-slate-600 tabular-nums">
                                            {new Date(msg.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div className="text-xs leading-relaxed text-slate-300 font-medium whitespace-pre-wrap">
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex justify-start">
                                <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 nexus-glass-edge flex items-center gap-3">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Oracle is thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-8 border-t border-white/5 bg-black/20">
                        <div className="max-w-4xl mx-auto relative group">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Whisper into the void..."
                                className="w-full bg-black/40 border border-white/10 rounded-3xl py-4 pl-6 pr-24 text-sm focus:outline-none focus:border-cyan-500/50 min-h-[60px] max-h-[200px] nexus-glass transition-all"
                            />
                            <button
                                onClick={handleSend}
                                disabled={isThinking || !prompt.trim()}
                                className="absolute right-3 bottom-3 p-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:bg-slate-800 text-white rounded-2xl transition-all shadow-lg shadow-cyan-500/20"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="mt-4 flex items-center justify-center gap-6 text-[8px] font-black uppercase text-slate-500 tracking-[0.2em]">
                            <span className="flex items-center gap-2"><Zap className="w-3 h-3 text-amber-500" /> Direct-to-Cloudflare Enabled</span>
                            <span className="flex items-center gap-2"><Cpu className="w-3 h-3 text-cyan-400" /> Precision Sampling v2</span>
                            <span className="flex items-center gap-2"><Layers className="w-3 h-3 text-purple-400" /> 128k Context Length</span>
                        </div>
                    </div>
                </div>

                {/* Sidebar Controls */}
                <div className="w-80 border-l border-white/5 bg-black/40 p-6 space-y-8 overflow-y-auto no-scrollbar nexus-glass">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase text-cyan-400 tracking-widest flex items-center gap-2">
                            <Cpu className="w-3 h-3" /> Model Selection
                        </h3>
                        <div className="space-y-2">
                            {CLOUDFLARE_MODELS.map(model => (
                                <button
                                    key={model.id}
                                    onClick={() => setSelectedModel(model.id)}
                                    className={`w-full p-4 rounded-2xl border transition-all text-left group ${selectedModel === model.id ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${selectedModel === model.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                            {model.name}
                                        </span>
                                        <span className="text-[8px] bg-black/40 px-1.5 py-0.5 rounded text-cyan-600 font-bold uppercase">{model.type}</span>
                                    </div>
                                    <div className="text-[9px] text-slate-500 truncate">{model.id}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-white/5">
                        <h3 className="text-[10px] font-black uppercase text-purple-400 tracking-widest flex items-center gap-2">
                            <Layers className="w-3 h-3" /> System Prompt
                        </h3>
                        <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-[10px] font-bold text-slate-300 min-h-[150px] focus:outline-none focus:border-purple-500/50"
                        />
                    </div>

                    <div className="p-6 bg-gradient-to-br from-purple-900/40 to-cyan-900/40 rounded-3xl border border-white/10 shadow-2xl">
                        <h4 className="text-[9px] font-black uppercase text-white tracking-widest mb-2 flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Oracle Logic
                        </h4>
                        <p className="text-[9px] text-slate-300 leading-relaxed font-bold uppercase tracking-tighter opacity-70">
                            The Playground bypasses standard orchestration to provide raw, high-latency-sensitive access to native Workers AI endpoints. Recommended for prompt engineering and model capability testing.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModelPlayground;
