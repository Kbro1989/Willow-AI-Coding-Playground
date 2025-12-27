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

export const ViewportManager: React.FC = () => {
    const { camera, gl, scene, size } = useThree();

    const fitToScreen = useCallback((padding = 1.2) => {
        const box = new THREE.Box3().setFromObject(scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

        cameraZ *= padding; // Add padding

        camera.position.set(center.x + cameraZ, center.y + cameraZ, center.z + cameraZ);
        camera.lookAt(center);
        (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }, [camera, scene]);

    useEffect(() => {
        // Auto-fit on initial load or scene change
        const timer = setTimeout(() => fitToScreen(), 500);
        return () => clearTimeout(timer);
    }, [size, fitToScreen]);

    return null;
};
