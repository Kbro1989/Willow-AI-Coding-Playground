
import React, { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { RSMVEngine } from '../../services/rsmvService';
import ErrorBoundary from '../ErrorBoundary';

const ScanningSchematic: React.FC = () => {
    const ringRef = useRef<THREE.Mesh>(null);
    const boxRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (ringRef.current) {
            ringRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 1.5;
            ringRef.current.rotation.x = Math.PI / 2;
        }
        if (boxRef.current) {
            boxRef.current.rotation.y += 0.01;
            boxRef.current.rotation.x += 0.005;
        }
    });

    return (
        <group>
            {/* Rotating Wireframe Silhouette */}
            <mesh ref={boxRef}>
                <boxGeometry args={[2, 2, 2]} />
                <meshStandardMaterial color="#438ab5" wireframe transparent opacity={0.3} />
            </mesh>

            {/* Scanning Light Ring */}
            <mesh ref={ringRef}>
                <torusGeometry args={[1.5, 0.02, 16, 100]} />
                <meshBasicMaterial color="#438ab5" transparent opacity={0.8} />
            </mesh>

            {/* Matrix Particles Placeholder */}
            <points>
                <sphereGeometry args={[2, 16, 16]} />
                <pointsMaterial color="#438ab5" size={0.05} transparent opacity={0.2} />
            </points>

            <Html center>
                <div className="flex flex-col items-center gap-2 pointer-events-none select-none">
                    <div className="bg-[#438ab5]/20 border border-[#438ab5] px-4 py-2 rounded-full backdrop-blur-md">
                        <span className="text-[10px] font-black tracking-[0.3em] text-[#438ab5] animate-pulse">DATA SCAN IN PROGRESS</span>
                    </div>
                    <div className="text-[8px] text-[#8397a5] font-mono opacity-50 uppercase">BETHESDA_NIF_INDEXER v1.0</div>
                </div>
            </Html>
        </group>
    );
};

interface RealModelViewProps {
    modelId?: number;
    filePath?: string;
    wireframe: boolean;
}

export const RealModelView: React.FC<RealModelViewProps> = ({ modelId, filePath, wireframe }) => {
    const meshRef = useRef<THREE.Group>(null);
    const [sceneNode, setSceneNode] = useState<THREE.Object3D | 'schematic' | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const loadModel = async () => {
            setIsLoading(true);
            setError(null);
            try {
                if (modelId) {
                    const engine = RSMVEngine.getInstance();
                    const rsmvModel = await engine.loadModel(modelId);

                    if (isMounted) {
                        setSceneNode(rsmvModel.scene as any);
                    }
                } else if (filePath) {
                    if (filePath.toLowerCase().endsWith('.nif')) {
                        const { BethesdaAssetService } = await import('../../services/bethesdaAssetService');
                        // Infer game source from path or context (for now defaulting to morrowind as it's the main target)
                        // In a real app we'd pass this prop or derive it.
                        // However, filePath in indexedModels usually implies a known source.
                        // Let's assume 'morrowind' for this NIF integration as per plan.
                        const node = await BethesdaAssetService.getInstance().loadNif('morrowind', filePath) as any;

                        if (isMounted) {
                            // Auto-scale huge Morrowind models to fit view
                            // Morrowind units are 1 unit = 1.42cm approx? Or 64 units = 1 yard.
                            // Objects are often large.
                            const box = new THREE.Box3().setFromObject(node);
                            const size = box.getSize(new THREE.Vector3()).length();
                            if (size > 1000) {
                                // Scale down
                                node.scale.multiplyScalar(100 / size);
                            } else if (size < 1) {
                                node.scale.multiplyScalar(10 / size);
                            }

                            setSceneNode(node as any);
                        }
                    } else {
                        // Fallback for non-nif files
                        if (isMounted) setSceneNode('schematic');
                    }
                }
            } catch (err: any) {
                console.error(err);
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadModel();
        return () => { isMounted = false; };
    }, [modelId, filePath]);

    useFrame(() => {
        if (meshRef.current) meshRef.current.rotation.y += 0.01;
    });

    if (isLoading) return <Html center><div className="text-cyan-500 text-xs font-bold uppercase tracking-widest animate-pulse">Loading Model {modelId}...</div></Html>;
    if (error) return <Html center><div className="text-red-500 text-[10px] font-bold uppercase tracking-widest">Error: {error}</div></Html>;
    if (!sceneNode) return null;

    // Apply wireframe to all materials if requested (skip for schematic)
    if (typeof sceneNode !== 'string') {
        sceneNode.traverse((obj) => {
            if ((obj as any).isMesh) {
                const mesh = obj as THREE.Mesh;
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(m => (m as any).wireframe = wireframe);
                } else {
                    (mesh.material as any).wireframe = wireframe;
                }
            }
        });
    }

    return (
        <group ref={meshRef}>
            {sceneNode === 'schematic' ? (
                <ScanningSchematic />
            ) : (
                <primitive object={sceneNode} />
            )}
        </group>
    );
};
