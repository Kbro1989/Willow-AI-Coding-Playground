
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
  Activity,
  Zap,
  Brain,
  Hammer
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
  addLog?: (message: string, type?: 'info' | 'success' | 'warn' | 'error', source?: string) => void;
}

const GAME_SOURCES: { key: GameSource; label: string; icon: string; count: string; color: string }[] = [
  { key: 'runescape', label: 'RuneScape', icon: '⚔️', count: '~50,000', color: 'cyan' },
  { key: 'morrowind', label: 'Morrowind', icon: '🌋', count: '~5,000', color: 'amber' },
  { key: 'fallout', label: 'Fallout NV', icon: '☢️', count: '~10,000', color: 'emerald' },
];

const ModelPreview: React.FC<{ model: RSMVModelEntry | null, wireframe: boolean }> = ({ model, wireframe }) => {
  const meshRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.01;
  });

  if (!model) return <Html center><div className="text-cyan-500 text-xs font-bold uppercase tracking-widest animate-pulse">Select a model</div></Html>;

  // If it's a real model and we have it locally, use the real viewer
  if ((model.gameSource === 'runescape' && model.id > 0) || model.filePath) {
    return (
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <ErrorBoundary fallback={<mesh><icosahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#333" wireframe /></mesh>}>
          <RealModelView modelId={model.id} filePath={model.filePath} wireframe={wireframe} />
        </ErrorBoundary>
      </Float>
    );
  }

  const geometry = useMemo(() => new THREE.IcosahedronGeometry(2, Math.min(Math.floor((model.vertexCount || 100) / 100), 4)), [model.id, model.vertexCount]);
  const color = useMemo(() => {
    switch (model.category) {
      case 'items': return '#00f2ff';
      case 'npcs': return '#ff6b6b';
      case 'objects': return '#10b981';
      case 'models': return '#a855f7';
    }
    return '#ccc';
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

const RealModelView = React.lazy(() => import('./RSMV/RealModelView').then(m => ({ default: m.RealModelView })));
import { getRsmvModels, verifyJagexLauncher, FEATURED_MODELS } from '../services/rsmvService';
import { loadRSMV } from '../services/rsmv/rsmvLoader';
import { BethesdaAssetService } from '../services/bethesdaAssetService';
const AudioClipManager = React.lazy(() => import('../services/rsmv/viewer/AudioClipManager').then(m => ({ default: m.AudioClipManager })));

const RSMVBrowser: React.FC<RSMVBrowserProps> = ({
  onSelectModel,
  onImportModel,
  initialCategory = 'items',
  initialGameSource = 'runescape',
  addLog = () => { }
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
  const [activeActionTab, setActiveActionTab] = useState<'details' | 'nexus' | 'metrics' | 'audio'>('details');
  const controlsRef = useRef<any>(null);

  const [isCacheLinked, setIsCacheLinked] = useState(false);
  const [isBethesdaLinked, setIsBethesdaLinked] = useState<Record<string, boolean>>({ morrowind: false, fallout: false });
  const [isRemoteModalOpen, setIsRemoteModalOpen] = useState(false);
  const [remoteCacheId, setRemoteCacheId] = useState('1');
  const [remoteModelId, setRemoteModelId] = useState('0');
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const REFERENCE_MODELS = [
    { name: 'Primary (High Poly)', path: 'C:\\Users\\Destiny\\Desktop\\Pick of Gods\\3D model\\model.glb' },
    { name: 'Optimized (Low Poly)', path: 'C:\\Users\\Destiny\\Desktop\\Pick of Gods\\3D model\\model2.stl' }
  ];

  const handleRemoteImport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const RSMVEngine = await loadRSMV();
      const rsmvModel = await RSMVEngine.getRemoteModelData(
        parseInt(remoteCacheId),
        parseInt(remoteModelId)
      );
      if (rsmvModel) {
        const newModel: RSMVModelEntry = {
          id: parseInt(remoteModelId),
          name: `Remote Model ${remoteModelId}`,
          category: 'models',
          gameSource: 'runescape',
          vertexCount: (rsmvModel.metadata as any).meshes.reduce((a: any, b: any) => a + b.indices.count, 0) / 3
        };
        setSelectedModel(newModel);
        setModels(prev => [newModel, ...prev]);
        setIsRemoteModalOpen(false);
      } else {
        setError("Failed to fetch remote model. Check Cache/Model IDs.");
      }
    } catch (err: any) {
      setError(`Remote Import Failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkCache = async () => {
    setIsLoading(true);
    try {
      const RSMVEngine = await loadRSMV();
      await RSMVEngine.linkLocalCache();
      setIsCacheLinked(true);
      const data = await getRsmvModels(gameSource, category);
      setModels(data);
    } catch (err: any) {
      setError(`Cache Link Failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const items = e.dataTransfer.items;
    if (!items) return;

    setIsLoading(true);
    setError(null);

    try {
      const blobs: Record<string, Blob> = {};

      // Process files
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file && (file.name.endsWith('.jcache') || file.name.endsWith('.jag') || file.name.endsWith('.mem'))) {
            blobs[file.name] = file;
          }
        }
      }

      if (Object.keys(blobs).length === 0) {
        throw new Error("No valid cache files (.jcache, .jag, .mem) found in drop.");
      }

      const RSMVEngine = await loadRSMV();
      await RSMVEngine.linkDroppedCache(blobs);
      setIsCacheLinked(true);
      const data = await getRsmvModels('runescape', category);
      setModels(data);
      console.log(`[RSMV_BROWSER] Successfully linked ${Object.keys(blobs).length} dropped files.`);
    } catch (err: any) {
      setError(`Drop Import Failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleLinkBethesdaAssets = async (source: GameSource) => {
    setIsLoading(true);
    try {
      const success = await BethesdaAssetService.getInstance().linkLocalAssets(source);
      if (success) {
        setIsBethesdaLinked(prev => ({ ...prev, [source]: true }));
        const models = await BethesdaAssetService.getInstance().getModels(source);
        if (models.length > 0) {
          setModels(models);
        }
      }
    } catch (err: any) {
      setError(`Asset Link Failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { verifyJagexLauncher().then(setIsLauncherLinked); }, []);

  const ITEMS_PER_PAGE = 40;
  const filteredModels = useMemo(() => models.filter(m =>
    !searchQuery ||
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.id.toString().includes(searchQuery) ||
    m.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  ), [models, searchQuery]);

  // Listen for Global RSMV commands
  useEffect(() => {
    const handleGlobalSearch = (e: CustomEvent) => {
      const { query } = e.detail;
      if (query) setSearchQuery(query);
    };
    window.addEventListener('rsmv:search', handleGlobalSearch as EventListener);
    return () => window.removeEventListener('rsmv:search', handleGlobalSearch as EventListener);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchModels = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getRsmvModels(gameSource, category);
        if (isMounted) setModels(data.length > 0 ? data : FEATURED_MODELS[gameSource] || []);
      } catch (err) {
        if (isMounted) {
          setError('Failed to sync with Nexus Registry');
          setModels(FEATURED_MODELS[gameSource] || []);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchModels();
    return () => { isMounted = false; };
  }, [gameSource, category]);


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

  const handleNarrativeAI = async () => {
    if (!selectedModel) return;
    setIsLoading(true);
    setAnalysisText(`Synthesizing narrative lineage for "${selectedModel.name}"...`);
    try {
      const { modelRouter } = await import('../services/modelRouter');
      const { directorMemory } = await import('../services/directorMemoryService');

      const prompt = `Act as an Ancient Historian of Gielinor. Generate a deep, atmospheric lore snippet for the asset: "${selectedModel.name}". 
      Examine text: "${selectedModel.examine || ''}".
      Include origin myths, legendary owners, and current status in the world.
      Output ONLY the lore text (max 150 words).`;

      const response = await modelRouter.route({ type: 'text', prompt, tier: 'premium' });
      const lore = 'content' in response ? response.content : 'Lore synthesis failed.';

      if (lore) {
        await directorMemory.addLore(selectedModel.name, lore, selectedModel.gameSource);
        setAnalysisText(lore);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgeBridge = (target: 'forge' | 'shader') => {
    if (!selectedModel) return;
    addLog(`Bridging asset ${selectedModel.name} to ${target}...`, 'info', 'Nexus');

    // Dispatch full payload via global event
    window.dispatchEvent(new CustomEvent('rsmv:ingest', {
      detail: {
        model: selectedModel,
        target,
        timestamp: Date.now()
      }
    }));

    (window as any).antigravity?.setTab(target);
  };

  const categories: { key: ModelCategory; label: string; icon: React.ReactNode }[] = [
    { key: 'items', label: 'Items', icon: <Package className="w-4 h-4" /> },
    { key: 'npcs', label: 'NPCs', icon: <User className="w-4 h-4" /> },
    { key: 'objects', label: 'Objects', icon: <Home className="w-4 h-4" /> },
    { key: 'models', label: 'Raw Models', icon: <Box className="w-4 h-4" /> },
  ];

  return (
    <div
      className="flex h-full bg-[#232323] text-[#aaa] overflow-hidden font-sans relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-[100] bg-cyan-500/10 backdrop-blur-md border-4 border-dashed border-cyan-500 flex items-center justify-center pointer-events-none animate-in fade-in duration-200">
          <div className="bg-[#0a1222] p-8 rounded-3xl border border-cyan-500/30 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 animate-bounce">
              <Download className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-black text-cyan-400 uppercase tracking-widest">Drop Cache Files</h2>
              <p className="text-[10px] text-cyan-700 font-bold uppercase tracking-wider mt-1">Accepting .jcache, .jag, and .mem</p>
            </div>
          </div>
        </div>
      )}
      <div className="w-72 border-r border-[#394443] flex flex-col bg-[#282e2e]">
        <div className="p-4 border-b border-[#394443] bg-[#232323]">
          <h2 className="text-lg font-black uppercase tracking-widest text-[#438ab5] flex items-center gap-2">
            <Box className="w-5 h-5" /> ASSET VAULT
          </h2>
          <p className="text-[9px] text-[#8397a5] uppercase tracking-wider mt-1">Multi-Game Matrix Database</p>
        </div>

        <div className="flex flex-col gap-2 p-3">
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
          {gameSource === 'runescape' && (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleLinkCache}
                disabled={isCacheLinked}
                className={`w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${isCacheLinked ? 'bg-[#3e5b6d] border-[#438ab5] text-white' : 'bg-[#232323] border-[#394443] text-[#438ab5] hover:bg-[#394443]'}`}
              >
                {isCacheLinked ? '✅ LOCAL CACHE ACTIVE' : '🔗 LINK LOCAL CACHE'}
              </button>
              <button
                onClick={() => setIsRemoteModalOpen(true)}
                className="w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border bg-[#232323] border-[#394443] text-[#438ab5] hover:bg-[#394443]"
              >
                📡 REMOTE IMPORT (OPENRS2)
              </button>
            </div>
          )}

          {(gameSource === 'morrowind' || gameSource === 'fallout') && (
            <button
              onClick={() => handleLinkBethesdaAssets(gameSource)}
              disabled={isBethesdaLinked[gameSource]}
              className={`w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${isBethesdaLinked[gameSource] ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400' : 'bg-amber-600/10 border-amber-500/30 text-amber-400 animate-pulse'}`}
            >
              {isBethesdaLinked[gameSource] ? '✅ Assets Linked' : '🔗 Link Local Assets'}
            </button>
          )}
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
                {(['details', 'nexus', 'metrics', 'audio'] as const).map(tab => (
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
                      <button onClick={() => setActiveActionTab('audio')} className="group flex flex-col items-center gap-3 p-4 bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/20 rounded-2xl transition-all">
                        <div className="p-3 bg-cyan-500/20 rounded-xl group-hover:scale-110 transition-transform text-cyan-400"><User className="w-5 h-5" /></div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-cyan-300">Voice Synth</span>
                      </button>

                      {/* Schematic Bridges */}
                      <button onClick={() => handleForgeBridge('shader')} className="group flex flex-col items-center gap-3 p-4 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 rounded-2xl transition-all">
                        <div className="p-3 bg-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform text-emerald-400"><Zap className="w-5 h-5" /></div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300">Material Forge</span>
                      </button>
                      <button onClick={handleNarrativeAI} className="group flex flex-col items-center gap-3 p-4 bg-orange-600/10 hover:bg-orange-600/20 border border-orange-500/20 rounded-2xl transition-all">
                        <div className="p-3 bg-orange-500/20 rounded-xl group-hover:scale-110 transition-transform text-orange-400"><Brain className="w-5 h-5" /></div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-orange-300">Narrative AI</span>
                      </button>
                      <button onClick={() => handleForgeBridge('forge')} className="group flex flex-col items-center gap-3 p-4 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 rounded-2xl transition-all">
                        <div className="p-3 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform text-blue-400"><Hammer className="w-5 h-5" /></div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-blue-300">Reforge Engine</span>
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

                {activeActionTab === 'audio' && (
                  <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Suspense fallback={<div className="text-cyan-500 animate-pulse">Loading Voice Studio...</div>}>
                      <AudioClipManager />
                    </Suspense>
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
      {/* Remote Import Modal */}
      {isRemoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#394443] rounded-lg shadow-2xl border border-[#438ab5] overflow-hidden animate-in zoom-in duration-200">
            <div className="p-4 bg-[#282e2e] border-b border-[#394443] flex justify-between items-center">
              <h3 className="text-[#438ab5] font-black uppercase tracking-widest text-sm flex items-center gap-2">
                <Activity className="w-4 h-4" /> REMOTE ASSET IMPORT
              </h3>
              <button onClick={() => setIsRemoteModalOpen(false)} className="text-[#8397a5] hover:text-white">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-[#8397a5]">OpenRS2 Cache ID</label>
                <input
                  type="text"
                  value={remoteCacheId}
                  onChange={(e) => setRemoteCacheId(e.target.value)}
                  className="w-full bg-[#232323] border border-[#394443] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#438ab5]"
                  placeholder="e.g. 1773"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-[#8397a5]">Model ID</label>
                <input
                  type="text"
                  value={remoteModelId}
                  onChange={(e) => setRemoteModelId(e.target.value)}
                  className="w-full bg-[#232323] border border-[#394443] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#438ab5]"
                  placeholder="e.g. 300"
                />
              </div>
              <button
                onClick={handleRemoteImport}
                disabled={isLoading}
                className="w-full py-3 bg-[#438ab5] hover:bg-[#3e5b6d] text-white font-black uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <span className="animate-spin">🔄</span> : <Download className="w-4 h-4" />}
                PULL FROM ARCHIVE
              </button>
            </div>
          </div>
        </div>
      )}
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
