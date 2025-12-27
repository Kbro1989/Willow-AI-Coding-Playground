
import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import {
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Grid3X3,
  Download,
  Search,
  Box,
  User,
  Home,
  Package,
  Activity
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export type GameSource = 'runescape' | 'morrowind' | 'fallout';
export type ModelCategory = 'items' | 'npcs' | 'objects' | 'models' | 'animations';

export interface RSMVModelEntry {
  id: number;
  name: string;
  category: ModelCategory;
  gameSource: GameSource;
  thumbnailUrl?: string;
  vertexCount?: number;
  materialCount?: number;
  boneCount?: number;
  description?: string;
  tags?: string[];
  examine?: string;
  filePath?: string;
  modelUrl?: string;
}

export interface RSMVBrowserProps {
  onSelectModel?: (model: RSMVModelEntry) => void;
  onImportModel?: (model: RSMVModelEntry) => void;
  initialCategory?: ModelCategory;
  initialGameSource?: GameSource;
}

const GAME_SOURCES: { key: GameSource; label: string; icon: string; count: string; color: string }[] = [
  { key: 'runescape', label: 'RuneScape', icon: '⚔️', count: '~50,000', color: 'cyan' },
  { key: 'morrowind', label: 'Morrowind', icon: '🌋', count: '~5,000', color: 'amber' },
  { key: 'fallout', label: 'Fallout NV', icon: '☢️', count: '~10,000', color: 'emerald' },
];

const RUNESCAPE_MODELS: RSMVModelEntry[] = [
  { id: 4151, name: 'Abyssal whip', category: 'items', gameSource: 'runescape', vertexCount: 342, materialCount: 2, tags: ['weapon', 'melee', 'slayer'], examine: 'A weapon from the abyss.' },
  { id: 11694, name: 'Armadyl godsword', category: 'items', gameSource: 'runescape', vertexCount: 1024, materialCount: 3, tags: ['weapon', 'melee', 'godsword'], examine: 'A very powerful godsword.' },
  { id: 1050, name: 'Santa hat', category: 'items', gameSource: 'runescape', vertexCount: 128, materialCount: 1, tags: ['holiday', 'rare'], examine: 'Ho ho ho!' },
  { id: 11286, name: 'Draconic visage', category: 'items', gameSource: 'runescape', vertexCount: 512, materialCount: 2, tags: ['rare', 'dragon'], examine: 'This could be attached to an anti-dragon shield.' },
  { id: 50, name: 'King Black Dragon', category: 'npcs', gameSource: 'runescape', vertexCount: 4096, materialCount: 6, boneCount: 48, tags: ['boss', 'dragon'], description: 'A fearsome three-headed dragon.' },
];

const MORROWIND_MODELS: RSMVModelEntry[] = [
  { id: 1, name: 'Frost Atronach', category: 'npcs', gameSource: 'morrowind', vertexCount: 3200, materialCount: 4, boneCount: 24, tags: ['daedra', 'summon'], filePath: 'Meshes/Atronach_Frost.nif' },
  { id: 101, name: 'Torch Fire', category: 'objects', gameSource: 'morrowind', vertexCount: 128, materialCount: 1, tags: ['light', 'fire'], filePath: 'Meshes/torchfire.nif' },
];

const FALLOUT_MODELS: RSMVModelEntry[] = [
  { id: 1, name: 'Securitron', category: 'npcs', gameSource: 'fallout', vertexCount: 4500, materialCount: 6, boneCount: 28, tags: ['robot', 'vegas'], description: 'Mr. House\'s robotic army.' },
  { id: 101, name: 'Pip-Boy 3000', category: 'items', gameSource: 'fallout', vertexCount: 1800, materialCount: 4, tags: ['wrist', 'computer'], description: 'Your personal computer.' },
];

const ALL_MODELS: Record<GameSource, RSMVModelEntry[]> = {
  runescape: RUNESCAPE_MODELS,
  morrowind: MORROWIND_MODELS,
  fallout: FALLOUT_MODELS,
};

const ModelPreview: React.FC<{ model: RSMVModelEntry | null, wireframe: boolean }> = ({ model, wireframe }) => {
  const meshRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.01;
  });

  if (!model) return <Html center><div className="text-cyan-500 text-xs font-bold uppercase tracking-widest animate-pulse">Select a model</div></Html>;

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(2, Math.min(Math.floor((model.vertexCount || 100) / 100), 4)), [model.id, model.vertexCount]);
  const color = useMemo(() => {
    switch (model.category) {
      case 'items': return '#00f2ff';
      case 'npcs': return '#ff6b6b';
      case 'objects': return '#10b981';
      case 'models': return '#a855f7';
    }
  }, [model.category]);

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <ErrorBoundary fallback={<mesh><icosahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#333" wireframe /></mesh>}>
        <group ref={meshRef}>
          <mesh geometry={geometry}>
            <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} emissive={color} emissiveIntensity={0.1} wireframe={wireframe} />
          </mesh>
          <mesh geometry={geometry} scale={1.05}>
            <meshBasicMaterial color={color} transparent opacity={0.1} wireframe />
          </mesh>
        </group>
      </ErrorBoundary>
    </Float>
  );
};

import { getRsmvModels, verifyJagexLauncher } from '../services/rsmvService';

const RSMVBrowser: React.FC<RSMVBrowserProps> = ({
  onSelectModel,
  onImportModel,
  initialCategory = 'items',
  initialGameSource = 'runescape'
}) => {
  const [gameSource, setGameSource] = useState<GameSource>(initialGameSource);
  const [category, setCategory] = useState<ModelCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState<RSMVModelEntry | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<RSMVModelEntry[]>([]);
  const [wireframe, setWireframe] = useState(false);
  const [isLauncherLinked, setIsLauncherLinked] = useState(false);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReferenceIdx, setSelectedReferenceIdx] = useState(0);
  const [activeActionTab, setActiveActionTab] = useState<'details' | 'nexus' | 'metrics'>('details');
  const controlsRef = useRef<any>(null);

  const REFERENCE_MODELS = [
    { name: 'Primary (High Poly)', path: 'C:\\Users\\Destiny\\Desktop\\Pick of Gods\\3D model\\model.glb' },
    { name: 'Optimized (Low Poly)', path: 'C:\\Users\\Destiny\\Desktop\\Pick of Gods\\3D model\\model2.stl' }
  ];

  useEffect(() => { verifyJagexLauncher().then(setIsLauncherLinked); }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchModels = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getRsmvModels(gameSource, category);
        if (isMounted) setModels(data.length > 0 ? data : ALL_MODELS[gameSource] || []);
      } catch (err) {
        if (isMounted) {
          setError('Failed to sync with Nexus Registry');
          setModels(ALL_MODELS[gameSource] || []);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchModels();
    return () => { isMounted = false; };
  }, [gameSource, category]);

  const ITEMS_PER_PAGE = 40;
  const filteredModels = useMemo(() => models.filter(m =>
    !searchQuery ||
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.id.toString().includes(searchQuery) ||
    m.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  ), [models, searchQuery]);

  const totalPages = Math.ceil(filteredModels.length / ITEMS_PER_PAGE);
  const paginatedModels = filteredModels.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSelectModel = (model: RSMVModelEntry) => { setSelectedModel(model); onSelectModel?.(model); };
  const handleImportModel = () => { if (selectedModel) onImportModel?.(selectedModel); };
  const handleResetView = () => { if (controlsRef.current) controlsRef.current.reset(); };

  const handleCompareWithReference = async () => {
    if (!selectedModel) return;
    setIsLoading(true);
    setAnalysisText(`Analyzing "${REFERENCE_MODELS[selectedReferenceIdx].name}"...`);
    try {
      const { modelRouter } = await import('../services/modelRouter');
      const response = await modelRouter.route({
        type: 'text',
        prompt: `Compare RSMV Asset "${selectedModel.name}" with reference model. Focus on topography and optimization.`,
        tier: 'premium'
      });
      setAnalysisText(('content' in response ? response.content : 'Analysis failed.') || 'No content returned.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrchestrate = async (type: 'image' | 'video' | '3d') => {
    if (!selectedModel) return;
    setIsLoading(true);
    setAnalysisText(`Orchestrating ${type} synthesis for "${selectedModel.name}"...`);
    try {
      const { modelRouter } = await import('../services/modelRouter');
      const response = await modelRouter.orchestrateMedia(
        type as any,
        `Generate a high-fidelity ${type} asset based on the RuneScape model: ${selectedModel.name}. ${selectedModel.examine || ''}`,
        `Game Source: ${selectedModel.gameSource}, Category: ${selectedModel.category}`
      );
      setAnalysisText(response.content || 'Synthesis complete.');
      if (response.imageUrl || response.videoUrl || response.modelUrl) {
        console.log(`[ORCHESTRATION] Asset Generated:`, response.imageUrl || response.videoUrl || response.modelUrl);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const categories: { key: ModelCategory; label: string; icon: React.ReactNode }[] = [
    { key: 'items', label: 'Items', icon: <Package className="w-4 h-4" /> },
    { key: 'npcs', label: 'NPCs', icon: <User className="w-4 h-4" /> },
    { key: 'objects', label: 'Objects', icon: <Home className="w-4 h-4" /> },
    { key: 'models', label: 'Raw Models', icon: <Box className="w-4 h-4" /> },
  ];

  return (
    <div className="flex h-full bg-[#050a15] text-white overflow-hidden">
      <div className="w-72 border-r border-cyan-900/30 flex flex-col bg-[#0a1222]/50">
        <div className="p-4 border-b border-cyan-900/30 bg-gradient-to-r from-cyan-950/50 to-transparent">
          <h2 className="text-lg font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2">
            <Box className="w-5 h-5" /> Model Browser
          </h2>
          <p className="text-[9px] text-slate-500 uppercase tracking-wider mt-1">Multi-Game Asset Library</p>
        </div>

        <div className="p-3 border-b border-cyan-900/30">
          <div className="flex gap-1">
            {GAME_SOURCES.map(gs => (
              <button
                key={gs.key}
                onClick={() => { setGameSource(gs.key); setSelectedModel(null); setCurrentPage(1); }}
                className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${gameSource === gs.key ? 'bg-cyan-600 text-white' : 'bg-cyan-950/30 text-slate-500 hover:text-cyan-400'}`}
                style={gameSource === gs.key ? { backgroundColor: gs.color === 'cyan' ? '#0891b2' : gs.color === 'amber' ? '#d97706' : '#059669' } : {}}
              >
                <span className="text-lg">{gs.icon}</span>
                <span className="text-[8px] font-bold uppercase tracking-wider">{gs.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-b border-cyan-900/30">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search assets..."
              className="w-full bg-black/40 border border-cyan-900/40 rounded-xl px-4 py-2.5 text-xs text-cyan-50 outline-none focus:border-cyan-500"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-600" />
          </div>
        </div>

        <div className="p-4 space-y-2">
          <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Categories</h3>
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => { setCategory(cat.key as any); setCurrentPage(1); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${category === cat.key ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-cyan-950/30'}`}
            >
              {cat.icon}
              <span className="text-xs font-bold uppercase tracking-wider">{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar border-t border-cyan-900/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              {isLoading ? 'Syncing...' : `Results (${filteredModels.length})`}
            </h3>
            <div className="flex gap-1">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-cyan-600 text-white' : 'text-slate-500'}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-cyan-600 text-white' : 'text-slate-500'}`}><List className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          <div className="space-y-2">
            {paginatedModels.map(model => (
              <button
                key={`${model.category}-${model.id}`}
                onClick={() => handleSelectModel(model)}
                className={`w-full p-3 rounded-xl text-left border transition-all ${selectedModel?.id === model.id ? 'border-cyan-500 bg-cyan-950/50' : 'border-cyan-900/20 bg-black/20 hover:border-cyan-700/50'}`}
              >
                <div className="text-[8px] text-cyan-600 font-mono">#{model.id}</div>
                <div className="text-[10px] font-bold text-cyan-50 truncate">{model.name}</div>
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-cyan-900/30">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1 disabled:opacity-20"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-[9px] font-mono text-cyan-700 uppercase">Page {currentPage} / {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-1 disabled:opacity-20"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 bg-[#050a15]">
          <Canvas shadows>
            <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
            <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.05} />
            <Environment preset="night" />
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} intensity={1} castShadow />
            <Suspense fallback={null}>
              <ModelPreview model={selectedModel} wireframe={wireframe} />
            </Suspense>
            <gridHelper args={[20, 20, '#00f2ff', '#0a1222']} />
          </Canvas>

          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button onClick={handleResetView} className="p-3 bg-[#0a1222]/90 backdrop-blur-lg border border-cyan-900/30 rounded-xl text-cyan-400 hover:bg-cyan-600 transition-all shadow-xl"><RotateCcw className="w-4 h-4" /></button>
            <button onClick={() => setWireframe(!wireframe)} className={`p-3 bg-[#0a1222]/90 backdrop-blur-lg border rounded-xl transition-all shadow-xl ${wireframe ? 'bg-cyan-600 border-cyan-400' : 'border-cyan-900/30 text-cyan-400'}`}><Grid3X3 className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="h-72 border-t border-cyan-900/30 bg-[#0a1222]/80 backdrop-blur-2xl overflow-hidden flex flex-col">
          {selectedModel ? (
            <>
              <div className="flex border-b border-cyan-900/20 bg-black/20">
                {(['details', 'nexus', 'metrics'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveActionTab(tab)}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeActionTab === tab
                      ? 'text-cyan-400 border-cyan-400 bg-cyan-400/5'
                      : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
                {activeActionTab === 'details' && (
                  <div className="grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-black text-cyan-50 mb-1">{selectedModel.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] bg-cyan-600 text-white px-2 py-0.5 rounded font-black uppercase tracking-widest">{selectedModel.category}</span>
                          <span className="text-[9px] text-cyan-600 font-mono">ASSET_ID_{selectedModel.id}</span>
                        </div>
                      </div>
                      {selectedModel.examine && <p className="text-sm text-slate-400 italic">"{selectedModel.examine}"</p>}
                      <div className="flex flex-wrap gap-1.5">
                        {selectedModel.tags?.map(t => <span key={t} className="text-[8px] bg-cyan-950 text-cyan-500 border border-cyan-900/50 px-2 py-1 rounded-full uppercase font-bold">{t}</span>)}
                      </div>
                    </div>
                    <div className="flex flex-col justify-end gap-2">
                      <button onClick={handleImportModel} className="w-full py-4 bg-gradient-to-r from-cyan-600 to-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20 active:scale-[0.98] transition-all">
                        <Download className="w-4 h-4" /> Finalize & Import to Scene
                      </button>
                    </div>
                  </div>
                )}

                {activeActionTab === 'nexus' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-4 gap-3">
                      <button onClick={() => handleOrchestrate('image')} className="group flex flex-col items-center gap-3 p-4 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 rounded-2xl transition-all">
                        <div className="p-3 bg-indigo-500/20 rounded-xl group-hover:scale-110 transition-transform text-indigo-400"><Package className="w-5 h-5" /></div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-indigo-300">Synth Image</span>
                      </button>
                      <button onClick={() => handleOrchestrate('3d')} className="group flex flex-col items-center gap-3 p-4 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 rounded-2xl transition-all">
                        <div className="p-3 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform text-purple-400"><Grid3X3 className="w-5 h-5" /></div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-purple-300">Forge 3D</span>
                      </button>
                      <button onClick={() => handleOrchestrate('video')} className="group flex flex-col items-center gap-3 p-4 bg-fuchsia-600/10 hover:bg-fuchsia-600/20 border border-fuchsia-500/20 rounded-2xl transition-all">
                        <div className="p-3 bg-fuchsia-500/20 rounded-xl group-hover:scale-110 transition-transform text-fuchsia-400"><Activity className="w-5 h-5" /></div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-fuchsia-300">Movie Gen</span>
                      </button>
                      <button onClick={() => handleOrchestrate('audio' as any)} className="group flex flex-col items-center gap-3 p-4 bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/20 rounded-2xl transition-all">
                        <div className="p-3 bg-cyan-500/20 rounded-xl group-hover:scale-110 transition-transform text-cyan-400"><User className="w-5 h-5" /></div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-cyan-300">Voice Synth</span>
                      </button>

                      {/* Schematic Placeholders (Front-end first) */}
                      <button className="group flex flex-col items-center gap-3 p-4 bg-emerald-600/5 border border-emerald-500/10 rounded-2xl opacity-60 cursor-not-allowed grayscale">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400"><Home className="w-5 h-5" /></div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300">Material Forge</span>
                      </button>
                      <button className="group flex flex-col items-center gap-3 p-4 bg-orange-600/5 border border-orange-500/10 rounded-2xl opacity-60 cursor-not-allowed grayscale">
                        <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400"><Search className="w-5 h-5" /></div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-orange-300">Narrative AI</span>
                      </button>
                      <button className="group flex flex-col items-center gap-3 p-4 bg-blue-600/5 border border-blue-500/10 rounded-2xl opacity-60 cursor-not-allowed grayscale">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><Activity className="w-5 h-5" /></div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-blue-300">Physics Tuner</span>
                      </button>
                      <button className="group flex flex-col items-center gap-3 p-4 bg-rose-600/5 border border-rose-500/10 rounded-2xl opacity-60 cursor-not-allowed grayscale">
                        <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400"><Box className="w-5 h-5" /></div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-rose-300">LOD Generator</span>
                      </button>
                    </div>

                    <button onClick={handleCompareWithReference} className="w-full py-3 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-600/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center justify-center gap-2 transition-all">
                      <Search className="w-4 h-4" /> Run Comparative AI Analytics
                    </button>

                    {analysisText && (
                      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl animate-in zoom-in duration-300">
                        <div className="flex items-center gap-2 mb-2 text-amber-500">
                          <Activity className="w-4 h-4" />
                          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Nexus Insight</span>
                        </div>
                        <p className="text-[10px] text-amber-100/70 italic leading-relaxed">{analysisText}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeActionTab === 'metrics' && (
                  <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <MetricCard label="Vertices" value={selectedModel.vertexCount} color="cyan" />
                    <MetricCard label="Materials" value={selectedModel.materialCount} color="emerald" />
                    <MetricCard label="Bones" value={selectedModel.boneCount} color="purple" />
                    <div className="col-span-3 p-4 bg-cyan-950/20 border border-cyan-900/20 rounded-2xl text-[10px] text-cyan-500/60 leading-relaxed font-mono">
                      // PERFORMANCE_TELEMETRY: Model complexity is {(selectedModel.vertexCount || 0) > 5000 ? 'HIGH' : 'OPTIMIZED'}.
                      Draw calls estimated at {(selectedModel.materialCount || 1) * 2}.
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full opacity-30 grayscale text-center p-6">
              <Package className="w-12 h-12 mb-4 text-cyan-900" />
              <p className="text-[10px] font-black uppercase tracking-widest text-cyan-900">Awaiting Asset Selection</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value?: number; color: string }> = ({ label, value, color }) => (
  <div className={`p-3 bg-black/40 rounded-xl border border-${color}-900/20 text-center`}>
    <div className={`text-lg font-black text-${color}-400`}>{value?.toLocaleString() || '?'}</div>
    <div className="text-[8px] text-slate-500 uppercase tracking-wider">{label}</div>
  </div>
);

export default RSMVBrowser;
