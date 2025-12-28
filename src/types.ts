import { LucideIcon } from 'lucide-react';
import {
  EnvironmentType,
  RuntimeTarget,
  DeploymentStrategy,
  ResourceBindingType,
  ServiceHealthState,
  FailureMode,
  AIInvocationType,
  ModelSource,
  MediaType,
  MediaEncoding,
  InferenceMode,
  ModelFallbackPolicy,
  EditorSurface,
  EditorMode,
  EditorialActionType,
  CodeScope,
  EditTrustLevel,
  ChangeImpactLevel,
  GameRuntimeState,
  PersistenceLayer,
  TelemetryEventType,
  ObserverAgentType,
  UIStateAuthority,
  RenderTrigger,
  SchemaStrictness,
  FallbackUIBehavior,
  UIFailureScope
} from './lib/taxonomy';

// --- Constitutional Constants & Branded Types ---
export type FileId = string & { __brand: 'FileId' };
export type TaskId = string & { __brand: 'TaskId' };

export type ActiveView =
  | 'editor'
  | 'scene'
  | 'assets'
  | 'settings'
  | 'console'
  | 'forge'
  | 'pipelines'
  | 'behavior'
  | 'narrative'
  | 'world'
  | 'persistence'
  | 'collab'
  | 'deploy'
  | 'rsmv'
  | 'shader'
  | 'limbs'
  | 'matrix';

export interface UnifiedContext {
  recentMemories: string[];
  activeGraphName?: string;
  narrativeSummary?: string;
  activeFile?: string;
  activeView: ActiveView;
  activeSubTab?: string;
  projectEnv: ProjectEnv;
}

export type AIModelMode = 'assist' | 'refactor' | 'explain' | 'generate' | 'lockdown';
export type ProjectEnv = 'local' | 'cloud' | 'hybrid';

/**
 * SyncMode defines the persistence strategy for the engine's file system and state.
 */
export enum SyncMode {
  LOCAL = 'local',
  CLOUD = 'cloud',
  DUAL = 'dual',
  OFFLINE = 'offline'
}

// --- Core Data Structures ---

export interface FileNode {
  name: string;
  type: 'file' | 'dir';
  content?: string;
  originalContent?: string;
  children?: FileNode[];
  path: string;
}

export interface Extension {
  identifier: {
    id: string;
    uuid: string;
  };
  version: string;
  location: {
    path: string;
    scheme: string;
  };
  relativeLocation: string;
  metadata: {
    installedTimestamp: number;
    pinned?: boolean;
    source: string;
    id: string;
    publisherId: string;
    publisherDisplayName: string;
    targetPlatform: string;
    updated?: boolean;
    private?: boolean;
    isPreReleaseVersion?: boolean;
    hasPreReleaseVersion?: boolean;
  };
}

export interface NeuralNode {
  id: string;
  type: 'input' | 'operation' | 'output' | 'ai_logic';
  label: string;
  position: { x: number, y: number };
  data: any;
}

export interface UserPreferences {
  codingStyle: string[];
  forbiddenPatterns: string[];
  architecturalDecisions: string[];
  artisticPreferences?: string[];
  optimizationTargets?: string[];
  creativeLiberty?: string[];
  lastLearningUpdate: number;
}

export interface SprintPlan {
  version: string;
  goals: string[];
  tasks: { id: string; description: string; type: AgentTask }[];
  status: 'planning' | 'confirmed' | 'executing' | 'completed';
}

export interface NeuralEdge {
  id: string;
  source: string;
  target: string;
}

export interface WorldConfig {
  seed: number;
  terrainScale: number;
  biome: 'temperate' | 'arid' | 'arctic' | 'volcanic' | 'cyber' | 'urban';
  vegetationDensity: number;
  waterLevel: number;
  atmosphereDensity: number;
  brushSize: number;
  brushStrength: number;
  activeTool: 'raise' | 'lower' | 'smooth' | 'none';
  syntheticEnvironment?: 'living_room' | 'music_room' | 'meeting_room' | 'office_large' | 'office_small' | 'none';
  globalShader?: string;
}

export interface EngineAction {
  type: 'ADD_OBJECT' | 'UPDATE_OBJECT' | 'REMOVE_OBJECT' | 'UPDATE_PHYSICS' | 'SET_MATERIAL' | 'UPDATE_CONFIG' | 'TRIGGER_ANIMATION' | 'INJECT_SCRIPT' | 'GENERATE_WORLD' | 'UPDATE_WORLD' | 'SCULPT_TERRAIN' | 'LEARN_USER_PREFERENCE' | 'CLEAR_SCENE' | 'SYNC_VARIABLE_DATA' | 'AI_EDITOR_REFACTOR' | 'AI_CODE_AUDIT' | 'EXTENSION_INSTALL' | 'PROPOSE_SPRINT' | 'COMPLETE_VERSION' | 'GENERATE_VIDEO' | 'GENERATE_IMAGE' | 'LOC_GROUNDING' | 'RUN_TEST_SUITE' | 'PRESENT_BUILD' | 'LOAD_ENVIRONMENT';
  payload: any;
}

export interface EngineLog {
  id: string;
  message: string;
  type: 'info' | 'warn' | 'error' | 'success';
  timestamp: number;
  source: string;
}

export interface RenderConfig {
  engine: 'WebGPU' | 'WebGL2';
  resolution: '720p' | '1080p' | '4K';
  samples: number;
  denoising: boolean;
  shadowMapRes: 1024 | 2048 | 4096;
}

export interface CompositingConfig {
  bloom: number;
  exposure: number;
  vignette: number;
  chromaticAberration: number;
  tonemapping: 'ACES' | 'Reinhard' | 'Cineon';
}

export interface SimulationState {
  status: 'playing' | 'paused' | 'stopped';
  time: number;
  activeBehaviors: string[];
}

export interface GroundingChunk {
  web?: { uri: string; title: string };
  maps?: { uri: string; title: string };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  model?: string;
  timestamp: number;
  tokensUsed?: number;
  tool_calls?: any[];
  isThinking?: boolean;
  thought?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  modelUrl?: string;
  annotatedImageUrl?: string;
  engineActions?: EngineAction[];
  groundingChunks?: GroundingChunk[];
  isError?: boolean;
  retryAction?: 'retry_last' | 'switch_to_fast' | 'none';
  plan?: SprintPlan;
  invocationType?: AIInvocationType;
  inferenceMode?: InferenceMode;
  modelSource?: ModelSource;
}

export interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'system';
  timestamp: number;
}

export interface ProjectState {
  id: string;
  name: string;
  files: FileNode[];
  activeFile: FileId | null;
}

export interface TodoTask {
  id: TaskId;
  text: string;
  completed: boolean;
  category: 'code' | 'asset' | 'gameplay' | 'optimization' | 'vfx';
  priority: 'low' | 'medium' | 'high';
}

export interface TokenMetrics {
  used: number;
  limit: number;
  isFallbackActive: boolean;
}

export interface SceneObject {
  id: string;
  name: string;
  type: 'npc' | 'prop' | 'light' | 'trigger';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  visible: true; // required
  modelUrl?: string;
  material?: {
    baseColor: string;
    metallic: number;
    roughness: number;
    emissive: number;
  };
  behaviors?: string[];
}

export interface NavItem {
  id: ActiveView;
  label: string;
  icon: LucideIcon;
}

export interface ToolButton {
  id: string;
  label: string;
  icon: LucideIcon;
  intent: any; // Will match UIAction in consumers
}

export interface AIMediaRequest {
  mode: AIModelMode;
  input: string;
  context: readonly any[];
}

export interface AIIntent {
  source: 'omnibar' | 'chat' | 'direct_button' | 'workflow' | 'health_guard';
  verb: 'explain' | 'refactor' | 'search' | 'build' | 'analyze' | 'sprint' | 'generate' | 'audit' | 'heal';
  payload: {
    text?: string;
    selection?: string;
    fileId?: FileId | null;
    data?: any;
    reason?: string;
  };
  context: {
    aiMode: AIModelMode;
    projectEnv: ProjectEnv;
    bridgeStatus: 'offline' | 'direct' | 'relay';
    panic: boolean;
    view: ActiveView;
  };
}

export interface PhysicsConfig {
  gravity: number;
  friction: number;
  atmosphere: 'vacuum' | 'normal' | 'dense';
  timeScale: number;
}

export interface GitCommit {
  id: string;
  message: string;
  author: string;
  timestamp: number;
}

export interface BuildInfo {
  status: 'idle' | 'building' | 'success' | 'error';
  progress: number;
  lastBuild?: number;
  buildPrompt?: string;
}

export interface UserAsset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | '3d_model' | 'mesh' | 'texture' | 'script';
  format: string;
  url: string;
  thumbnail?: string;
  size: number;
  ownerId: string;
  isPublic: boolean;
  downloads: number;
  likes: number;
  status?: 'raw' | 'processing' | 'optimized';
  tags?: string[];
  createdAt: number;
  aiGenerated: boolean;
  [key: string]: any;
}

export type GameAsset = UserAsset;

export interface PipelineConfig {
  id: string;
  name: string;
  provider: string;
  status: 'online' | 'offline';
  endpoints: string[];
  latency: number;
}

export interface SculptPoint {
  x: number;
  y: number;
  z: number;
  brushSize: number;
  brushStrength: number;
}

export interface CodeCompletion {
  text: string;
  description?: string;
}

export interface CodeIssue {
  line: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  codeSnippet?: string;
  suggestedFix?: string;
}

export interface DiagnosticResult {
  id: string;
  name: string;
  status: 'pending' | 'online' | 'degraded' | 'offline';
  latency?: number;
  message?: string;
  payload?: any;
}

export interface Workspace {
  id: string;
  name: string;
  project: ProjectState;
  sceneObjects: SceneObject[];
  physics: PhysicsConfig;
  worldConfig: WorldConfig;
  renderConfig: RenderConfig;
  compositingConfig: CompositingConfig;
  simulation: SimulationState;
  nodes: NeuralNode[];
  edges: NeuralEdge[];
  terminalHistory: TerminalLine[];
  tasks: TodoTask[];
  engineLogs: EngineLog[];
  messages: Message[];
  variableData: Record<string, any>;
  extensions: Extension[];
  projectVersion: string;
  stagedFiles: string[];
  commitHistory: GitCommit[];
  sculptHistory: SculptPoint[];
  savedPipelines?: any[]; // Workflow[] from n8n
  assets: GameAsset[];
  syncMode: SyncMode;
}

export enum ModelKey {
  COMMANDER = 'gemini-2.0-flash-pro',
  ARTIST = 'gemini-2.0-flash-exp',
  LITE = 'gemini-2.0-flash-exp',
  LIVE_AUDIO = 'gemini-2.0-flash-exp',
  TTS = 'gemini-2.0-flash-exp',
  VEO = 'gemini-2.0-flash-exp',
  CLOUDFLARE_CHAT = '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  CLOUDFLARE_CODE = '@cf/qwen/qwen2.5-coder-32b-instruct'
}

export type AgentTask = 'reasoning' | 'coding' | 'asset_gen' | 'cinematic' | 'optimization' | 'sprint_planning' | 'world_grounding' | 'ide_test_runtime';

// Game Database Types (from InstantDB schema)
export interface Character {
  id: string;
  userId: string;
  name: string;
  class: string;
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  currentLocation: string;
  isOnline: boolean;
  playTime: number;
  createdAt: number;
  lastPlayedAt?: number;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  type: 'town' | 'dungeon' | 'wilderness';
  difficulty: number;
  minLevel: number;
  isSafeZone: boolean;
  pvpEnabled: boolean;
}

export interface GameEvent {
  id: string;
  type: 'generated_content' | 'system_event' | 'player_action';
  category: 'code' | 'media' | '3d_model' | 'text';
  title: string;
  description: string;
  source: string;
  createdAt: number;
  createdBy: string;
  isPublic: boolean;
  qualityScore?: number;
}

export interface AIUsageMetrics {
  id: string;
  model: string;
  provider: 'gemini' | 'cloudflare' | 'local';
  taskType: 'text' | 'image' | 'code' | 'audio' | 'video';
  inputTokens: number;
  outputTokens: number;
  cost: number;
  duration: number;
  success: boolean;
  userId?: string;
  timestamp: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'main' | 'side' | 'daily';
  minLevel: number;
  difficulty: number;
  isRepeatable: boolean;
  aiGenerated: boolean;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'consumable';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  value: number;
  stackable: boolean;
  isTradable: boolean;
  aiGenerated: boolean;
}

export interface GameSession {
  id: string;
  userId: string;
  characterId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  isActive: boolean;
}
