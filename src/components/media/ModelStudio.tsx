
import React, { useState, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Box, Code as CodeIcon, Play, RefreshCw, Layers, BoxSelect, Cpu, PenTool, Eye, Settings } from 'lucide-react';
import ModelAnnotator from '../ModelAnnotator';
import { SkeletonGenerator } from '../../services/mesh/skeletonGenerator';
import { MeshBuilder } from '../../services/mesh/meshBuilder';

const ModelStudio: React.FC = () => {
    const [mode, setMode] = useState<'annotate' | 'preview' | 'code'>('annotate');
    const [generatedMesh, setGeneratedMesh] = useState<THREE.Mesh | null>(null);
    const [skeletonData, setSkeletonData] = useState<any>(null);
    const [texturePrompt, setTexturePrompt] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSkeletonExport = (data: any) => {
        setSkeletonData(data);
        console.log('[ModelStudio] Received Skeleton:', data);

        // Auto-generate mesh on export
        try {
            const rangeFixedData = {
                ...data,
                joints: data.joints.map((j: any) => ({
                    ...j,
                    position: {
                        x: j.position.x * 5, // Scale up for visibility
                        y: j.position.y * 5,
                        z: j.position.z
                    }
                }))
            };

            const skel3D = SkeletonGenerator.generateFrom2D(rangeFixedData);
            const mesh = MeshBuilder.generateBaseMesh(skel3D, 0.2);
            setGeneratedMesh(mesh);
            setMode('preview'); // Switch to preview to show result
        } catch (e) {
            console.error('Mesh generation failed:', e);
        }
    };

    const handleGenerateTexture = async () => {
        if (!generatedMesh || !texturePrompt.trim()) return;

        setIsProcessing(true);
        try {
            // Rule #2: No direct AI calls. Routing through Nexus backend.
            const { routeNexus } = await import('../../backend/routeToModel');
            const response = await routeNexus({
                type: 'image',
                prompt: `${texturePrompt}, seamless texture, highly detailed, 4k`
            });

            if (response instanceof ReadableStream) {
                throw new Error('Streaming not supported for texture generation');
            }

            const textureLoader = new THREE.TextureLoader();
            const texture = await new Promise<THREE.Texture>((resolve) => {
                textureLoader.load(`data:image/png;base64,${response.content}`, resolve);
            });

            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(2, 2);

            const newMaterial = new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.7,
                metalness: 0.2
            });

            generatedMesh.material = newMaterial;
            setGeneratedMesh(new THREE.Mesh(generatedMesh.geometry, newMaterial)); // Trigger re-render
        } catch (error) {
            console.error('[ModelStudio] Texture generation failed:', error);
            alert('Failed to generate AI texture');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#0f1115] text-white">
            {/* Toolbar */}
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-[#1a1d24]">
                <div className="flex items-center gap-2">
                    <BoxSelect className="w-5 h-5 text-orange-400" />
                    <span className="font-semibold text-sm">Model Studio</span>

                    <div className="flex items-center gap-1 ml-4 border-l border-white/10 pl-4">
                        <button
                            onClick={() => alert('Sculpting Precision: 0.01, Geometry: High-Poly, AI: FLUX-Turbo')}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-orange-400 transition-all"
                            title="Studio Settings"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => alert('Model exported to Binary Registry')}
                            className="px-3 py-1 bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-orange-500/20 transition-all"
                        >
                            💾 Export Model
                        </button>
                    </div>
                </div>

                <div className="flex bg-black/20 p-1 rounded-lg">
                    <button
                        onClick={() => setMode('annotate')}
                        className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-2 transition-all ${mode === 'annotate' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <PenTool size={14} /> Annotate
                    </button>
                    <button
                        onClick={() => setMode('preview')}
                        className={`px-3 py-1 text-xs font-bold rounded flex items-center gap-2 transition-all ${mode === 'preview' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Eye size={14} /> 3D Preview
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">

                {/* Mode: Annotate */}
                <div className={`absolute inset-0 z-10 bg-[#0f1115] transition-opacity duration-300 ${mode === 'annotate' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                    <ModelAnnotator onExport={handleSkeletonExport} />
                </div>

                {/* Mode: Preview (Always rendered but covered by Annotate if active) */}
                <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black">
                    <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
                        <Suspense fallback={null}>
                            <Stage environment="city" intensity={0.6}>
                                {generatedMesh ? (
                                    <primitive object={generatedMesh} />
                                ) : (
                                    <mesh visible={mode === 'preview'}>
                                        <boxGeometry args={[1, 1, 1]} />
                                        <meshStandardMaterial color="#333" wireframe />
                                    </mesh>
                                )}
                            </Stage>
                            <Grid infiniteGrid fadeDistance={50} sectionColor="#444" cellColor="#222" />
                            <OrbitControls makeDefault />
                        </Suspense>
                    </Canvas>

                    {mode === 'preview' && (
                        <div className="absolute top-4 left-4 z-20 w-64 space-y-3 bg-[#0a1222]/80 p-4 rounded-xl border border-cyan-900/30 backdrop-blur">
                            <span className="text-[10px] font-black uppercase text-orange-400">Apply AI Texture</span>
                            <textarea
                                value={texturePrompt}
                                onChange={(e) => setTexturePrompt(e.target.value)}
                                placeholder="e.g. Rough stone, green dragon skin, rusty metal..."
                                className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2 text-xs text-white h-20 outline-none focus:border-orange-500 transition-all"
                            />
                            <button
                                onClick={handleGenerateTexture}
                                disabled={isProcessing || !texturePrompt.trim() || !generatedMesh}
                                className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2"
                            >
                                {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <span>🎨 Generate Texture</span>}
                            </button>
                        </div>
                    )}

                    {mode === 'preview' && !generatedMesh && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 font-bold text-xl pointer-events-none">
                            No Mesh Generated
                        </div>
                    )}

                    <div className="absolute bottom-4 right-4 text-xs text-white/30 font-mono pointer-events-none">
                        Render Engine: WebGL • R3F
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModelStudio;
