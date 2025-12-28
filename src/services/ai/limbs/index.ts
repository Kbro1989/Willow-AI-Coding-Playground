/**
 * Limbs Index — Central export for all Neural Limbs
 * Total: 17 Limbs, 505+ Capabilities — Agent Symphony Architecture
 */

import { registerEntityLimb, bindEntityLimb } from './EntityLimb';
import { registerFileLimb } from './FileLimb';
import { registerDataLimb } from './DataLimb';
import { registerMeshOpsLimb } from './MeshOpsLimb';
import { registerMaterialLimb } from './MaterialLimb';
import { registerAIModelLimb } from './AIModelLimb';
import { registerCodeLimb } from './CodeLimb';
import { registerImageLimb } from './ImageLimb';
import { registerAudioLimb } from './AudioLimb';
import { registerVideoLimb } from './VideoLimb';
import { registerNetworkLimb } from './NetworkLimb';
import { registerWorldLimb } from './WorldLimb';
import { registerPhysicsLimb } from './PhysicsLimb';
import { registerAnimationLimb } from './AnimationLimb';
import { registerLiveGameLimb } from './LiveGameLimb';
import { registerOrchestratorLimb } from './OrchestratorLimb';
import { registerAssetPipelineLimb } from './AssetPipelineLimb';

export {
    registerEntityLimb, bindEntityLimb,
    registerFileLimb, registerDataLimb,
    registerMeshOpsLimb, registerMaterialLimb,
    registerAIModelLimb, registerCodeLimb,
    registerImageLimb, registerAudioLimb, registerVideoLimb,
    registerNetworkLimb, registerWorldLimb, registerPhysicsLimb,
    registerAnimationLimb, registerLiveGameLimb, registerOrchestratorLimb,
    registerAssetPipelineLimb
};

/**
 * Register all limbs — Agent Symphony Architecture
 * 
 * ┌─────────────────────────────────────────────────────────────┐
 * │                      BRAIN (Orchestrator)                   │
 * │  symphony_from_prompt → Agent planning & coordination       │
 * └─────────────────────────┬───────────────────────────────────┘
 *                           │
 * ┌─────────────────────────▼───────────────────────────────────┐
 * │                      SPINE (Registry)                       │
 * │  Routes capabilities between limbs, tracks state            │
 * └───┬─────────┬─────────┬─────────┬─────────┬─────────┬───────┘
 *     │         │         │         │         │         │
 * ┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐
 * │ Artist│ │ Coder │ │ Audio │ │ World │ │ Game  │ │Pipeline│
 * │ Limbs │ │ Limbs │ │ Limbs │ │ Limbs │ │ Limbs │ │ Limbs  │
 * └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └────────┘
 *
 * Capabilities by Limb (17 total, 505 capabilities):
 * 
 * CORE FOUNDATION (85):
 * - EntityLimb: 30 (scene entity CRUD, transforms, selection)
 * - FileLimb: 25 (file read/write, directories, R2 storage)
 * - DataLimb: 30 (data parsing, stats, profiling)
 * 
 * 3D OPERATIONS (75):
 * - MeshOpsLimb: 50 (geometry, UV, measurements, export)
 * - MaterialLimb: 25 (PBR materials, textures, shaders)
 * 
 * AI & CODE (60):
 * - AIModelLimb: 30 (chat, generation, embeddings, analysis)
 * - CodeLimb: 30 (parsing, refactoring, execution)
 * 
 * WORLD & PHYSICS (55):
 * - WorldLimb: 30 (terrain, weather, lighting, navmesh)
 * - PhysicsLimb: 25 (rigidbody, colliders, forces, joints)
 * 
 * MEDIA — ENHANCED FOR GAME ASSETS (130):
 * - ImageLimb: 35 (presets, img2img, sprites, textures)
 * - AudioLimb: 35 (SFX presets, remix, mock sounds)
 * - VideoLimb: 30 (video-from-image, restyle, cutscenes)
 * - AnimationLimb: 30 (clips, keyframes, rigging, IK, mocap)
 * 
 * NETWORK (20):
 * - NetworkLimb: 20 (HTTP, WebSocket, caching)
 * 
 * AGENT SYMPHONY — NEW (80):
 * - LiveGameLimb: 30 (real-time state, reactive AI, AI Director)
 * - OrchestratorLimb: 25 (symphony_from_prompt, pipelines, agent collaboration)
 * - AssetPipelineLimb: 25 (batch sprite sheets, tilesets, UI kits, audio packs)
 * 
 * TOTAL: 505 CAPABILITIES
 */
export const registerAllLimbs = () => {
    // Phase 67.1 - Core Foundation (85)
    registerEntityLimb();     // 30 caps - Scene entity management
    registerFileLimb();       // 25 caps - File system operations
    registerDataLimb();       // 30 caps - Data & performance analysis

    // Phase 67.2 - 3D Operations (75)
    registerMeshOpsLimb();    // 50 caps - Geometry manipulation
    registerMaterialLimb();   // 25 caps - Materials & shaders

    // Phase 67.3 - AI & Code (60)
    registerAIModelLimb();    // 30 caps - AI model access
    registerCodeLimb();       // 30 caps - Code operations

    // Phase 67.4 - World & Physics (55)
    registerWorldLimb();      // 30 caps - World building
    registerPhysicsLimb();    // 25 caps - Physics simulation

    // Phase 67.5 - Media (130) — ENHANCED for game assets
    registerImageLimb();      // 35 caps - Presets, img2img, sprites, textures
    registerAudioLimb();      // 35 caps - SFX presets, remix, mock sounds
    registerVideoLimb();      // 30 caps - Video-from-image, restyle, cutscenes
    registerAnimationLimb();  // 30 caps - Animation & rigging

    // Phase 67.6 - Network (20)
    registerNetworkLimb();    // 20 caps - HTTP, WebSocket, caching

    // Phase 68 - Agent Symphony (80) — THE BRAIN
    registerLiveGameLimb();      // 30 caps - Real-time game state, reactive AI
    registerOrchestratorLimb();  // 25 caps - Multi-agent symphony conductor
    registerAssetPipelineLimb(); // 25 caps - Batch asset generation

    console.log('[Limbs] Agent Symphony Complete: 17 Limbs, 505 Capabilities registered.');
    console.log('[Limbs] Architecture: Brain (Orchestrator) → Spine (Registry) → Limbs → Fingertips');
};
