import React from 'react';
import { Library, Database, Search, Filter } from 'lucide-react';
import RSMVBrowser from '../RSMVBrowser';

import { GameAsset } from '../../types';

interface RegistryProps {
    onImport?: (asset: GameAsset) => void;
}

const Registry: React.FC<RegistryProps> = ({ onImport }) => {
    return (
        <div className="h-full flex flex-col bg-[#050a15]">
            <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                        <Library className="w-7 h-7 text-cyan-400" />
                        Universal Registry
                    </h1>
                    <p className="text-slate-400 text-xs mt-1">Cross-Game Asset Index & Cache Browser</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input type="text" placeholder="QUERY CACHE..." className="bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-[10px] font-black tracking-widest text-white focus:outline-none focus:border-cyan-500/50" />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <RSMVBrowser
                    onSelectModel={(m) => console.log('Selected:', m)}
                    onImportModel={(m) => {
                        const asset: GameAsset = {
                            id: `rsmv-${Date.now()}`,
                            name: (m as any).name || 'RSMV Model',
                            type: 'mesh',
                            url: (m as any).url || '',
                            tags: ['rsmv', 'registry-import'],
                            status: 'optimized'
                        };
                        onImport?.(asset);
                        console.log('[REGISTRY] Imported asset:', asset);
                    }}
                />
            </div>
        </div>
    );
};

export default Registry;
