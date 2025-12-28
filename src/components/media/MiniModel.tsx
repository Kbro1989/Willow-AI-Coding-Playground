import React, { Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Stage, Float } from '@react-three/drei';
import * as THREE from 'three';

const Model = ({ url }: { url: string }) => {
    const { scene } = useGLTF(url);
    const meshRef = React.useRef<THREE.Group>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.01;
        }
    });

    return <primitive ref={meshRef} object={scene} />;
};

export const MiniModel: React.FC<{ url: string }> = ({ url }) => {
    return (
        <div className="w-full h-full pointer-events-none">
            <Canvas camera={{ position: [0, 0, 5], fov: 40 }} gl={{ alpha: true }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <Suspense fallback={null}>
                    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                        <Stage environment="city" intensity={0.5}>
                            <Model url={url} />
                        </Stage>
                    </Float>
                </Suspense>
            </Canvas>
        </div>
    );
};
