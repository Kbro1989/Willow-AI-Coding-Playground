
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileNode, ProjectState, TerminalLine, GitCommit, TodoTask,
  TokenMetrics, BuildInfo, GameAsset, SceneObject, PhysicsConfig,
  PipelineConfig, RenderConfig, CompositingConfig, SimulationState,
  WorldConfig, SculptPoint, EngineAction, EngineLog, NeuralNode, NeuralEdge,
  Workspace, Message, UserPreferences, Extension, ActiveView, AIModelMode, ProjectEnv, SyncMode
} from './types';

// Lucide Icons for the Command Spine and Sidebars
import {
  LayoutDashboard, Brain, Code2, Box, Hammer, Blocks,
  Bot, Library, Globe, Database, Users, Activity,
  Ship, Settings, Search, Undo2, Redo2, Bell,
  Cpu, ShieldAlert, ChevronDown, Zap, PenTool
} from 'lucide-react';

// Common Components
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Terminal from './components/Terminal';
import Chat, { ChatHandle } from './components/Chat';
import GameDashboard from './components/GameDashboard';
import PipelineBuilder from './components/PipelineBuilder';
import BehaviorTreeEditor from './components/BehaviorTreeEditor';
import ShaderGraph from './components/ShaderGraph';
import Copywriter from './components/Copywriter';
import RSMVBrowser from './components/RSMVBrowser';
import DiagnosticsPanel from './components/DiagnosticsPanel';
import ApiKeyManager from './components/ApiKeyManager';
import ErrorBoundary from './components/ErrorBoundary';
import SignIn from './components/auth/SignIn';
import N8NWorkflow from './components/N8NWorkflow';
import { CommandSpine } from './components/layout/CommandSpine';
import { PrimaryNav } from './components/layout/PrimaryNav';

// Nexus Specialized Components (Phase 1 Scaffolding)
import Director from './components/nexus/Director';
import Matrix from './components/nexus/Matrix';
import Forge from './components/nexus/Forge';
import Behavior from './components/nexus/Behavior';
import Deploy from './components/nexus/Deploy';
import Registry from './components/nexus/Registry';
import World from './components/nexus/World';
import Persistence from './components/nexus/Persistence';
import Link from './components/nexus/Link';
import Config from './components/nexus/Config';
import Narrative from './components/nexus/Narrative';

// Services
import { initialFiles } from './constants';
import { cloudlareLimiter as limiter } from './services/cloudflareService';
import { db } from './lib/db';
import { initializeAgentAPI } from './services/agentAPI';
import { nexusBus } from './services/nexusCommandBus';
import { localBridgeClient } from './services/localBridgeService';

// Media components (Forge migration targets)
import AudioWorkshop from './components/media/AudioWorkshop';
import ModelStudio from './components/media/ModelStudio';
import ImageStudio from './components/media/ImageStudio';
import { VideoStudio } from './components/media/VideoStudio';
import { CodeLibrary } from './components/media/CodeLibrary';
import { CollaborativeCanvas } from './components/media/CollaborativeCanvas';

// Configuration Constants
const DEFAULT_WORKSPACE_NAME = 'Antigravity Studio PRO v4.2';
const STORAGE_KEY = 'antigravity_pro_workspace_v2';
const initialExtensions: Extension[] = []; // In a real app, populate or load from FS

// UI Types imported from types.ts

const App: React.FC = () => {
  // --- Authentication ---
  const { isLoading, user, error } = db.useAuth();

  // --- Nexus Control Plane State ---
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [aiMode, setAiMode] = useState<AIModelMode>('assist');
  const [projectEnv, setProjectEnv] = useState<ProjectEnv>('dev');
  const [isPanic, setIsPanic] = useState(false);
  const [showPerformanceHUD, setShowPerformanceHUD] = useState(false);
  const [showApiKeyManager, setShowApiKeyManager] = useState(false);

  // --- Core Engine State (World State) ---
  const [project, setProject] = useState<ProjectState>({ id: 'init', name: 'Init', files: initialFiles, activeFile: 'src/App.tsx' });
  const [sceneObjects, setSceneObjects] = useState<SceneObject[]>([]);
  const [physics, setPhysics] = useState<PhysicsConfig>({ gravity: -9.81, friction: 0.6, atmosphere: 'normal', timeScale: 1.0 });
  const [worldConfig, setWorldConfig] = useState<WorldConfig>({ seed: 999, terrainScale: 1.0, biome: 'cyber', vegetationDensity: 0.8, waterLevel: 0.1, atmosphereDensity: 0.2, brushSize: 20.0, brushStrength: 0.7, activeTool: 'none', syntheticEnvironment: 'none' });
  const [renderConfig, setRenderConfig] = useState<RenderConfig>({ engine: 'WebGPU', resolution: '4K', samples: 128, denoising: true, shadowMapRes: 2048 });
  const [compositingConfig, setCompositingConfig] = useState<CompositingConfig>({ bloom: 2.0, exposure: 1.2, vignette: 0.6, chromaticAberration: 0.15, tonemapping: 'ACES' });
  const [simulation, setSimulation] = useState<SimulationState>({ status: 'stopped', time: 0, activeBehaviors: [] });
  const [engineLogs, setEngineLogs] = useState<EngineLog[]>([]);
  const [terminalHistory, setTerminalHistory] = useState<TerminalLine[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [sculptHistory, setSculptHistory] = useState<SculptPoint[]>([]);
  const [assets, setAssets] = useState<GameAsset[]>([]);
  const [nodes, setNodes] = useState<NeuralNode[]>([]);
  const [edges, setEdges] = useState<NeuralEdge[]>([]);
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [syncMode, setSyncMode] = useState<SyncMode>(SyncMode.LOCAL);
  const [stagedFiles, setStagedFiles] = useState<string[]>([]);
  const [commitHistory, setCommitHistory] = useState<GitCommit[]>([]);
  const [variableData, setVariableData] = useState<Record<string, any>>({});
  const [extensions, setExtensions] = useState<Extension[]>(initialExtensions);
  const [projectVersion, setProjectVersion] = useState<string>('v4.2.0');

  // --- UI/UX State ---
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [lastSaved, setLastSaved] = useState<number>(Date.now());
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [buildInfo, setBuildInfo] = useState<BuildInfo>({ status: 'idle', progress: 0 });
  const [userPrefs, setUserPrefs] = useState<UserPreferences>({
    codingStyle: ['Functional React', 'TailwindCSS'],
    forbiddenPatterns: ['placeholders', 'TODO comments', 'entire file rewrites'],
    architecturalDecisions: ['Nexus Execution Doctrine v1', 'Strict Global Command Plane'],
    lastLearningUpdate: Date.now(),
  });

  const chatRef = useRef<ChatHandle>(null);
  const lastSimTimeRef = useRef<number>(Date.now());

  // --- Logging Utility ---
  const addLog = useCallback((message: string, type: EngineLog['type'] = 'info', source: string = 'Nexus') => {
    const log: EngineLog = { id: Math.random().toString(36), message, type, timestamp: Date.now(), source };
    setEngineLogs(prev => [...prev.slice(-199), log]);
    setTerminalHistory(prev => [...prev.slice(-499), { text: `[${source}] ${message}`, type: type === 'error' ? 'error' : 'output', timestamp: Date.now() }]);
  }, []);

  // --- Nexus Command Handlers ---
  const handlePanic = useCallback(() => {
    setIsPanic(true);
    nexusBus.panic();
    addLog('Global Panic Triggered: All jobs terminated.', 'error', 'Control');
  }, [addLog]);

  const handleImportAsset = useCallback((a: GameAsset) => {
    setAssets(prev => [...prev.slice(-99), a]);
    addLog(`Asset Bound: ${a.name}`, 'success', 'Registry');
  }, [addLog]);

  const handleBuild = useCallback((prompt?: string) => {
    if (buildInfo.status === 'building') return;
    setBuildInfo({ status: 'building', progress: 0, buildPrompt: prompt });
    addLog(`Deploy Phase Initiated: ${prompt || 'Manual Trigger'}`, 'info', 'Ship');

    let prog = 0;
    const interval = setInterval(() => {
      prog += 10;
      if (prog >= 100) {
        clearInterval(interval);
        setBuildInfo({ status: 'success', progress: 100, lastBuild: Date.now(), buildPrompt: prompt });
        addLog('Build Cluster Optimized.', 'success', 'Ship');
      } else setBuildInfo(prev => ({ ...prev, progress: prog }));
    }, 30);
  }, [buildInfo.status, addLog]);

  // --- Global Actions ---
  const handleAddSceneObject = useCallback((o: Omit<SceneObject, 'id'>) => {
    const newObj: SceneObject = { ...o, id: `obj-${Math.random().toString(36).slice(2, 8)}` } as SceneObject;
    setSceneObjects(prev => [...prev, newObj]);
    addLog(`Entity Spawned: ${newObj.name}`, 'info', 'Matrix');
  }, [addLog]);

  const handleUpdateSceneObject = useCallback((id: string, updates: Partial<SceneObject>) => {
    setSceneObjects(prev => prev.map(obj => obj.id === id ? { ...obj, ...updates } : obj));
  }, []);

  const handleFileChange = useCallback((newContent: string) => {
    if (!project.activeFile) return;
    const updateFiles = (nodes: FileNode[]): FileNode[] => nodes.map(node => {
      if (node.path === project.activeFile) return { ...node, content: newContent };
      if (node.children) return { ...node, children: updateFiles(node.children) };
      return node;
    });
    setProject(prev => ({ ...prev, files: updateFiles(prev.files) }));
  }, [project.activeFile]);

  const handleCreateNode = useCallback((parentPath: string | null, name: string, type: 'file' | 'dir') => {
    const newNodePath = parentPath ? `${parentPath}/${name}` : name;
    const newNode: FileNode = { name, type, path: newNodePath, ...(type === 'file' ? { content: '// Antigravity Binary' } : { children: [] }) };
    const insertNode = (nodes: FileNode[]): FileNode[] => {
      if (parentPath === null) return [...nodes, newNode];
      return nodes.map(node => (node.path === parentPath && node.type === 'dir') ? { ...node, children: [...(node.children || []), newNode] } : node.children ? { ...node, children: insertNode(node.children) } : node);
    };
    setProject(prev => ({ ...prev, files: insertNode(prev.files), activeFile: type === 'file' ? newNodePath : prev.activeFile }));
  }, []);

  const handleNeuralUpdate = useCallback((payload: { nodes?: NeuralNode[], edges?: NeuralEdge[] }) => {
    if (payload.nodes) setNodes(payload.nodes);
    if (payload.edges) setEdges(payload.edges);
  }, []);

  const handleSyncVariableData = useCallback((data: Record<string, any>) => {
    setVariableData(prev => ({ ...prev, ...data }));
  }, []);

  const handleInjectScript = useCallback((path: string, content: string) => {
    addLog(`Script Injected: ${path}`, 'success', 'Kernel');
    // Direct Action: Write to persistent storage
    (window as any).agentAPI?.fs.write(path, content).then((res: any) => {
      if (res.success) addLog(`File persisted: ${path}`, 'info', 'AgentFS');
      else addLog(`Persistence failure: ${path}`, 'error', 'AgentFS');
    });
  }, [addLog]);

  const handleUninstallExtension = (id: string) => {
    setExtensions(prev => prev.filter(e => e.identifier.id !== id));
  };

  const handleRunAction = useCallback((action: string) => {
    addLog(`Matrix Action: ${action}`, 'info', 'Control');

    if (action.startsWith('ANNOTATION_PROCESSED_')) {
      const mode = action.replace('ANNOTATION_PROCESSED_', '');
      let prompt = "Analyze this input.";

      if (mode === '3D') prompt = "I have sketched a 3D concept. Please generate a 3D asset matching this design.";
      else if (mode === 'IMAGE') prompt = "Convert this sketch into a high-fidelity image asset.";
      else if (mode === 'CODE') prompt = "Analyze this diagram and generate the corresponding code structure.";

      // Delay slightly to ensure image message arrives first (if async)
      setTimeout(() => chatRef.current?.sendMessage(prompt), 100);
    } else if (action === 'SYNTHESIZE_PLOT') {
      chatRef.current?.sendMessage("Synthesize a new story or plot branch based on the current world and director state.");
    }
  }, [addLog]);

  // --- Persistence & Initialization ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const ws = JSON.parse(saved) as Workspace;
        setProject(ws.project);
        setSceneObjects(ws.sceneObjects);
        setPhysics(ws.physics);
        setWorldConfig(ws.worldConfig);
        setRenderConfig(ws.renderConfig);
        setCompositingConfig(ws.compositingConfig);
        setSimulation(ws.simulation || { status: 'stopped', time: 0 });
        setChatMessages(ws.messages || []);
        setSculptHistory(ws.sculptHistory || []);
        setAssets(ws.assets || []);
        setEngineLogs(ws.engineLogs || []);
        setTerminalHistory(ws.terminalHistory || []);
        setTasks(ws.tasks || []);
        setStagedFiles(ws.stagedFiles || []);
        setCommitHistory(ws.commitHistory || []);
        setVariableData(ws.variableData || {});
        setProjectVersion(ws.projectVersion || 'v4.2.0');
        setActiveWorkspaceId(ws.id);
        if (ws.syncMode) {
          setSyncMode(ws.syncMode);
          localBridgeClient.setSyncMode(ws.syncMode);
        }
      } catch (e) {
        console.error('Failed to load workspace:', e);
      }
    } else {
      setActiveWorkspaceId('default-pro');
    }
    initializeAgentAPI();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeWorkspaceId) {
        const ws: Workspace = {
          id: activeWorkspaceId,
          name: DEFAULT_WORKSPACE_NAME,
          project, sceneObjects, physics, worldConfig, renderConfig, compositingConfig,
          simulation, nodes, edges, terminalHistory, tasks, stagedFiles, commitHistory, engineLogs,
          messages: chatMessages, sculptHistory, variableData, extensions, projectVersion, assets, syncMode
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ws));
        localBridgeClient.setSyncMode(syncMode);
        setLastSaved(Date.now());
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [project, sceneObjects, physics, worldConfig, renderConfig, compositingConfig, simulation, nodes, edges, terminalHistory, tasks, stagedFiles, commitHistory, engineLogs, chatMessages, sculptHistory, variableData, extensions, projectVersion, assets, activeWorkspaceId, syncMode]);

  // --- Main Rendering ---

  // --- Main Rendering ---
  if (isLoading) return <div className="h-screen bg-[#050a15] flex items-center justify-center text-cyan-400 font-mono text-[10px] tracking-[0.5em] uppercase animate-pulse">Neural Handshake...</div>;
  if (error) return <div className="h-screen bg-black flex items-center justify-center text-red-500 p-20 font-black uppercase text-center">{error.message}</div>;
  if (!user) return <SignIn />;

  const activeFileContent = (function findFile(nodes: FileNode[], path: string): string {
    for (const node of nodes) {
      if (node.path === path) return node.content || '';
      if (node.children) { const res = findFile(node.children, path); if (res) return res; }
    }
    return '';
  })(project.files, project.activeFile || '');

  return (
    <ErrorBoundary>
      <div className="h-screen w-full flex flex-col bg-[#050a15] text-white/90 overflow-hidden">
        {/* Global Command Spine */}
        <CommandSpine
          projectEnv={projectEnv}
          setProjectEnv={setProjectEnv}
          aiMode={aiMode}
          setAiMode={setAiMode}
          showPerformanceHUD={showPerformanceHUD}
          setShowPerformanceHUD={setShowPerformanceHUD}
          isPanic={isPanic}
          onPanic={() => setIsPanic(true)}
        />

        <div className="flex-1 flex overflow-hidden relative">
          {/* Primary Navigation */}
          <PrimaryNav activeView={activeView} setActiveView={setActiveView} />
          <main className="flex-1 relative overflow-hidden flex flex-col min-w-0">
            {/* Tab Content Cluster */}
            <div className="flex-1 relative overflow-hidden">
              {activeView === 'dashboard' && <DiagnosticsPanel />}
              {activeView === 'director' && (
                <div className="h-full flex flex-col">
                  <Director />
                  <div className="h-1/3 border-t border-cyan-900/20">
                    <Chat
                      ref={chatRef} project={project} sceneObjects={sceneObjects} physics={physics} worldConfig={worldConfig}
                      renderConfig={renderConfig} compositingConfig={compositingConfig} simulation={simulation}
                      isOverwatchActive={true} messages={chatMessages} setMessages={setChatMessages}
                      userPrefs={userPrefs} onFileUpdate={handleFileChange}
                      onAddSceneObject={handleAddSceneObject}
                      onUpdateSceneObject={handleUpdateSceneObject} onUpdatePhysics={(u) => setPhysics(p => ({ ...p, ...u }))}
                      onUpdateWorld={(u) => setWorldConfig(p => ({ ...p, ...u }))}
                      onUpdateConfig={(t, u) => { if (t === 'render') setRenderConfig(p => ({ ...p, ...u })); else setCompositingConfig(p => ({ ...p, ...u })); }}
                      onRemoveSceneObject={(id) => setSceneObjects(prev => prev.filter(o => o.id !== id))}
                      onInjectScript={handleInjectScript} onSyncVariableData={handleSyncVariableData}
                      extensions={extensions} projectVersion={projectVersion} onUpdateVersion={setProjectVersion}
                      onTriggerBuild={() => handleBuild('Agent Directive Mutation')}
                      onTriggerPresentation={() => setIsPresenting(true)}
                      engineLogs={engineLogs}
                    />
                  </div>
                </div>
              )}
              {activeView === 'editor' && (
                <div className="flex h-full">
                  <div style={{ width: `${sidebarWidth}px` }} className="relative shrink-0 flex flex-col border-r border-cyan-900/10">
                    <Sidebar
                      isOpen={true} setIsOpen={() => { }} files={project.files} activeFile={project.activeFile}
                      onSelectFile={(p) => setProject(prev => ({ ...prev, activeFile: p }))}
                      onCreateNode={handleCreateNode}
                      stagedFiles={stagedFiles} onStage={(p) => setStagedFiles(prev => [...prev, p])} onUnstage={(p) => setStagedFiles(prev => prev.filter(f => f !== p))}
                      onCommit={(m) => setCommitHistory(prev => [{ id: Date.now().toString(), message: m, author: 'Nexus Dev', timestamp: Date.now() }, ...prev])}
                      commitHistory={commitHistory} tasks={tasks}
                      onToggleTask={(id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))}
                      onAddTasks={(nt) => setTasks(prev => [...prev, ...nt.map(t => ({ ...t, id: Math.random().toString(36), completed: false }))])}
                      tokenMetrics={limiter.getMetrics()} sceneObjects={sceneObjects} userPrefs={userPrefs} extensions={extensions} onUninstallExtension={handleUninstallExtension}
                    />
                    <div onMouseDown={() => setIsResizingSidebar(true)} className="absolute top-0 -right-1 w-2 h-full cursor-col-resize z-50 group">
                      <div className="w-px h-full bg-cyan-500/10 group-hover:bg-cyan-500 mx-auto transition-colors"></div>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col relative min-w-0">
                    <Editor content={activeFileContent} onChange={handleFileChange} filename={project.activeFile || ''} lastSaved={lastSaved} isSyncing={isSyncing} />
                    <div className="h-64 border-t border-cyan-500/10 bg-black/40">
                      <Terminal history={terminalHistory} onCommand={(c) => addLog(`Exec: ${c}`, 'info', 'Binary')} />
                    </div>
                  </div>
                </div>
              )}
              {/* Persistent Matrix Implementation to prevent WebGL Context Loss */}
              <div className={`absolute inset-0 z-0 transition-opacity duration-300 ${activeView === 'matrix' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <GameDashboard
                  onBuild={handleBuild} buildInfo={buildInfo} assets={assets} physics={physics} worldConfig={worldConfig} sceneObjects={sceneObjects}
                  pipelines={[]} renderConfig={renderConfig} compositingConfig={compositingConfig} simulation={simulation}
                  onUpdatePhysics={(u) => setPhysics(prev => ({ ...prev, ...u }))} onUpdateWorld={(u) => setWorldConfig(p => ({ ...p, ...u }))}
                  onImportAsset={handleImportAsset} onUpdateSceneObject={handleUpdateSceneObject}
                  onAddSceneObject={handleAddSceneObject}
                  onUpdateConfig={(t, u) => { if (t === 'render') setRenderConfig(p => ({ ...p, ...u })); else setCompositingConfig(p => ({ ...p, ...u })); }}
                  onRunAction={handleRunAction}
                  onSendVisualFeedback={(img) => chatRef.current?.addAnnotatedMessage(img)}
                  sculptHistory={sculptHistory} redoStack={[]} onSculptTerrain={(p) => setSculptHistory(prev => [...prev, { ...p, brushSize: worldConfig.brushSize, brushStrength: worldConfig.brushStrength }])}
                  onUndoSculpt={() => setSculptHistory(prev => prev.slice(0, -1))} onRedoSculpt={() => { }} onClearSculpt={() => setSculptHistory([])}
                  nodes={nodes} edges={edges} onNeuralUpdate={handleNeuralUpdate} variableData={variableData} engineLogs={engineLogs}
                  onAddAsset={(newAsset) => setAssets(prev => [...prev, newAsset])}
                  isFullscreen={isPresenting}
                />
              </div>

              {activeView === 'forge' && <Forge />}
              {activeView === 'pipelines' && <N8NWorkflow />}
              {activeView === 'behavior' && <Behavior sceneObjects={sceneObjects} />}
              {activeView === 'narrative' && <Narrative onRunAction={handleRunAction} />}
              {activeView === 'assets' && <Registry onImport={handleImportAsset} />}
              {activeView === 'world' && <World worldConfig={worldConfig} onUpdateWorld={(u) => setWorldConfig(p => ({ ...p, ...u }))} />}
              {activeView === 'data' && <Persistence variableData={variableData} sceneObjects={sceneObjects} assets={assets} engineLogs={engineLogs} />}
              {activeView === 'collab' && <Link />}
              {activeView === 'diagnostics' && <DiagnosticsPanel />}
              {activeView === 'deploy' && <Deploy />}
              {activeView === 'settings' && <Config />}
            </div>

            {/* Modals & Overlays */}
            {showApiKeyManager && <ApiKeyManager onClose={() => setShowApiKeyManager(false)} />}
            {isPanic && (
              <div className="absolute inset-0 z-[100] bg-red-950/90 backdrop-blur-3xl flex items-center justify-center flex-col p-20 shadow-[inset_0_0_100px_rgba(255,0,0,0.5)] animate-in fade-in zoom-in duration-500">
                <ShieldAlert className="w-48 h-48 text-red-500 mb-8 animate-bounce" />
                <h1 className="text-8xl font-black text-white uppercase tracking-tighter mb-4" style={{ textShadow: '0 0 50px rgba(255,0,0,0.8)' }}>CORE TERMINATED</h1>
                <p className="text-red-400 font-mono text-xl mb-12 uppercase tracking-widest">Global Job Registry Purged. All Neural Links Closed.</p>
                <button onClick={() => setIsPanic(false)} className="px-16 py-6 bg-white text-red-600 font-black rounded-3xl text-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl">RE-AUTHORIZE SYSTEMS</button>
              </div>
            )}
            {showPerformanceHUD && (
              <div className="absolute top-4 right-4 w-64 bg-black/80 backdrop-blur-2xl border border-white/5 p-4 rounded-2xl z-50 pointer-events-none animate-in slide-in-from-right duration-300">
                <div className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-3 border-b border-cyan-500/20 pb-2 flex justify-between">
                  <span>Telemetry Engine</span>
                  <span className="text-white">PRO</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-500">VRAM LOAD</span>
                    <span className="text-white">2.4 GB / 12 GB</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 w-[20%] shadow-[0_0_10px_#00f2ff]"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-500">TOKENS BURN</span>
                    <span className="text-white">4.2k / min</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 w-[60%] shadow-[0_0_10px_#a855f7]"></div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
