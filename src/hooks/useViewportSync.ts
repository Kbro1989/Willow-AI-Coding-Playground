import { useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * useViewportSync
 * QoL Hook for managing 3D viewport fitting and responsive bounds.
 */
export const useViewportSync = () => {
    // This hook is intended to be used INSIDE a Canvas component
    // We'll export a version that can be used outside as well if needed
};

export const ViewportManager: React.FC<{ targets?: any[] }> = ({ targets = [] }) => {
    const { camera, gl, scene, size } = useThree();

    const fitToScreen = useCallback((padding = 1.2) => {
        const box = new THREE.Box3();

        if (targets.length > 0) {
            // Find world objects in the scene that match our state targets
            scene.traverse((obj) => {
                if (obj.name.startsWith('obj-') || (obj.type === 'Mesh' && targets.some(t => t.name === obj.name))) {
                    box.expandByObject(obj);
                }
            });
        }

        // If box is still empty or we want to lock to center
        if (box.isEmpty()) {
            box.setFromCenterAndSize(new THREE.Vector3(0, 0, 0), new THREE.Vector3(2, 2, 2));
        }

        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

        cameraZ *= padding;
        cameraZ = Math.min(Math.max(cameraZ, 12), 60);

        camera.position.set(center.x + cameraZ, center.y + cameraZ * 0.6, center.z + cameraZ);
        camera.lookAt(center);
        (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }, [camera, scene, targets]);


    useEffect(() => {
        const timer = setTimeout(() => fitToScreen(), 500);
        return () => clearTimeout(timer);
    }, [fitToScreen]);


    return null;
};
