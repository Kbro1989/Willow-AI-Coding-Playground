import React, { useState, useEffect } from 'react';
import { nexusBus, NexusJob } from '../services/nexusCommandBus';
import { sessionService, SessionMetrics } from '../services/sessionService';
import { Activity, Zap, Cpu, AlertTriangle, TrendingUp, Database, ShieldCheck, Users } from 'lucide-react';

const DiagnosticsPanel: React.FC = () => {
  const [jobs, setJobs] = useState<NexusJob[]>(nexusBus.getJobs());
  const [metrics, setMetrics] = useState<SessionMetrics & { isHardBudgetEnabled: boolean }>(sessionService.getMetrics());

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
        <div className="bg-black/40 border border-white/5 p-5 rounded-xl col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
              <ShieldCheck className="w-4 h-4" />
              Economy Guardrails
            </div>
            <button
              onClick={() => sessionService.setHardBudgetEnabled(!metrics.isHardBudgetEnabled)}
              className={`px-3 py-1 rounded text-[9px] font-black uppercase transition-all ${metrics.isHardBudgetEnabled ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-400'}`}
            >
              Hard Budget: {metrics.isHardBudgetEnabled ? 'ACTIVE' : 'OFF'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-slate-500 uppercase mb-1">Session Burn</div>
              <div className="text-2xl font-black text-white">${metrics.totalCost.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase mb-1">Hard Limit</div>
              <div className="text-2xl font-black text-slate-400">$5.000</div>
            </div>
          </div>
          {metrics.isHardBudgetEnabled && metrics.totalCost > 4.5 && (
            <div className="mt-4 p-2 bg-red-500/10 border border-red-500/20 rounded text-[9px] text-red-500 font-bold animate-pulse">
              CRITICAL: Budget threshold reached. Autonomous jobs will be throttled.
            </div>
          )}
        </div>

        <div className="bg-black/40 border border-white/5 p-5 rounded-xl col-span-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 mb-4">
            <Users className="w-4 h-4" />
            Collaborative Presence
          </div>
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 border border-black flex items-center justify-center text-[10px] font-black text-white">OP</div>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-black flex items-center justify-center text-[10px] font-black text-slate-500">+0</div>
          </div>
          <p className="mt-3 text-[10px] text-slate-500 italic">No other users integrated in current link scope.</p>
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
