
import * as THREE from 'three';

export interface JointData {
    id: string;
    position: { x: number, y: number, z: number };
    parent?: string;
}

export interface SkeletonData {
    joints: JointData[];
    bones: { from: string, to: string }[];
}

/**
 * Generates a 3D skeleton from 2D normalized input points.
 * Currently projects points onto a standard Z-plane, but can be extended 
 * to infer depth from structure (e.g. symmetry)
 */
export class SkeletonGenerator {

    static generateFrom2D(input: any): SkeletonData {
        const joints: JointData[] = input.joints.map((j: any) => ({
            id: j.id,
            position: { ...j.position },
            parent: this.findParent(j.id, input.bones)
        }));

        // Optimize: Center the skeleton
        const center = new THREE.Vector3();
        joints.forEach(j => center.add(new THREE.Vector3(j.position.x, j.position.y, j.position.z)));
        center.divideScalar(joints.length);

        joints.forEach(j => {
            j.position.x -= center.x;
            j.position.y -= center.y;
            j.position.z -= center.z;
        });

        return {
            joints,
            bones: input.bones
        };
    }

    private static findParent(nodeId: string, bones: { from: string, to: string }[]): string | undefined {
        // Find a bone where this node is the 'to' target
        const connection = bones.find(b => b.to === nodeId);
        return connection ? connection.from : undefined;
    }

    /**
     * Create a simple Three.js Helper to visualize the generated skeleton
     */
    static createVisualization(skeleton: SkeletonData): THREE.Group {
        const group = new THREE.Group();
        const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });

        // Map points for easy lookup
        const pointMap = new Map<string, THREE.Vector3>();
        skeleton.joints.forEach(j => {
            const v = new THREE.Vector3(j.position.x, j.position.y, j.position.z);
            pointMap.set(j.id, v);

            // Debug sphere
            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.05),
                new THREE.MeshBasicMaterial({ color: 0xffff00 })
            );
            sphere.position.copy(v);
            group.add(sphere);
        });

        skeleton.bones.forEach(b => {
            const start = pointMap.get(b.from);
            const end = pointMap.get(b.to);

            if (start && end) {
                const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
                const line = new THREE.Line(geometry, material);
                group.add(line);
            }
        });

        return group;
    }
}
