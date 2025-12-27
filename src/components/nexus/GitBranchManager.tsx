import React, { useState, useEffect } from 'react';
import { GitBranch, Plus, ChevronRight, CheckCircle2 } from 'lucide-react';
import { getBranches, createBranch } from '../../services/gitService';

/**
 * GitBranchManager Component
 * Allows users to manage Git branches directly from the engine UI
 */
export const GitBranchManager: React.FC = () => {
    const [branches, setBranches] = useState<string[]>([]);
    const [currentBranch, setCurrentBranch] = useState('main');
    const [newBranchName, setNewBranchName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadBranches();
    }, []);

    const loadBranches = async () => {
        const data = await getBranches();
        setBranches(data.all);
        setCurrentBranch(data.current);
    };

    const handleCreateBranch = async () => {
        if (!newBranchName) return;
        setIsCreating(true);
        const res = await createBranch(newBranchName);
        if (res.success) {
            setNewBranchName('');
            loadBranches();
        }
        setIsCreating(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-purple-400" />
                        Source Branches
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase">Nexus Project Versioning</p>
                </div>
            </div>

            {/* Current Branch */}
            <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <GitBranch className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Active Sync Target</div>
                        <div className="text-white font-mono text-xs">{currentBranch}</div>
                    </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-purple-500" />
            </div>

            {/* Branch List */}
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Available Branches</label>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                    {branches.map(branch => (
                        <div
                            key={branch}
                            className={`p-3 rounded-xl border transition-all flex items-center justify-between group ${branch === currentBranch
                                    ? 'bg-white/5 border-white/10'
                                    : 'bg-transparent border-white/5 hover:border-white/20'
                                }`}
                        >
                            <span className={`text-[11px] font-mono ${branch === currentBranch ? 'text-white' : 'text-slate-500'}`}>
                                {branch}
                                {branch === 'main' && <span className="ml-2 text-[8px] opacity-50 font-sans">[PRODUCTION]</span>}
                            </span>
                            <ChevronRight className="w-3 h-3 text-white/0 group-hover:text-white/50 transition-all" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Create Branch */}
            <div className="space-y-3 pt-4 border-t border-white/5">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Spawn New Branch</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        placeholder="feature/neural-sync..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono text-cyan-300 focus:border-purple-500 outline-none transition-all placeholder:text-slate-700"
                    />
                    <button
                        onClick={handleCreateBranch}
                        disabled={isCreating || !newBranchName}
                        className="p-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-lg"
                    >
                        {isCreating ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GitBranchManager;
