import React from 'react';
import { Globe, Wand2, Wind, Sun } from 'lucide-react';
import ShaderGraph from '../ShaderGraph';
import { WorldConfig } from '../../types';

interface WorldProps {
    worldConfig: WorldConfig;
    onUpdateWorld: (updates: Partial<WorldConfig>) => void;
}

const World: React.FC<WorldProps> = ({ worldConfig, onUpdateWorld }) => {

    const handleSynthesizeBiome = () => {
        const biomes: WorldConfig['biome'][] = ['temperate', 'arid', 'arctic', 'volcanic', 'cyber', 'urban'];
        const randomBiome = biomes[Math.floor(Math.random() * biomes.length)];
        onUpdateWorld({
            biome: randomBiome,
            seed: Math.floor(Math.random() * 999999),
            vegetationDensity: Math.random(),
            waterLevel: Math.random() * 0.5,
            atmosphereDensity: Math.random() * 0.5
        });
    };

    return (
        <div className="h-full flex flex-col bg-[#050a15]">
            <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                        <Globe className="w-7 h-7 text-emerald-400" />
                        World Gen
                    </h1>
                    <p className="text-slate-400 text-xs mt-1">Environment Synthesis & Global Shader Parameters</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleSynthesizeBiome}
                        className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2 group"
                    >
                        <Wand2 className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                        Synthesize Biome
                    </button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-4 overflow-hidden">
                <div className="col-span-3 border-r border-white/5">
                    <ShaderGraph
                        onCompile={(code) => console.log('Compiling Shader:', code)}
                        onApplyToObjects={() => console.log('Applying to World Objects')}
                    />
                </div>
                <div className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Atmosphere Scalars</h3>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                                    <span>Seed</span>
                                    <span className="font-mono text-emerald-500">#{worldConfig.seed}</span>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                                    <span>Atmosphere Density</span>
                                    <span>{worldConfig.atmosphereDensity.toFixed(2)}</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${worldConfig.atmosphereDensity * 100}%` }}></div>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                                    <span>Water Level</span>
                                    <span>{worldConfig.waterLevel.toFixed(2)}</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${worldConfig.waterLevel * 100}%` }}></div>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                                    <span>Veg Density</span>
                                    <span>{worldConfig.vegetationDensity.toFixed(2)}</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${worldConfig.vegetationDensity * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default World;
