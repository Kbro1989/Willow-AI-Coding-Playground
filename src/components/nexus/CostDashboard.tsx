
import React, { useEffect, useState } from 'react';
import { hardBlockEnforcer } from '../../services/hardBlockEnforcer';
import { ShieldCheck, TrendingDown, Lock, Unlock, AlertTriangle } from 'lucide-react';

export const CostDashboard: React.FC = () => {
    const [stats, setStats] = useState(hardBlockEnforcer.getStats());

    useEffect(() => {
        const interval = setInterval(() => {
            setStats(hardBlockEnforcer.getStats());
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const cfPercent = (stats.usage.cloudflare / stats.limits.CLOUDFLARE_DAILY) * 100;
    const geminiPercent = (stats.usage.gemini / stats.limits.GEMINI_FLASH_DAILY) * 100;

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
            {/* Status Header */}
            <div className="flex items-center justify-between p-6 bg-black/40 border border-white/5 rounded-3xl">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl border ${stats.isPaidEnabled ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                        {stats.isPaidEnabled ? <Unlock className="w-6 h-6 text-amber-400" /> : <Lock className="w-6 h-6 text-emerald-400" />}
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">
                            {stats.isPaidEnabled ? 'HARD BLOCK DISABLED' : 'ZERO-COST ACTIVE'}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            {stats.isPaidEnabled ? 'Warning: Paid API channels are open.' : 'Paid API channels are strictly blocked.'}
                        </p>
                    </div>
                </div>
                {!stats.isPaidEnabled && (
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Est. Monthly Savings</span>
                        <span className="text-xl font-black text-emerald-400 font-mono">~$245.00</span>
                    </div>
                )}
            </div>

            {/* Quota Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <QuotaCard
                    label="Cloudflare Workers AI"
                    used={stats.usage.cloudflare}
                    limit={stats.limits.CLOUDFLARE_DAILY}
                    percent={cfPercent}
                    resetTime={stats.timeUntilReset}
                    color="cyan"
                />
                <QuotaCard
                    label="Gemini Flash-Lite"
                    used={stats.usage.gemini}
                    limit={stats.limits.GEMINI_FLASH_DAILY}
                    percent={geminiPercent}
                    resetTime={stats.timeUntilReset}
                    color="purple"
                />
            </div>

            {stats.isPaidEnabled && (
                <div className="p-4 rounded-2xl bg-red-900/10 border border-red-500/20 flex items-center gap-4">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <div>
                        <div className="text-xs font-black text-red-400 uppercase tracking-wider">Emergency Overflow Active</div>
                        <div className="text-[10px] text-red-300/50 uppercase tracking-widest font-mono">
                            Current Spend: ${stats.usage.paidUsd.toFixed(4)} / ${stats.limits.PAID_HARD_LIMIT_USD.toFixed(2)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const QuotaCard = ({ label, used, limit, percent, resetTime, color }: any) => (
    <div className="p-5 bg-white/5 border border-white/5 rounded-3xl relative overflow-hidden group hover:border-white/10 transition-colors">
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
                <h4 className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{label}</h4>
                <div className={`text-2xl font-black ${color === 'cyan' ? 'text-cyan-400' : 'text-purple-400'} font-mono`}>
                    {used.toLocaleString()} <span className="text-sm text-slate-600">/ {limit.toLocaleString()}</span>
                </div>
            </div>
            <div className="text-[9px] font-black text-slate-600 bg-black/40 px-2 py-1 rounded-lg">
                RESETS IN {resetTime}
            </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden relative z-10">
            <div
                className={`h-full rounded-full transition-all duration-1000 ${color === 'cyan' ? 'bg-cyan-500' : 'bg-purple-500'}`}
                style={{ width: `${Math.min(percent, 100)}%` }}
            />
        </div>

        {/* Background Glow */}
        <div className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full blur-[50px] opacity-10 ${color === 'cyan' ? 'bg-cyan-500' : 'bg-purple-500'} group-hover:opacity-20 transition-opacity`} />
    </div>
);
