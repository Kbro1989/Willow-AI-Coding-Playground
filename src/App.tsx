
import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import {
  FileNode, ProjectState, TerminalLine, GitCommit, TodoTask,
  TokenMetrics, BuildInfo, GameAsset, SceneObject, PhysicsConfig,
  PipelineConfig, RenderConfig, CompositingConfig, SimulationState,
  WorldConfig, SculptPoint, EngineAction, EngineLog, NeuralNode, NeuralEdge,
  Workspace, Message, UserPreferences, Extension, ActiveView, AIModelMode, ProjectEnv, SyncMode, FileId, TaskId
} from './types';
import { UIAction, assertNever } from './ui/ui-actions';
import { universalOrchestrator } from './services/ai/universalOrchestrator';
import { agentSprintService } from './services/ai/agentSprintService';
import { registerSystemLimbs } from './services/ai/SystemLimbs';
import { registerApplicationLimbs } from './services/ai/ApplicationLimbs';
import { registerAllLimbs } from './services/ai/limbs';

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
const RSMVBrowser = React.lazy(() => import('./components/RSMVBrowser'));
import DiagnosticsPanel from './components/DiagnosticsPanel';
import ApiKeyManager from './components/ApiKeyManager';
import ErrorBoundary from './components/ErrorBoundary';
import SignIn from './components/auth/SignIn';
import N8NWorkflow from './components/N8NWorkflow';
import { CommandSpine } from './components/layout/CommandSpine';
import { PrimaryNav } from './components/layout/PrimaryNav';
import NexusControl from './components/layout/NexusControl';

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
import CursorTracker from './components/nexus/CursorTracker';
import LazyViewport from './components/nexus/LazyViewport';
import LimbExplorer from './components/nexus/LimbExplorer';
import ModelPlayground from './components/nexus/ModelPlayground';

// Services
import { initialFiles } from './constants';
import { cloudlareLimiter as limiter } from './services/cloudflareService';
import { db } from './lib/db';
import { initializeAgentAPI } from './services/agentAPI';
import { nexusBus } from './services/nexusCommandBus';
import { localBridgeClient } from './services/localBridgeService';
import { healthGuard } from './services/ai/HealthGuardLimb';
import { collaborativeSync } from './services/gameData/collaborativeSyncService';
import { contextService } from './services/ai/contextService';
import { syncSessionState } from './services/userPreferencesService';
import { forgeMedia } from './services/forgeMediaService';

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
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    // Restore last active view from session
    const saved = localStorage.getItem('nexus_active_view');
    return (saved as ActiveView) || 'console';
  });


  const [aiMode, setAiMode] = useState<AIModelMode>('assist');
  const [projectEnv, setProjectEnv] = useState<ProjectEnv>('local');
  const [isPanic, setIsPanic] = useState(false);
  const [showPerformanceHUD, setShowPerformanceHUD] = useState(false);
  const [showApiKeyManager, setShowApiKeyManager] = useState(false);
  const [isAiPanelVisible, setIsAiPanelVisible] = useState(true);
  const [editorSelection, setEditorSelection] = useState<string>('');

  // --- Core Engine State (World State) ---
  const [project, setProject] = useState<ProjectState>({ id: 'init', name: 'Init', files: initialFiles, activeFile: 'src/App.tsx' as FileId });
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
  const [bridgeStatus, setBridgeStatus] = useState({ isConnected: true, isCloudMode: false });

  // --- Logging Utility ---
  const addLog = useCallback((message: string, type: EngineLog['type'] = 'info', source: string = 'Nexus') => {
    const log: EngineLog = { id: Math.random().toString(36), message, type, timestamp: Date.now(), source };
    setEngineLogs(prev => [...prev.slice(-199), log]);
    setTerminalHistory(prev => [...prev.slice(-499), { text: `[${source}] ${message}`, type: type === 'error' ? 'error' : 'output', timestamp: Date.now() }]);

    // Proactive Health Monitoring
    healthGuard.analyzeLog(message, type === 'error' ? 'error' : 'info');
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

  // --- Real-time Presence Tracking & Bridge Monitoring ---
  useEffect(() => {
    registerSystemLimbs();
    registerApplicationLimbs();
    registerAllLimbs(); // Phase 67: 500 Fingers
    contextService.updateLocalState({ activeView, projectEnv });
  }, [activeView, projectEnv]);

  useEffect(() => {
    // 1. Bridge Status Monitoring
    const unsubscribeStatus = localBridgeClient.onStatusChange(status => {
      setBridgeStatus(status);
      if (status.isCloudMode) {
        addLog('Local Bridge Interruption. Cloud Fallback Active.', 'warn', 'Nexus');
      } else if (status.isConnected) {
        addLog('Local Bridge Restored. Dual-Sync Operational.', 'success', 'Nexus');
      }
    });

    return () => unsubscribeStatus();
  }, [addLog]);

  // --- UI Explanation & Event Listeners ---
  useEffect(() => {
    const handleUIExplain = async (e: any) => {
      const { id, context: uiContext } = e;
      addLog(`Neural Link: Explaining "${id}"...`, 'info', 'Librarian');

      try {
        const { neuralRegistry } = await import('./services/ai/NeuralRegistry');
        const explanation = await neuralRegistry.callCapability('forge', 'ui_explain', { componentId: id, context: uiContext });
        const msg = `[AI GUIDANCE] ${id.toUpperCase()}: ${explanation.explanation}`;
        addLog(msg, 'success', 'Oracle');
        setChatMessages(prev => [...prev, {
          id: `ui-exp-${Date.now()}`,
          role: 'system',
          content: msg,
          timestamp: Date.now(),
          invocationType: 'explain' as any
        }]);
      } catch (err) {
        addLog('Failed to retrieve neural explanation.', 'error', 'Librarian');
      }
    };

    let unsubExplain: (() => void) | undefined;

    import('./services/ai/NeuralRegistry').then(({ neuralRegistry }) => {
      unsubExplain = neuralRegistry.on('ui:explain', handleUIExplain);
    });

    const handleMouseMove = (e: MouseEvent) => {
      if (!user) return;
      if (Math.random() > 0.1) return;
      collaborativeSync.updatePresence(user.id, {
        userName: user.email?.split('@')[0] || 'Unknown User',
        cursorX: e.clientX,
        cursorY: e.clientY,
        activeTab: activeView
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (unsubExplain) unsubExplain();
    };
  }, [user, activeView, addLog]);
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [syncMode, setSyncMode] = useState<SyncMode>(SyncMode.LOCAL);
  const [stagedFiles, setStagedFiles] = useState<string[]>([]);
  const [commitHistory, setCommitHistory] = useState<GitCommit[]>([]);
  const [variableData, setVariableData] = useState<Record<string, unknown>>({});
  const [extensions, setExtensions] = useState<Extension[]>(initialExtensions);
  const [projectVersion, setProjectVersion] = useState<string>('v4.2.0');

  // Persist active view to Cloud and LocalStorage
  useEffect(() => {
    localStorage.setItem('nexus_active_view', activeView);
    if (user?.id) {
      syncSessionState(user.id, { activeView, activeFile: project.activeFile || undefined });
    }
  }, [activeView, user?.id, project.activeFile]);

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
    creativeLiberty: ['Mature Themes Authorized', 'Violence/Substances OK', 'Unfiltered Dialogue', 'Unrestricted Creative Agency'],
    lastLearningUpdate: Date.now(),
  });

  const chatRef = useRef<ChatHandle>(null);
  const lastSimTimeRef = useRef<number>(Date.now());

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
    setProject(prev => ({ ...prev, files: insertNode(prev.files), activeFile: (type === 'file' ? newNodePath : prev.activeFile) as FileId }));
  }, []);

  const handleNeuralUpdate = useCallback((payload: { nodes?: NeuralNode[], edges?: NeuralEdge[] }) => {
    if (payload.nodes) setNodes(payload.nodes);
    if (payload.edges) setEdges(payload.edges);
  }, []);

  const handleSyncVariableData = useCallback((data: Record<string, unknown>) => {
    setVariableData(prev => ({ ...prev, ...data }));
  }, []);

  const handleInjectScript = useCallback((path: string, content: string) => {
    addLog(`Script Injected: ${path}`, 'success', 'Kernel');
    // Direct Action: Write to persistent storage
    interface AgentAPIResponse { success: boolean; error?: string; stats?: any }
    (window as any).agentAPI?.fs.write(path, content).then((res: AgentAPIResponse) => {
      if (res.success) addLog(`File persisted: ${path}`, 'info', 'AgentFS');
      else addLog(`Persistence failure: ${path}`, 'error', 'AgentFS');
    });
  }, [addLog]);

  const handleUninstallExtension = (id: string) => {
    setExtensions(prev => prev.filter(e => e.identifier.id !== id));
  };

  // --- Context Sync ---
  useEffect(() => {
    // Keep the "Brain" updated with what the user is looking at
    contextService.updateLocalState({
      activeFile: project.activeFile || '',
      projectEnv
    });
  }, [project.activeFile, projectEnv]);


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

  // --- UI Intent Choke Point ---
  const dispatchUIAction = useCallback((action: UIAction) => {
    addLog(`Intent: ${action.type}`, 'info', 'UI');

    switch (action.type) {
      case 'NAV_SWITCH_VIEW': {
        // Assert intent is valid for the current runtime set
        setActiveView(action.view);
        return;
      }
      case 'ENV_SET_PROJECT_ENV':
        setProjectEnv(action.env);
        return;
      case 'AI_SET_MODE':
        setAiMode(action.mode);
        return;
      case 'SYSTEM_PANIC':
        handlePanic();
        return;
      case 'SYSTEM_TOGGLE_PERFORMANCE_HUD':
        setShowPerformanceHUD(prev => !prev);
        return;
      case 'SYSTEM_TOGGLE_KEY_MANAGER':
        setShowApiKeyManager(prev => !prev);
        return;
      case 'SYSTEM_TOGGLE_AI_PANEL':
        setIsAiPanelVisible(prev => !prev);
        return;
      case 'BRIDGE_TOGGLE_RELAY': {
        const isCurrentlyRelay = localStorage.getItem('antigravity_bridge_url')?.includes('workers.dev');
        if (isCurrentlyRelay) {
          localBridgeClient.setBridgeUrl("ws://localhost:3040");
        } else {
          const appId = prompt("Enter Cloud App ID for Local Bridge (App ID 1):", "1");
          if (appId) localBridgeClient.setRelayMode(appId);
        }
        return;
      }
      case 'EDITOR_OPEN_FILE':
        setProject(prev => ({ ...prev, activeFile: action.fileId }));
        return;
      case 'EDITOR_SAVE_ACTIVE':
        addLog('Editor: Save intent received.', 'info', 'UI');
        // Logic would call cloudFsService or bridge
        return;
      case 'EDITOR_FORMAT_ACTIVE':
        addLog('Editor: Format intent received.', 'info', 'UI');
        return;
      case 'FILE_SELECT':
        setProject(prev => ({ ...prev, activeFile: action.path as FileId }));
        return;
      case 'FILE_CREATE':
        handleCreateNode(action.parentPath, action.name, action.nodeType);
        return;
      case 'FILE_CHANGE':
        handleFileChange(action.content);
        return;
      case 'GIT_STAGE':
        setStagedFiles(prev => [...prev, action.path]);
        return;
      case 'GIT_UNSTAGE':
        setStagedFiles(prev => prev.filter(f => f !== action.path));
        return;
      case 'GIT_COMMIT':
        setCommitHistory(prev => [{
          id: Date.now().toString(),
          message: action.message,
          author: user?.email?.split('@')[0] || 'Nexus Dev', // Use actual user if available
          timestamp: Date.now()
        }, ...prev]);
        setStagedFiles([]);
        return;
      case 'TASK_TOGGLE':
        setTasks(prev => prev.map(t => t.id === action.id ? { ...t, completed: !t.completed } : t));
        return;
      case 'TASK_ADD':
        setTasks(prev => [...prev, ...action.tasks.map(t => ({
          ...t,
          id: Math.random().toString(36),
          completed: false
        }))]);
        return;
      case 'EXTENSION_UNINSTALL':
        handleUninstallExtension(action.id);
        return;
      case 'AI_CHAT_SUBMIT':
        chatRef.current?.sendMessage(action.prompt);
        return;
      case 'AI_TRIGGER_REVIEW':
        // Placeholder for future specialization
        return;
      case 'AI_START_SPRINT':
        agentSprintService.startSprint(action.goal);
        return;
      case 'MATRIX_ENTITY_SPAWN':
        handleAddSceneObject(action.entity);
        return;
      case 'MATRIX_ACTION':
        handleRunAction(action.action);
        return;
      case 'ASSET_IMPORT':
        handleImportAsset(action.asset);
        return;
      case 'NARRATIVE_SYNTHESIZE':
        chatRef.current?.sendMessage("Synthesize a new story or plot branch based on the current world and director state.");
        return;
      case 'TERMINAL_COMMAND':
        localBridgeClient.runTerminalCommand(action.command);
        addLog(`Terminal: ${action.command}`, 'info', 'Binary');
        return;
      default:
        assertNever(action);
    }
  }, [handlePanic, handleCreateNode, handleFileChange, handleAddSceneObject, handleRunAction, handleImportAsset, addLog, user?.email]);

  // Expose authoritative dispatcher to window
  useEffect(() => {
    (window as any).antigravity = {
      runUIAction: dispatchUIAction,
      setTab: (view: ActiveView) => dispatchUIAction({ type: 'NAV_SWITCH_VIEW', view }),
      runAction: (action: { type: string, payload: any }) => dispatchUIAction({ type: 'MATRIX_ACTION', action: `${action.type}_${JSON.stringify(action.payload)}` }),
      // Legacy compatibility wrapper (DEPRECATED)
      dispatch: (action: any) => {
        console.warn('antigravity.dispatch is DEPRECATED. Use runUIAction instead.');
        dispatchUIAction(action as any);
      }
    };
  }, [dispatchUIAction]);

  // --- Persistence & Initialization ---
  useEffect(() => {
    // Utility to recursively strip blob URLs from restored state
    // Blobs are session-bound and invalid after a reload
    const stripBlobUrls = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(stripBlobUrls);

      const result = { ...obj };
      for (const key in result) {
        if (typeof result[key] === 'string' && result[key].startsWith('blob:')) {
          result[key] = undefined; // Strip invalid blob
        } else if (typeof result[key] === 'object') {
          result[key] = stripBlobUrls(result[key]);
        }
      }
      return result;
    };

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const rawWs = JSON.parse(saved);
        const ws = stripBlobUrls(rawWs) as Workspace;

        setProject(ws.project);
        setSceneObjects(ws.sceneObjects || []);
        setPhysics(ws.physics || { gravity: -9.81, friction: 0.6, atmosphere: 'normal', timeScale: 1.0 });
        setWorldConfig(ws.worldConfig || { seed: 999, terrainScale: 1.0, biome: 'cyber', vegetationDensity: 0.8, waterLevel: 0.1, atmosphereDensity: 0.2, brushSize: 20.0, brushStrength: 0.7, activeTool: 'none', syntheticEnvironment: 'none' });
        setRenderConfig(ws.renderConfig || { engine: 'WebGPU', resolution: '4K', samples: 128, denoising: true, shadowMapRes: 2048 });
        setCompositingConfig(ws.compositingConfig || { bloom: 2.0, exposure: 1.2, vignette: 0.6, chromaticAberration: 0.15, tonemapping: 'ACES' });
        setSimulation(ws.simulation || { status: 'stopped', time: 0, activeBehaviors: [] });
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
    forgeMedia.syncFromDisk();
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
          aiMode={aiMode}
          activeView={activeView}
          showPerformanceHUD={showPerformanceHUD}
          isAiPanelVisible={isAiPanelVisible}
          isPanic={isPanic}
          dispatch={dispatchUIAction}
        />

        <div className="flex-1 flex overflow-hidden relative">
          {/* Primary Navigation */}
          <PrimaryNav activeView={activeView} dispatch={dispatchUIAction} />

          <main className="flex-1 relative flex flex-col min-w-0 h-full overflow-hidden">
            {/* Tab Content Cluster - Forced containment within parent flex */}
            <div className="flex-1 relative w-full h-full min-h-0 overflow-hidden">

              {/* Persistent Matrix: Kept outside the map to prevent WebGL Context Loss */}
              <div
                className={`absolute inset-0 z-10 transition-opacity duration-500 ${activeView === 'scene' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                style={{ height: '100%', width: '100%' }}
              >
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

              {/* Dynamic Views: Relative to the forced min-h-0 container */}
              {activeView !== 'scene' && (
                <div className="relative z-20 w-full h-full">
                  {(() => {
                    switch (activeView) {
                      case 'console': return (
                        <div className="h-full flex flex-col overflow-hidden">
                          <div className="flex-1 min-h-0 overflow-hidden bg-[#050a15]/40 backdrop-blur-sm">
                            <DiagnosticsPanel />
                            <Director />
                          </div>
                          <div className="h-1/3 min-h-[150px] border-t border-cyan-900/10 text-slate-500 p-4 font-mono text-[9px] uppercase tracking-widest bg-black/20 flex flex-col items-center justify-center text-center opacity-30">
                            <Brain className="w-8 h-8 mb-2 text-cyan-500/20" />
                            <span>Interactive Nexus Stream</span>
                            <span>(Refer to Active Sidebar)</span>
                          </div>
                          <div className="h-1/3 min-h-[150px] border-t border-cyan-900/10">
                            <Terminal onCommand={(cmd) => dispatchUIAction({ type: 'TERMINAL_COMMAND', command: cmd })} history={terminalHistory} />
                          </div>
                        </div>
                      );
                      case 'editor': return (
                        <div className="flex h-full overflow-hidden">
                          <div style={{ width: `${sidebarWidth}px` }} className="relative shrink-0 flex flex-col border-r border-cyan-900/10 h-full overflow-hidden">
                            <Sidebar
                              isOpen={true} setIsOpen={() => { }} files={project.files} activeFile={project.activeFile}
                              stagedFiles={stagedFiles} commitHistory={commitHistory} tasks={tasks}
                              tokenMetrics={limiter.getMetrics()} sceneObjects={sceneObjects} userPrefs={userPrefs} extensions={extensions}
                              dispatch={dispatchUIAction}
                            />
                            <div onMouseDown={() => setIsResizingSidebar(true)} className="absolute top-0 -right-1 w-2 h-full cursor-col-resize z-50 group">
                              <div className="w-px h-full bg-cyan-500/10 group-hover:bg-cyan-500 mx-auto transition-colors"></div>
                            </div>
                          </div>
                          <div className="flex-1 flex flex-col relative min-w-0 h-full overflow-hidden">
                            <Editor
                              fileId={project.activeFile}
                              content={activeFileContent}
                              onContentChange={handleFileChange}
                              onSelectionChange={setEditorSelection}
                              dispatch={dispatchUIAction}
                            />
                          </div>
                        </div>
                      );
                      case 'forge': return <div className="h-full w-full overflow-hidden"><LazyViewport><Forge /></LazyViewport></div>;
                      case 'pipelines': return <div className="h-full w-full overflow-hidden"><N8NWorkflow /></div>;
                      case 'behavior': return <div className="h-full w-full overflow-hidden"><Behavior sceneObjects={sceneObjects} /></div>;
                      case 'narrative': return <div className="h-full w-full overflow-hidden"><Narrative /></div>;
                      case 'world': return (
                        <div className="h-full w-full overflow-hidden">
                          <World
                            worldConfig={worldConfig}
                            onUpdateWorld={(u) => setWorldConfig(prev => ({ ...prev, ...u }))}
                          />
                        </div>
                      );
                      case 'persistence': return (
                        <div className="h-full w-full overflow-hidden">
                          <Persistence
                            variableData={variableData}
                            sceneObjects={sceneObjects}
                            assets={assets}
                            engineLogs={engineLogs}
                          />
                        </div>
                      );
                      case 'collab': return <div className="h-full w-full overflow-hidden"><Link /></div>;
                      case 'deploy': return <div className="h-full w-full overflow-hidden"><Deploy /></div>;
                      case 'rsmv': return (
                        <div className="h-full w-full overflow-hidden">
                          <Suspense fallback={<div className="h-full w-full flex items-center justify-center bg-[#050a15] text-cyan-500 font-black uppercase tracking-[0.2em] animate-pulse">Initialising Asset Vault...</div>}>
                            <RSMVBrowser addLog={addLog} />
                          </Suspense>
                        </div>
                      );
                      case 'shader': return (
                        <div className="h-full w-full overflow-hidden border-t border-cyan-900/30">
                          <ShaderGraph
                            onCompile={(glsl: string) => addLog('Shader Compiled: ' + glsl.substring(0, 50) + '...', 'success', 'Compiler')}
                            onApplyToObjects={(id: string) => addLog(`Applying shader to object ${id}`, 'info', 'Shader')}
                          />
                        </div>
                      );
                      case 'limbs': return <div className="h-full w-full overflow-hidden"><LimbExplorer /></div>;
                      case 'matrix': return <div className="h-full w-full overflow-hidden"><ModelPlayground /></div>;
                      case 'settings': return <div className="h-full w-full overflow-hidden"><Config /></div>;
                      case 'console': return <div className="h-full w-full overflow-hidden"><DiagnosticsPanel /></div>;
                      // case 'scene': Handled by persistent layer & default (null)
                      default: return null;
                    }
                  })()}
                </div>
              )}
            </div>

            {/* Overlays */}
            <NexusControl activeView={activeView} dispatch={dispatchUIAction} />
            <CursorTracker currentUserId={user?.id || null} />
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
            {bridgeStatus.isCloudMode && (
              <div className="absolute bottom-4 right-4 z-[9999] px-3 py-1.5 bg-amber-500/20 border border-amber-500/50 rounded-full backdrop-blur-md flex items-center gap-2 animate-pulse shadow-lg shadow-amber-500/10">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500">Cloud Fallback Active</span>
                <span className="text-[8px] opacity-70 text-amber-300 font-mono text-center">RECONNECTING...</span>
              </div>
            )}
          </main>

          {/* Persistent AI Sidebar Panel - Use fixed width but allow shrinking if window is too small */}
          {isAiPanelVisible && (
            <aside className="w-[380px] max-w-[30vw] h-full border-l border-cyan-900/30 bg-[#050a15] flex flex-col shrink-0 animate-in slide-in-from-right duration-300 z-40 relative">
              <Chat
                ref={chatRef}
                project={project}
                sceneObjects={sceneObjects}
                physics={physics}
                worldConfig={worldConfig}
                renderConfig={renderConfig}
                compositingConfig={compositingConfig}
                simulation={simulation}
                isOverwatchActive={true}
                messages={chatMessages}
                setMessages={setChatMessages}
                userPrefs={userPrefs}
                onFileUpdate={handleFileChange}
                onAddSceneObject={handleAddSceneObject}
                onUpdateSceneObject={handleUpdateSceneObject}
                onUpdatePhysics={(u) => setPhysics(p => ({ ...p, ...u }))}
                onUpdateWorld={(u) => setWorldConfig(p => ({ ...p, ...u }))}
                onUpdateConfig={(t, u) => {
                  if (t === 'render') setRenderConfig(p => ({ ...p, ...u }));
                  else setCompositingConfig(p => ({ ...p, ...u }));
                }}
                onRemoveSceneObject={(id) => setSceneObjects(prev => prev.filter(o => o.id !== id))}
                onInjectScript={handleInjectScript}
                onSyncVariableData={handleSyncVariableData}
                extensions={extensions}
                projectVersion={projectVersion}
                onUpdateVersion={setProjectVersion}
                onTriggerBuild={() => handleBuild('Agent Directive Mutation')}
                onTriggerPresentation={() => setIsPresenting(true)}
                engineLogs={engineLogs}
                selectionContext={editorSelection}
                aiMode={aiMode}
                projectEnv={projectEnv}
                isPanic={isPanic}
                activeView={activeView}
                bridgeStatus={bridgeStatus.isConnected ? 'direct' : bridgeStatus.isCloudMode ? 'relay' : 'offline'}
              />
            </aside>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
