import React from 'react';
import { Settings, Shield, User, Key, Cpu } from 'lucide-react';
import ApiKeyManager from '../ApiKeyManager';

const Config: React.FC = () => {
    return (
        <div className="h-full flex flex-col bg-[#050a15] p-6 overflow-y-auto custom-scrollbar">
            <div className="mb-8 border-b border-white/5 pb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                        <Settings className="w-7 h-7 text-slate-400" />
                        System Config
                    </h1>
                    <p className="text-slate-400 text-xs mt-1">Global Preferences, API Credentials & Security</p>
                </div>
                <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/10">Active Session: 4h 12m</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-10 max-w-4xl">
                <section>
                    <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-cyan-400 mb-6 border-l-2 border-cyan-400 pl-4">
                        <Key className="w-4 h-4" />
                        Secret Injection & API Keys
                    </div>
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
                        <ApiKeyManager onClose={() => { }} />
                    </div>
                </section>

                <section>
                    <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-purple-400 mb-6 border-l-2 border-purple-400 pl-4">
                        <Cpu className="w-4 h-4" />
                        Neural Directives
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Proactive Error Debugging', desc: 'AI will automatically suggest fixes for lint errors', active: true },
                            { label: 'Contextual Memory Expansion', desc: 'Director retains 2x more local file context', active: false },
                            { label: 'Autonomous Build Triggers', desc: 'Trigger CI/CD on significant logic changes', active: true },
                            { label: 'High-Density UI Mode', desc: 'Maximum control surface visualization', active: true }
                        ].map(d => (
                            <div key={d.label} className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-bold text-white mb-1">{d.label}</div>
                                    <div className="text-[10px] text-slate-500 leading-tight">{d.desc}</div>
                                </div>
                                <div className={`w-10 h-5 rounded-full relative transition-all ${d.active ? 'bg-cyan-500' : 'bg-slate-800'}`}>
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${d.active ? 'right-1' : 'left-1'}`}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Config;
