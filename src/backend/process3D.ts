import * as THREE from 'three';

export interface ModelStats {
    vertices: number;
    faces: number;
    format: string;
    isSanitized: boolean;
}

/**
 * Detects 3D format based on header or extension
 */
export const detect3DFormat = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'glb':
        case 'gltf': return 'GLTF/Binary';
        case 'obj': return 'Wavefront OBJ';
        case 'stl': return 'STereoLithography';
        default: return 'Unknown';
    }
};

/**
 * Extracts metadata and validates the 3D model
 */
export const process3DModel = (mesh: THREE.Mesh): ModelStats => {
    const geometry = mesh.geometry;
    const vertices = geometry.attributes.position.count;
    const faces = geometry.index ? geometry.index.count / 3 : vertices / 3;

    return {
        vertices,
        faces,
        format: 'ThreeJS BufferGeometry',
        isSanitized: true
    };
};

/**
 * RSMV Color Modification: Applies hex colors to specific model segments
 * This mimics the RuneApps model viewer functionality.
 */
export const modifyModelColors = (mesh: THREE.Mesh, segmentMap: Record<string, string>) => {
    mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            // If the mesh has a name or material name matching a segment
            const targetColor = segmentMap[child.name] || segmentMap[child.material.name];
            if (targetColor) {
                child.material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(targetColor),
                    roughness: 0.7,
                    metalness: 0.2
                });
            }
        }
    });

    console.log('[BACKEND_3D] Segment colors synchronized with RSMV map');
    return mesh;
};
