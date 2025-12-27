/**
 * PRO TYPE TAXONOMY
 * A forward-leaning type system for game-dev, AI-augmented DevOps, and live telemetry.
 */

// 1. Core DevOps Usage Types
export type EnvironmentType = 'local' | 'dev' | 'staging' | 'production' | 'edge' | 'offline';
export type RuntimeTarget = 'browser' | 'worker' | 'node' | 'deno' | 'wasm' | 'native';
export type DeploymentStrategy = 'blue_green' | 'canary' | 'rolling' | 'static' | 'ephemeral';
export type ResourceBindingType = 'kv' | 'd1' | 'r2' | 'ai_model' | 'secret' | 'queue' | 'websocket';
export type ServiceHealthState = 'healthy' | 'degraded' | 'read_only' | 'offline' | 'unknown';
export type FailureMode = 'timeout' | 'rate_limited' | 'auth_failed' | 'schema_mismatch' | 'upstream_unavailable';

// 2. AI Media & Model Call Types
export type AIInvocationType = 'completion' | 'chat' | 'embedding' | 'vision' | 'audio_in' | 'audio_out' | 'tool_call' | 'reasoning_trace';
export type ModelSource = 'local_ollama' | 'cloudflare_ai' | 'openai' | 'gemini' | 'custom_hosted';
export type MediaType = 'text' | 'image' | 'audio' | 'video' | 'mesh' | 'texture' | 'animation';
export type MediaEncoding = 'utf8' | 'base64' | 'binary' | 'stream' | 'chunked';
export type InferenceMode = 'sync' | 'async' | 'streaming' | 'speculative' | 'fallback';
export type ModelFallbackPolicy = 'local_first' | 'cloud_first' | 'cheapest' | 'fastest' | 'deterministic_only';

// 3. Code Editor & Editorial Automation Types
export type EditorSurface = 'monaco' | 'codemirror' | 'vscode' | 'custom_canvas';
export type EditorMode = 'readonly' | 'edit' | 'diff' | 'review' | 'debug' | 'live_sync';
export type EditorialActionType = 'lint' | 'format' | 'refactor' | 'optimize' | 'document' | 'annotate' | 'explain' | 'rewrite';
export type CodeScope = 'file' | 'module' | 'workspace' | 'dependency_graph' | 'runtime_trace';
export type EditTrustLevel = 'preview_only' | 'human_confirmed' | 'auto_apply' | 'rollback_guarded';
export type ChangeImpactLevel = 'cosmetic' | 'local' | 'cross_module' | 'systemic';

// 4. Game Dev Ops & Live Telemetry Types
export type GameRuntimeState = 'boot' | 'loading' | 'live' | 'paused' | 'desynced' | 'shutdown';
export type PersistenceLayer = 'client_memory' | 'edge_kv' | 'server_db' | 'event_log';
export type TelemetryEventType = 'input' | 'combat' | 'movement' | 'economy' | 'ai_decision' | 'error' | 'exploit_detected';
export type ObserverAgentType = 'logger' | 'validator' | 'anti_cheat' | 'balance_monitor' | 'ai_referee';

// 5. Front-End Logic Overcompensation Layer
export type UIStateAuthority = 'client' | 'edge' | 'server' | 'ai_mediated';
export type RenderTrigger = 'user_input' | 'network_event' | 'ai_response' | 'telemetry_tick';
export type SchemaStrictness = 'loose' | 'validated' | 'strict' | 'fail_fast';
export type FallbackUIBehavior = 'skeleton' | 'cached' | 'read_only' | 'offline_banner';
export type UIFailureScope = 'component' | 'page' | 'session' | 'global';
