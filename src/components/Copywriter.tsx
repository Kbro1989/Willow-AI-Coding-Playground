import React, { useState, useEffect, useCallback } from 'react';
import { db, tx } from '../lib/db';
import { useDebounce } from '../hooks/useDebounce';
import { modelRouter } from '../services/modelRouter';
import { neuralRegistry } from '../services/ai/NeuralRegistry';

const Copywriter: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [tone, setTone] = useState<'professional' | 'creative' | 'marketing'>('professional');
    const [output, setOutput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [searchResults, setSearchResults] = useState<{ title: string, snippet: string }[]>([]);

    useEffect(() => {
        neuralRegistry.registerLimb({
            id: 'copywriter',
            name: 'Narrative Copywriter',
            description: 'Expert agent for generating marketing and narrative copy.',
            capabilities: [
                {
                    name: 'generate_copy',
                    description: 'Generate high-quality copy based on a topic and tone.',
                    parameters: { topic: 'string', tone: 'string' },
                    handler: async ({ topic: t, tone: tn }: { topic: string, tone: string }) => {
                        setTopic(t);
                        setTone(tn as any);
                        await handleGenerate();
                        return { status: 'Copy generated successfully' };
                    }
                }
            ]
        });
        return () => neuralRegistry.unregisterLimb('copywriter');
    }, [topic, tone]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            // First, ground the topic (using LLM knowledge for now until Librarian is fully search-enabled)
            // Or use modelRouter.chat with grounding=true if available
            // For now, we simulate search via a quick query or skip it to avoid Google dep.
            // const searchData = await googleSearch(topic); 
            // setSearchResults(searchData); 

            // Just use Model Router directly
            const response = await modelRouter.chat(
                `Write a ${tone} piece of copy about: ${topic}.`,
                [],
                "You are a master copywriter.",
                false,
                false
            );

            const copy = 'content' in response ? response.content : "Generation failed.";
            setOutput(copy || '');

            setSearchResults([{ title: 'Cloudflare Intelligence', snippet: 'Generated via Neural Matrix (DeepSeek/Llama)' }]);

        } catch (e) {
            setOutput('Error generating copy. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex h-full bg-[#050a15] text-cyan-50 font-sans">
            {/* Input Panel */}
            <div className="w-1/3 border-r border-cyan-900/30 p-6 flex flex-col space-y-6 bg-[#0a1222]">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Topic / Product</label>
                    <textarea
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full h-32 bg-[#050a15] border border-cyan-900/40 rounded-xl p-4 text-xs font-mono focus:border-cyan-500 focus:outline-none transition-all placeholder:text-slate-600"
                        placeholder="E.g., Neural Interface V2 launch campaign..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Tone</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['professional', 'creative', 'marketing'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setTone(t as any)}
                                className={`py-2 rounded-lg text-[9px] uppercase font-black tracking-widest transition-all ${tone === t ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(0,242,255,0.3)]' : 'bg-[#050a15] text-slate-500 hover:text-cyan-400 border border-cyan-900/20'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !topic}
                    className={`w-full py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-2 ${isGenerating ? 'bg-slate-800 text-slate-500' : 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-lg'}`}
                >
                    {isGenerating ? (
                        <>
                            <div className="w-3 h-3 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
                            <span>Synthesizing...</span>
                        </>
                    ) : (
                        <span>Generate Copy</span>
                    )}
                </button>

                {/* Grounding Data */}
                {searchResults.length > 0 && (
                    <div className="flex-1 overflow-y-auto space-y-2 border-t border-cyan-900/20 pt-4">
                        <label className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Grounding Source</label>
                        {searchResults.map((res, i) => (
                            <div key={i} className="p-3 bg-[#050a15]/50 rounded-lg border border-emerald-500/10 hover:border-emerald-500/30 transition-all">
                                <div className="text-[10px] text-emerald-400 font-bold truncate">{res.title}</div>
                                <div className="text-[9px] text-slate-500 mt-1 line-clamp-2">{res.snippet}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Output Panel */}
            <div className="flex-1 p-8 bg-[#050a15] relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
                <div className="h-full border border-cyan-900/20 rounded-2xl bg-[#0a1222]/50 backdrop-blur-sm p-8 relative overflow-y-auto shadow-inner">
                    {output ? (
                        <div className="prose prose-invert prose-sm max-w-none">
                            <h3 className="text-cyan-400 font-black uppercase tracking-widest text-xs mb-6 border-b border-cyan-900/40 pb-2">Generated Output</h3>
                            <div className="text-slate-300 whitespace-pre-wrap leading-relaxed font-light text-sm">
                                {output}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50 space-y-4">
                            <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-700 animate-[spin_10s_linear_infinite]"></div>
                            <p className="text-[10px] uppercase tracking-[0.3em]">Awaiting Input Vector</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Copywriter;
