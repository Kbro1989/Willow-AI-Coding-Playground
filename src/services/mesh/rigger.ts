
import * as THREE from 'three';
import { SkeletonData } from './skeletonGenerator';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export class Rigger {

    /**
     * Converts a static mesh and skeleton data into a SkinnedMesh.
     * Applies simple automatic weight calculation based on distance to bones.
     */
    static bindSkeleton(mesh: THREE.Mesh, skeletonData: SkeletonData): THREE.SkinnedMesh {
        // 1. Create Bone objects hierarchy
        const bones: THREE.Bone[] = [];
        const boneMap = new Map<string, THREE.Bone>();

        // Create all bones first
        skeletonData.joints.forEach(j => {
            const bone = new THREE.Bone();
            bone.name = j.id;
            bone.position.set(j.position.x, j.position.y, j.position.z);
            bones.push(bone);
            boneMap.set(j.id, bone);
        });

        // Link hierarchy
        skeletonData.joints.forEach(j => {
            if (j.parent) {
                const parentBone = boneMap.get(j.parent);
                const childBone = boneMap.get(j.id);
                if (parentBone && childBone) {
                    // Adjust position to be relative to parent
                    childBone.position.sub(parentBone.position);
                    parentBone.add(childBone);
                }
            }
        });

        // 2. Create Skeleton
        const skeleton = new THREE.Skeleton(bones);

        // 3. Prepare Geometry (add skin indices and weights)
        const geometry = mesh.geometry.clone();

        // Ensure indexed
        if (!geometry.index) {
            // geometry = BufferGeometryUtils.mergeVertices(geometry); // Optional if needed
        }

        const positionAttribute = geometry.attributes.position;
        const skinIndices = [];
        const skinWeights = [];

        // Simple auto-skinning: closest bone gets 100% weight (or blended)
        for (let i = 0; i < positionAttribute.count; i++) {
            const vertex = new THREE.Vector3();
            vertex.fromBufferAttribute(positionAttribute, i);

            // Find closest bone
            let minDist = Infinity;
            let boneIndex = 0;

            // Note: Use world positions for distance check (simplified here assuming bind pose)
            bones.forEach((bone, idx) => {
                // Approximate world pos for distance check
                // For a proper implementation, we'd need to traverse the hierarchy to get world pos
                // But since we just created them, let's use the skeletonData raw positions
                const j = skeletonData.joints.find(jw => jw.id === bone.name);
                if (j) {
                    const dist = vertex.distanceTo(new THREE.Vector3(j.position.x, j.position.y, j.position.z));
                    if (dist < minDist) {
                        minDist = dist;
                        boneIndex = idx;
                    }
                }
            });

            // Push 4 weights/indices (standard for Three.js)
            skinIndices.push(boneIndex, 0, 0, 0);
            skinWeights.push(1, 0, 0, 0);
        }

        geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
        geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));

        // 4. Create SkinnedMesh
        const material = (mesh.material as THREE.Material).clone();
        const skinnedMesh = new THREE.SkinnedMesh(geometry, material);

        // Root bone needs to be added to the scene or the mesh
        // Find root (bone with no parent in this context, or just add the top-level ones)
        const rootBones = bones.filter(b => !b.parent);
        rootBones.forEach(b => skinnedMesh.add(b));

        skinnedMesh.bind(skeleton);

        return skinnedMesh;
    }

    /**
     * Exports a 3D Object (Mesh or SkinnedMesh) to GLB format
     */
    static async exportToGLB(object: THREE.Object3D): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const exporter = new GLTFExporter();
            exporter.parse(
                object,
                (gltf) => {
                    if (gltf instanceof ArrayBuffer) {
                        resolve(new Blob([gltf], { type: 'model/gltf-binary' }));
                    } else {
                        // Should handle JSON output too if needed, but we requested binary usually
                        const output = JSON.stringify(gltf, null, 2);
                        resolve(new Blob([output], { type: 'application/json' }));
                    }
                },
                (error) => reject(error),
                { binary: true }
            );
        });
    }
}
