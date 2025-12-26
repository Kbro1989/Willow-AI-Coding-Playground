
import * as THREE from 'three';
import { SkeletonData } from './skeletonGenerator';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export class MeshBuilder {

    /**
     * Generates a base mesh (clay) from a skeleton.
     * Uses capsule/tube geometry for each bone and merges them.
     */
    static generateBaseMesh(skeleton: SkeletonData, thickness: number = 0.1): THREE.Mesh {
        const geometries: THREE.BufferGeometry[] = [];

        // Map positions
        const pointMap = new Map<string, THREE.Vector3>();
        skeleton.joints.forEach(j => {
            pointMap.set(j.id, new THREE.Vector3(j.position.x, j.position.y, j.position.z));
        });

        skeleton.bones.forEach(bone => {
            const start = pointMap.get(bone.from);
            const end = pointMap.get(bone.to);

            if (start && end) {
                // Create a path for the tube
                const path = new THREE.LineCurve3(start, end);

                // TubeGeometry: path, segments, radius, radiusSegments, closed
                const geometry = new THREE.TubeGeometry(path, 4, thickness, 8, false);
                geometries.push(geometry);

                // Add sphere caps at joints for smooth connections
                const capGeo = new THREE.SphereGeometry(thickness, 8, 8);
                capGeo.translate(start.x, start.y, start.z);
                geometries.push(capGeo);

                const capGeoEnd = new THREE.SphereGeometry(thickness, 8, 8);
                capGeoEnd.translate(end.x, end.y, end.z);
                geometries.push(capGeoEnd);
            }
        });

        // Merge all
        let mergedGeometry: THREE.BufferGeometry;
        if (geometries.length > 0) {
            // Note: mergeGeometries might return null if array is empty, but we check length
            mergedGeometry = mergeGeometries(geometries as any) || new THREE.BoxGeometry();
        } else {
            mergedGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        }

        const material = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.5,
            metalness: 0.1,
            flatShading: true // Low-poly clay look
        });

        return new THREE.Mesh(mergedGeometry, material);
    }
}
