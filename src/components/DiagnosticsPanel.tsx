import React, { useState, useEffect } from 'react';
import { nexusBus, NexusJob } from '../services/nexusCommandBus';
import { sessionService, SessionMetrics } from '../services/sessionService';
import { Activity, Zap, Cpu, AlertTriangle, TrendingUp, Database } from 'lucide-react';

const DiagnosticsPanel: React.FC = () => {
  const [jobs, setJobs] = useState<NexusJob[]>(nexusBus.getJobs());
  const [metrics, setMetrics] = useState<SessionMetrics>(sessionService.getMetrics());

  useEffect(() => {
    const unsubBus = nexusBus.subscribe(() => {
      setJobs(nexusBus.getJobs());
    });
    const unsubSession = sessionService.subscribe(setMetrics);

    return () => {
      unsubBus();
      unsubSession();
    };
  }, []);

  return (
    <div className="flex-1 bg-[#050a15] text-cyan-50 p-6 overflow-y-auto font-mono">
      <div className="flex items-center justify-between mb-8 border-b border-cyan-500/20 pb-4">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h2 className="text-xl font-black uppercase tracking-widest text-cyan-400">Telemetry Overwatch</h2>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded">Kernel: v4.2 PRO</span>
          <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded">Latency: 12ms</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="p-4 bg-cyan-950/20 border border-cyan-500/10 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
            <Cpu className="w-12 h-12 text-cyan-400" />
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 mb-2">Neural Load</div>
          <div className="text-3xl font-black text-white">{jobs.filter(j => j.type === 'ai').length} <span className="text-xs text-cyan-600 font-normal uppercase">Active Jobs</span></div>
        </div>

        <div className="p-4 bg-emerald-950/10 border border-emerald-500/10 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
            <TrendingUp className="w-12 h-12 text-emerald-400" />
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-500 mb-2">Neural Economy</div>
          <div className="text-3xl font-black text-white">${metrics.totalCost.toFixed(3)} <span className="text-xs text-emerald-600 font-normal uppercase">Total Cost</span></div>
        </div>

        <div className="p-4 bg-purple-950/10 border border-purple-500/10 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
            <Zap className="w-12 h-12 text-purple-400" />
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-purple-500 mb-2">Token Velocity</div>
          <div className="text-3xl font-black text-white">{metrics.totalTokens.toLocaleString()} <span className="text-xs text-purple-600 font-normal uppercase">Used</span></div>
        </div>

        <div className="p-4 bg-slate-950/10 border border-slate-500/10 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
            <Database className="w-12 h-12 text-slate-400" />
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">Registry Size</div>
          <div className="text-3xl font-black text-white">{jobs.length} <span className="text-xs text-slate-600 font-normal uppercase">Total Entries</span></div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></div>
          Live Job Registry
        </div>
        {jobs.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl text-[10px] text-slate-600 uppercase tracking-widest">
            No active jobs in registry
          </div>
        ) : (
          jobs.map(job => (
            <div key={job.id} className="p-4 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between group hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${job.type === 'ai' ? 'bg-purple-500/10 text-purple-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                  {job.type === 'ai' ? <Brain className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-white uppercase tracking-tighter">{job.description}</span>
                  <span className="text-[9px] text-slate-500 font-mono italic">{job.id} • Started {Math.floor((Date.now() - job.startTime) / 1000)}s ago</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 animate-progress"></div>
                  </div>
                  <span className="text-[9px] text-cyan-400 font-black">ACTIVE</span>
                </div>
                <button onClick={() => job.abortController.abort()} className="p-2 text-slate-600 hover:text-red-500 transition-colors">
                  <AlertTriangle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const Brain = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .52 8.245 4 4 0 0 0 7.837 1.117A3 3 0 1 0 12 5z" /><path d="M12 19a3 3 0 1 0 5.997-.125 4 4 0 0 0 2.526-5.77 4 4 0 0 0-.52-8.245 4 4 0 0 0-7.837-1.117A3 3 0 1 0 12 19z" /></svg>
);

export default DiagnosticsPanel;
