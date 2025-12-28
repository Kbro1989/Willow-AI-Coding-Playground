import * as THREE from "three";

/**
 * Clean, stable interfaces for RSMV consumers.
 * Internal generated types should NOT be exported here.
 */

export interface RSMVModel {
    id: number;
    name: string;
    scene: THREE.Group;
    metadata?: Record<string, any>;
}

export interface RSMVAvatar {
    name: string;
    scene: THREE.Group;
    slots: Record<string, number>;
}

export interface RSMVServiceConfig {
    cacheUrl?: string;
    glbBaseUrl?: string;
    useGlbFirst?: boolean;
}

export interface IRSMVService {
    loadModel(id: number): Promise<RSMVModel>;
    loadAvatar(name: string): Promise<RSMVAvatar>;
    dispose(): void;
}
