/**
 * Limbs Index — Central export for all Neural Limbs
 * Total: 14 Limbs, 395+ Capabilities (approaching 500 target)
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

export {
    registerEntityLimb, bindEntityLimb,
    registerFileLimb, registerDataLimb,
    registerMeshOpsLimb, registerMaterialLimb,
    registerAIModelLimb, registerCodeLimb,
    registerImageLimb, registerAudioLimb, registerVideoLimb,
    registerNetworkLimb, registerWorldLimb, registerPhysicsLimb,
    registerAnimationLimb
};

/**
 * Register all limbs — Phase 67: 500 Fingers
 * 
 * Capabilities by Limb:
 * - EntityLimb: 30 (scene entity CRUD, transforms, selection)
 * - FileLimb: 25 (file read/write, directories, R2 storage)
 * - DataLimb: 30 (data parsing, stats, profiling)
 * - MeshOpsLimb: 50 (geometry, UV, measurements, export)
 * - MaterialLimb: 25 (PBR materials, textures, shaders)
 * - AIModelLimb: 30 (chat, generation, embeddings, analysis)
 * - CodeLimb: 30 (parsing, refactoring, execution)
 * - ImageLimb: 35 (presets, img2img, sprites, textures, AI)
 * - AudioLimb: 35 (SFX presets, music, remix, mock sounds)
 * - VideoLimb: 30 (video-from-image, restyle, cutscenes)
 * - NetworkLimb: 20 (HTTP, WebSocket, caching)
 * - WorldLimb: 30 (terrain, weather, lighting, navmesh)
 * - PhysicsLimb: 25 (rigidbody, colliders, forces, joints)
 * - AnimationLimb: 30 (clips, keyframes, rigging, IK, mocap)
 * 
 * TOTAL: 425 capabilities
 * 
 * + Existing ApplicationLimbs: ~10 capabilities
 * + Existing SystemLimbs: ~5 capabilities
 * = ~440 total capabilities
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

    console.log('[Limbs] Phase 67 Complete: 14 Limbs, 425 Capabilities registered.');
};
