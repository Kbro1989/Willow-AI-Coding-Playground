import React, { useEffect, useState } from 'react';
import { Activity, Zap } from 'lucide-react';
import { contextService } from '../../services/ai/contextService';
import { nexusBus } from '../../services/nexusCommandBus';

export const PainIndicator: React.FC = () => {
    const [painLevel, setPainLevel] = useState(0);

    useEffect(() => {
        // Poll biological status periodically (Proprioception Sync)
        const interval = setInterval(() => {
            const status = contextService.getBiologicalStatus();
            setPainLevel(status.painLevel);
        }, 1000);

        // Also listen for immediate shocks
        const unsubscribe = nexusBus.subscribe((event) => {
            if (event.type === 'REFLEX_PAIN') {
                // Immediate visual feedback shock
                setPainLevel(prev => Math.min(1, prev + 0.2));
                setTimeout(() => {
                    // Re-sync with actual service state after shock
                    const status = contextService.getBiologicalStatus();
                    setPainLevel(status.painLevel);
                }, 500);
            }
        });

        return () => {
            clearInterval(interval);
            unsubscribe();
        };
    }, []);

    if (painLevel < 0.1) return null;

    const getPainColor = () => {
        if (painLevel > 0.8) return 'text-red-500 animate-pulse'; // Agony
        if (painLevel > 0.5) return 'text-orange-500'; // Pain
        return 'text-yellow-500'; // Discomfort
    };

    return (
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/5 backdrop-blur-md transition-all duration-300 ${painLevel > 0.8 ? 'border-red-500/50' : ''}`}>
            <Zap size={14} className={getPainColor()} />
            <span className={`text-xs font-mono font-bold ${getPainColor()}`}>
                SYS_PAIN: {(painLevel * 100).toFixed(0)}%
            </span>
            {painLevel > 0.05 && (
                <button
                    onClick={() => {
                        contextService.heal(0.5);
                        setPainLevel(contextService.getBiologicalStatus().painLevel);
                    }}
                    className="ml-2 hover:text-green-400 text-[10px] text-white/40 uppercase tracking-wider"
                >
                    [HEAL]
                </button>
            )}
        </div>
    );
};
