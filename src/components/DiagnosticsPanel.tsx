import React, { useState, useEffect } from 'react';
import { nexusBus, NexusJob } from '../services/nexusCommandBus';
import { sessionService, SessionMetrics } from '../services/sessionService';
import { localBridgeClient } from '../services/localBridgeService';
import {
  Activity, Zap, Cpu, AlertTriangle, TrendingUp, Database,
  ShieldCheck, Users, Globe, Layers, HardDrive, RefreshCcw,
  Link as LinkIcon, Box, Terminal
} from 'lucide-react';

const DiagnosticsPanel: React.FC = () => {
  const [jobs, setJobs] = useState<NexusJob[]>(nexusBus.getJobs());
  const [metrics, setMetrics] = useState<SessionMetrics & { isHardBudgetEnabled: boolean }>(sessionService.getMetrics());
  const [bridgeStatus, setBridgeStatus] = useState(localBridgeClient.getStatus());

  useEffect(() => {
    const unsubBus = nexusBus.subscribe(() => {
      setJobs(nexusBus.getJobs());
    });
    const unsubSession = sessionService.subscribe(setMetrics);
    const unsubBridge = localBridgeClient.onStatusChange(setBridgeStatus);

    return () => {
      unsubBus();
      unsubSession();
      unsubBridge();
    };
  }, []);

  return (
    <div className="flex-1 bg-[#050a15] text-cyan-50 p-8 overflow-y-auto no-scrollbar font-sans selection:bg-cyan-500/30">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-10 border-b border-cyan-500/20 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center border border-cyan-500/30">
            <Activity className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white">System Overwatch</h2>
            <p className="text-[10px] text-cyan-500/70 font-black uppercase tracking-[0.3em]">Precision Runtime Diagnostics v4.2 PRO</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-500 uppercase font-black mb-1">Link Latency</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-sm font-black text-emerald-400 font-mono">12.4ms</span>
            </div>
          </div>
          <div className="h-10 w-px bg-white/5" />
          <div className="flex flex-col items-end text-right">
            <span className="text-[9px] text-slate-500 uppercase font-black mb-1">Kernel Status</span>
            <span className="text-xs font-black text-white px-3 py-1 bg-white/5 rounded-lg border border-white/5 uppercase tracking-widest">Stable / Optimized</span>
          </div>
        </div>
      </div>

      {/* Primary Insight Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">

        {/* Neural Link Module */}
        <div className="bg-[#0a1222]/80 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-2xl transition-all hover:border-cyan-500/30 group">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <LinkIcon className="w-5 h-5 text-cyan-400 group-hover:rotate-45 transition-transform" />
              <h3 className="text-xs font-black uppercase tracking-widest text-white/50">Neural Link</h3>
            </div>
            <div className={`px-2 py-0.5 rounded-full text-[8px] font-black ${bridgeStatus.isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'} uppercase tracking-widest border border-current/20`}>
              {bridgeStatus.isConnected ? 'Active' : 'Offline'}
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
              <span className="text-[9px] text-slate-500 uppercase font-bold block mb-2">Bridge Endpoint</span>
              <span className="text-[10px] font-mono text-cyan-400 truncate block">{localStorage.getItem('antigravity_bridge_url') || 'ws://localhost:3040'}</span>
            </div>
            <div className="flex justify-between items-center px-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Sync Mode</span>
              <span className="text-xs font-black text-white uppercase">{bridgeStatus.isCloudMode ? 'Cloud-Only' : 'Dual-Sync'}</span>
            </div>
          </div>
        </div>

        {/* Economy Overwatch */}
        <div className="bg-[#0a1222]/80 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-2xl transition-all hover:border-purple-500/30 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-white/50">Economy Guardrails</h3>
            </div>
            <button
              onClick={() => sessionService.setHardBudgetEnabled(!metrics.isHardBudgetEnabled)}
              className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${metrics.isHardBudgetEnabled ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-white/5 text-slate-500'}`}
            >
              Budget Lock: {metrics.isHardBudgetEnabled ? 'ACTIVE' : 'READY'}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <span className="text-[9px] text-slate-500 uppercase font-bold">Session Burn</span>
              <div className="text-2xl font-black text-white font-mono">${metrics.totalCost.toFixed(3)}</div>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-slate-500 uppercase font-bold">Max Threshold</span>
              <div className="text-2xl font-black text-slate-500 font-mono">$5.00</div>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-slate-500 uppercase font-bold">Efficiency</span>
              <div className="text-2xl font-black text-cyan-400 font-mono">94%</div>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-slate-500 uppercase font-bold">Tokens Load</span>
              <div className="text-2xl font-black text-purple-400 font-mono">{Math.floor(metrics.totalCost * 125000).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Presence Module */}
        <div className="bg-[#0a1222]/80 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-2xl transition-all hover:border-blue-500/30">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-5 h-5 text-blue-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-white/50">Collaborators</h3>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 border-4 border-[#0a1222] flex items-center justify-center text-[10px] font-black text-white shadow-xl relative z-10">OP</div>
              <div className="w-10 h-10 rounded-full bg-slate-800 border-4 border-[#0a1222] flex items-center justify-center text-[10px] font-black text-slate-600 shadow-xl">AI</div>
            </div>
            <span className="text-[9px] font-black text-slate-600 uppercase">1 Online</span>
          </div>
          <p className="text-[10px] text-slate-500 italic leading-relaxed">System isolate: Running in single-user master node.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Technical Registry */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 font-black text-xs uppercase tracking-[0.3em] text-slate-500">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping shadow-[0_0_10px_#00f2ff]" />
              Live Job Registry
            </div>
            <button className="text-[9px] font-black text-white/30 hover:text-cyan-400 transition-colors flex items-center gap-2">
              <RefreshCcw className="w-3 h-3" />
              FLUSH COMPLETED
            </button>
          </div>

          <div className="space-y-4">
            {jobs.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2.5rem] text-[10px] text-slate-600 uppercase tracking-widest gap-4">
                <Box className="w-8 h-8 opacity-20" />
                No active sub-routines
              </div>
            ) : (
              jobs.map(job => (
                <div key={job.id} className="p-6 bg-black/40 border border-white/5 rounded-[2rem] flex items-center justify-between group hover:border-cyan-500/30 transition-all hover:translate-x-1">
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all ${job.type === 'ai' ? 'bg-purple-500/10 text-purple-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                      {job.type === 'ai' ? <BrainIcon className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white uppercase tracking-tight mb-1">{job.description}</span>
                      <div className="flex items-center gap-3 text-[10px] font-mono">
                        <span className="text-slate-600">{job.id}</span>
                        <span className="text-cyan-500/50">•</span>
                        <span className="text-emerald-500 italic">Running {Math.floor((Date.now() - job.startTime) / 1000)}s</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col items-end gap-2">
                      <div className="h-1.5 w-32 bg-white/5 rounded-full overflow-hidden shadow-inner translate-y-1">
                        <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-progress w-[60%] shadow-[0_0_15px_rgba(0,242,255,0.5)]"></div>
                      </div>
                      <span className="text-[9px] text-cyan-400 font-black tracking-widest translate-y-2 group-hover:translate-y-0 transition-transform opacity-0 group-hover:opacity-100 uppercase">Processing...</span>
                    </div>
                    <button onClick={() => job.abortController.abort()} className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500/40 hover:text-red-500 hover:bg-red-500/20 rounded-xl transition-all border border-red-500/10">
                      <AlertTriangle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Resource Analytics & Quick Access */}
        <div className="space-y-8">
          <div className="bg-[#051122] rounded-[2.5rem] border border-cyan-500/10 p-8 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
            <h3 className="text-xs font-black uppercase tracking-[0.5em] text-cyan-500/50 mb-8 flex items-center gap-3">
              <Cpu className="w-4 h-4" />
              Vitals Baseline
            </h3>
            <div className="space-y-8">
              <VitalBar label="Core Execution Path" value={72} color="bg-cyan-500" />
              <VitalBar label="Memory Buffer Utilization" value={42} color="bg-purple-500" />
              <VitalBar label="Neural Link Bandwidth" value={18} color="bg-emerald-500" />
              <VitalBar label="Thread Pool Context Status" value={95} color="bg-amber-500" />
            </div>
          </div>

          {/* Quick Actions Integration */}
          <div className="grid grid-cols-2 gap-4">
            <QuickAction icon={HardDrive} label="Sync Local FS" desc="Commit buffer to disk" />
            <QuickAction icon={RefreshCcw} label="Hard Reboot" desc="Reload kernel services" />
            <QuickAction icon={Globe} label="Deploy Staging" desc="Push to edge workers" />
            <QuickAction icon={Terminal} label="Bridge Reset" desc="Purge link memory" />
          </div>
        </div>
      </div>
    </div>
  );
};

const VitalBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-end">
      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{label}</span>
      <span className={`text-xs font-mono font-black ${color.replace('bg-', 'text-')}`}>{value}%</span>
    </div>
    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
      <div className={`h-full ${color} rounded-full shadow-[0_0_15px_currentColor]`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

const QuickAction = ({ icon: Icon, label, desc }: { icon: any, label: string, desc: string }) => (
  <button className="flex items-start gap-4 p-5 bg-white/5 border border-white/5 rounded-3xl hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all text-left group">
    <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center border border-white/5">
      <Icon className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
    </div>
    <div className="flex flex-col">
      <span className="text-[11px] font-black text-white uppercase tracking-tight">{label}</span>
      <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">{desc}</span>
    </div>
  </button>
)

const BrainIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .52 8.245 4 4 0 0 0 7.837 1.117A3 3 0 1 0 12 5z" /><path d="M12 19a3 3 0 1 0 5.997-.125 4 4 0 0 0 2.526-5.77 4 4 0 0 0-.52-8.245 4 4 0 0 0-7.837-1.117A3 3 0 1 0 12 19z" /></svg>
);

export default DiagnosticsPanel;
