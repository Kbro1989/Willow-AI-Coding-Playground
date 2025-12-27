
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Center, Text } from '@react-three/drei';
import * as THREE from 'three';

interface ShaderPreviewProps {
    fragmentShader: string;
    vertexShader?: string;
    uniforms?: { [key: string]: { value: any } };
}

const DEFAULT_VERTEX_SHADER = `
varying vec2 v_uv;
varying vec3 v_normal;
varying vec3 v_viewPosition;

void main() {
  v_uv = uv;
  v_normal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  v_viewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const ShaderPlane: React.FC<ShaderPreviewProps> = ({ fragmentShader, vertexShader = DEFAULT_VERTEX_SHADER, uniforms = {} }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const { size } = useThree();

    const shaderUniforms = useMemo(() => ({
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(size.width, size.height) },
        ...uniforms
    }), [uniforms, size]);

    useFrame((state) => {
        if (meshRef.current) {
            const material = meshRef.current.material as THREE.ShaderMaterial;
            material.uniforms.u_time.value = state.clock.getElapsedTime();
            material.uniforms.u_resolution.value.set(size.width, size.height);
        }
    });

    return (
        <mesh ref={meshRef}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={shaderUniforms}
                transparent
            />
        </mesh>
    );
};

const ShaderPreview: React.FC<ShaderPreviewProps> = (props) => {
    return (
        <div className="w-full h-full bg-slate-950 relative rounded-2xl overflow-hidden border border-cyan-900/20 shadow-2xl">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none">
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_#00f2ff]"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-500/80">Live Shader Stream</span>
            </div>

            <Canvas dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[0, 0, 2]} />
                <OrbitControls enableZoom={false} enablePan={false} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />

                <Center>
                    <ShaderPlane {...props} />
                </Center>
            </Canvas>

            <div className="absolute bottom-4 right-4 z-10 pointer-events-none opacity-40">
                <div className="text-[8px] font-mono text-cyan-400 uppercase tracking-tighter">
                    RTM_VOLTAGE: 1.2V | FREQ: 60Hz
                </div>
            </div>
        </div>
    );
};

export default ShaderPreview;
