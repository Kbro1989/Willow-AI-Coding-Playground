import React, { useState, useEffect } from 'react';
import { Ship, Globe, GitBranch, RefreshCw, Zap, ShieldCheck, ExternalLink } from 'lucide-react';
import { nexusBus } from '../../services/nexusCommandBus';

export const Deploy: React.FC = () => {
    const [isMirroring, setIsMirroring] = useState(false);
    const [isCreatingSandbox, setIsCreatingSandbox] = useState(false);
    const [lastMirrorHash, setLastMirrorHash] = useState('326b62f');
    const [deployments, setDeployments] = useState([
        { id: '1', env: 'production', status: 'success', url: 'https://antigravity-engine.pages.dev', timestamp: Date.now() - 3600000 },
        { id: '2', env: 'sandbox-alpha', status: 'active', url: 'https://sandbox-382a.antigravity.dev', timestamp: Date.now() - 600000 }
    ]);

    const handleMirror = async () => {
        setIsMirroring(true);
        // This will call the githubMirrorService eventually
        const jobId = nexusBus.registerJob({
            id: `mirror-${Date.now()}`,
            type: 'workflow',
            description: 'GitHub Mirroring: Syncing workspace to remote',
            abortController: new AbortController()
        });

        setTimeout(() => {
            nexusBus.completeJob(jobId.id);
            setIsMirroring(false);
            setLastMirrorHash(Math.random().toString(16).slice(2, 9));
        }, 2000);
    };

    const handleCreateSandbox = async () => {
        setIsCreatingSandbox(true);
        // One-Click Sandbox Implementation
        const jobId = nexusBus.registerJob({
            id: `sandbox-${Date.now()}`,
            type: 'workflow',
            description: 'Creating Ephemeral Sandbox Environment',
            abortController: new AbortController()
        });

        setTimeout(() => {
            nexusBus.completeJob(jobId.id);
            setIsCreatingSandbox(false);
            setDeployments([
                { id: Date.now().toString(), env: 'sandbox-live', status: 'active', url: `https://nexus-sandbox-${Math.random().toString(36).slice(2, 6)}.pages.dev`, timestamp: Date.now() },
                ...deployments
            ]);
        }, 3000);
    };

    return (
        <div className="h-full w-full bg-[#050a15] flex flex-col p-6 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                        <Ship className="w-8 h-8 text-cyan-400" />
                        Shipper <span className="text-cyan-500/50 text-sm font-mono ml-2">PRO v4.2</span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">CI/CD Orchestration & Global Deployment Plane</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleMirror}
                        disabled={isMirroring}
                        className="px-6 py-2.5 bg-black border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:border-cyan-500/50 transition-all flex items-center gap-2 group"
                    >
                        <GitBranch className={`w-4 h-4 ${isMirroring ? 'animate-spin' : 'group-hover:text-cyan-400'}`} />
                        Cloud Mirror
                    </button>
                    <button
                        onClick={handleCreateSandbox}
                        disabled={isCreatingSandbox}
                        className="px-6 py-2.5 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <Zap className={`w-4 h-4 ${isCreatingSandbox ? 'animate-pulse' : ''}`} />
                        One-Click Sandbox
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-black/40 border border-white/5 p-5 rounded-2xl">
                    <div className="flex items-center gap-3 text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">
                        <Globe className="w-4 h-4 text-blue-400" />
                        Infrastructure Status
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold">Cloudflare Edge</span>
                            <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[9px] font-black uppercase rounded">Healthy</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold">GitHub Sync</span>
                            <span className="text-xs text-slate-400 font-mono">@{lastMirrorHash}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold">InstantDB Delta</span>
                            <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-500 text-[9px] font-black uppercase rounded">Connected</span>
                        </div>
                    </div>
                </div>

                <div className="bg-black/40 border border-white/5 p-5 rounded-2xl">
                    <div className="flex items-center gap-3 text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">
                        <ShieldCheck className="w-4 h-4 text-purple-400" />
                        Security Posture
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold">Auth Provider</span>
                            <span className="text-xs text-slate-400 uppercase">Google OAuth</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold">Secrets Store</span>
                            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-500 text-[9px] font-black uppercase rounded">Encrypted</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold">API Firewall</span>
                            <span className="text-xs text-slate-400 uppercase">Active</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-cyan-900/10 to-blue-900/10 border border-cyan-500/20 p-5 rounded-2xl relative overflow-hidden group">
                    <Ship className="absolute -bottom-4 -right-4 w-32 h-32 text-cyan-500/5 rotate-12 group-hover:scale-110 transition-transform" />
                    <h3 className="text-lg font-black text-white italic mb-2">Nexus Deployment Node</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                        Your workspace is currently localized in **Production Environment**. Changes pushed to Mirror will trigger a global build via GitHub Actions.
                    </p>
                </div>
            </div>

            <div className="flex-1 flex flex-col">
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                    <RefreshCw className="w-3 h-3" />
                    Recent Deployments & Sandboxes
                </h2>
                <div className="space-y-3">
                    {deployments.map(d => (
                        <div key={d.id} className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${d.env === 'production' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                    {d.env === 'production' ? <Globe className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-white capitalize">{d.env}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${d.status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                            {d.status}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-mono">{d.url}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-slate-500 font-bold">{new Date(d.timestamp).toLocaleString()}</span>
                                <a href={d.url} target="_blank" rel="noreferrer" className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-all">
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Deploy;
