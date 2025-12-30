import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { OrbitControls } from 'three-stdlib';

interface Model3DViewerProps {
    modelUrl: string;
    format: 'glb' | 'obj';
    className?: string;
}

/**
 * 3D Model Viewer Component
 * Displays GLB/OBJ 3D models using Three.js
 * Features: OrbitControls, auto-centering, auto-scaling, lighting
 */
export function Model3DViewer({ modelUrl, format, className }: Model3DViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        console.log('[3D_VIEWER] Initializing viewer for:', modelUrl);

        // Setup scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a1a);
        sceneRef.current = scene;

        // Setup camera
        const camera = new THREE.PerspectiveCamera(
            75,
            containerRef.current.clientWidth / containerRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.set(0, 1, 5);
        cameraRef.current = camera;

        // Setup renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(
            containerRef.current.clientWidth,
            containerRef.current.clientHeight
        );
        renderer.setPixelRatio(window.devicePixelRatio);
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Setup controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 1;
        controls.maxDistance = 100;
        controls.maxPolarAngle = Math.PI;
        controlsRef.current = controls;

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight as any);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        scene.add(directionalLight as any);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight2.position.set(-5, 3, -5);
        scene.add(directionalLight2 as any);

        // Add grid helper
        const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
        scene.add(gridHelper);

        // Load model based on format
        if (format === 'glb') {
            const loader = new GLTFLoader();
            loader.load(
                modelUrl,
                (gltf: any) => {
                    console.log('[3D_VIEWER] GLB model loaded successfully');
                    scene.add(gltf.scene);

                    // Center and scale model
                    const box = new THREE.Box3().setFromObject(gltf.scene);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());

                    // Center the model
                    gltf.scene.position.sub(center);

                    // Scale model to fit in view
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = 2 / maxDim;
                    gltf.scene.scale.multiplyScalar(scale);

                    console.log('[3D_VIEWER] Model centered and scaled:', { center, size, scale });
                },
                (progress: any) => {
                    const percent = (progress.loaded / progress.total) * 100;
                    console.log('[3D_VIEWER] Loading progress:', percent.toFixed(2) + '%');
                },
                (error: any) => {
                    console.error('[3D_VIEWER] Error loading GLB model:', error);
                }
            );
        } else if (format === 'obj') {
            // TODO: Implement OBJ loader if needed
            console.warn('[3D_VIEWER] OBJ format not yet supported, use GLB');
        }

        // Animation loop
        let animationFrameId: number;
        function animate() {
            animationFrameId = requestAnimationFrame(animate);
            if (controls) controls.update();
            if (renderer && scene && camera) {
                renderer.render(scene, camera);
            }
        }
        animate();

        // Handle window resize
        const handleResize = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            renderer.dispose();
            controls.dispose();
            if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
                containerRef.current.removeChild(renderer.domElement);
            }
        };
    }, [modelUrl, format]);

    return (
        <div
            ref={containerRef}
            className={className || "w-full h-96 rounded-lg overflow-hidden border border-cyan-500/20 bg-black/40"}
            style={{ minHeight: '400px' }}
        />
    );
}

export default Model3DViewer;
