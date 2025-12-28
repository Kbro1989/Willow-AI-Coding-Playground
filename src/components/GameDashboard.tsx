import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { AnnotationOverlay } from './AnnotationOverlay';
import ErrorBoundary from './ErrorBoundary';
import { ViewportManager } from '../hooks/useViewportSync';
import { Canvas, useFrame, useThree, ThreeElements } from '@react-three/fiber';
import { OrbitControls, Sky, Environment, ContactShadows, PerspectiveCamera, Float, Stars, Grid, Gltf, MeshWobbleMaterial, MeshDistortMaterial } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Scanline, Noise } from '@react-three/postprocessing';
import { XR, createXRStore } from '@react-three/xr';
import * as THREE from 'three';
import {
  BuildInfo, GameAsset, SceneObject, PhysicsConfig, PipelineConfig,
  RenderConfig, CompositingConfig, SimulationState,
  WorldConfig, NeuralNode, NeuralEdge, EngineLog, SculptPoint
} from '../types';
import { neuralRegistry } from '../services/ai/NeuralRegistry';

// Augment the 'react' module's JSX namespace to include ThreeElements
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements { }
  }
}

// Safe wrapper for EffectComposer that waits for renderer initialization
const SafeEffectComposer: React.FC<{ compositingConfig: CompositingConfig }> = ({ compositingConfig }) => {
  const { gl } = useThree();

  // Don't render until WebGL context is ready
  if (!gl) return null;

  return (
    <EffectComposer>
      <Bloom
        intensity={compositingConfig.bloom || 0}
        luminanceThreshold={1.0}
        luminanceSmoothing={0.9}
      />
      <ChromaticAberration
        offset={new THREE.Vector2(compositingConfig.chromaticAberration || 0, compositingConfig.chromaticAberration || 0)}
      />
      <Vignette
        offset={0.5}
        darkness={compositingConfig.vignette || 0}
      />
      {compositingConfig.scanlines && compositingConfig.scanlines > 0 && (
        <Scanline opacity={compositingConfig.scanlines} />
      )}
      {compositingConfig.noise && compositingConfig.noise > 0 && (
        <Noise opacity={compositingConfig.noise} />
      )}
    </EffectComposer>
  );
};

interface GameDashboardProps {
  onBuild: (prompt?: string) => void;
  buildInfo: BuildInfo;
  assets: GameAsset[];
  physics: PhysicsConfig;
  worldConfig: WorldConfig;
  sceneObjects: SceneObject[];
  pipelines: PipelineConfig[];
  renderConfig: RenderConfig;
  compositingConfig: CompositingConfig;
  simulation: SimulationState;
  onUpdatePhysics: (updates: Partial<PhysicsConfig>) => void;
  onUpdateWorld: (updates: Partial<WorldConfig>) => void;
  onUpdateSceneObject: (id: string, updates: Partial<SceneObject>) => void;
  onAddSceneObject: (obj: Omit<SceneObject, 'id'>) => void;
  onUpdateConfig: (type: 'render' | 'compositing', updates: any) => void;
  onRunAction: (action: string) => void;
  onSendVisualFeedback?: (imageData: string) => void;
  nodes: NeuralNode[];
  edges: NeuralEdge[];
  onNeuralUpdate: (payload: { nodes?: NeuralNode[], edges?: NeuralEdge[] }) => void;
  variableData?: Record<string, any>;
  engineLogs: EngineLog[];
  onImportAsset: (asset: GameAsset) => void;
  onAddAsset?: (asset: GameAsset) => void;
  sculptHistory: SculptPoint[];
  redoStack: any[];
  onSculptTerrain: (p: any) => void;
  onUndoSculpt: () => void;
  onRedoSculpt: () => void;
  onClearSculpt: () => void;
  isFullscreen?: boolean;
}

// Create XR store for VR/AR sessions
// Create XR store for VR/AR sessions
const xrStore = createXRStore();

const ShaderMaterialWrapper: React.FC<{ fragmentShader: string, time: number }> = ({ fragmentShader, time }) => {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.u_time.value = state.clock.elapsedTime;
    }
  });

  const uniforms = useMemo(() => ({
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(viewport.width * 100, viewport.height * 100) },
    u_mainTexture: { value: new THREE.Texture() }
  }), [viewport.width, viewport.height]);

  return (
    <shaderMaterial
      ref={matRef}
      key={fragmentShader}
      vertexShader={`
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
`}
      fragmentShader={fragmentShader}
      uniforms={uniforms}
    />
  );
};

const SyntheticEnvironment: React.FC<{ envName: string }> = ({ envName }) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (envName === 'none') {
      setData(null);
      return;
    }
    fetch(`/src/assets/environments/${envName}.json`)
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error("Failed to load environment for visual feedback:", err));
  }, [envName]);

  if (!data || !data.spatialEntities) return null;

  return (
    <group name="synthetic-environment">
      {data.spatialEntities.map((entity: any) => {
        const { position, orientation } = entity.locatable_META;
        const extent = entity.bounded3D_META?.extent ||
          (entity.bounded2D_META ? { ...entity.bounded2D_META.extent, depth: 0.1 } : { width: 1, height: 1, depth: 1 });
        const offset = entity.bounded3D_META?.offset ||
          (entity.bounded2D_META ? { ...entity.bounded2D_META.offset, z: 0 } : { x: 0, y: 0, z: 0 });

        // Convert Meta orientation to Three.js Euler or Quaternion
        const quaternion = new THREE.Quaternion(orientation.x, orientation.y, orientation.z, orientation.w);

        return (
          <mesh
            key={entity.uuid}
            position={[position.x, position.y, position.z]}
            quaternion={quaternion}
          >
            <boxGeometry args={[extent.width, extent.height, extent.depth]} />
            <meshStandardMaterial
              color="#00f2ff"
              transparent
              opacity={0.15}
              wireframe={false}
              emissive="#00f2ff"
              emissiveIntensity={0.2}
            />
            {/* Offset needs to be handled if we want precision, but center align is often enough for visualization */}
          </mesh>
        );
      })}
    </group>
  );
};

const LiveObject: React.FC<{ obj: SceneObject, isSelected: boolean, onSelect: () => void, isPlaying: boolean }> = ({ obj, isSelected, onSelect, isPlaying }) => {
  const meshRef = useRef<THREE.Group>(null);
  const targetRef = useRef<THREE.Vector3>(new THREE.Vector3(Math.random() * 10 - 5, 0, Math.random() * 10 - 5));
  const triggerActiveRef = useRef(false);

  useFrame((state) => {
    try {
      if (!meshRef.current || !isPlaying) return;

      // Spin behavior
      if (obj.behaviors?.includes('spin')) {
        meshRef.current.rotation.y += 0.01;
      }

      // Float behavior
      if (obj.behaviors?.includes('float')) {
        meshRef.current.position.y = obj.position[1] + Math.sin(state.clock.elapsedTime) * 0.5;
      }

      // Pathfind behavior
      if (obj.behaviors?.includes('pathfind')) {
        const current = meshRef.current.position;
        const target = targetRef.current;
        const dist = current.distanceTo(target);

        if (dist > 0.5) {
          const direction = target.clone().sub(current).normalize();
          const speed = 0.02;
          meshRef.current.position.add(direction.multiplyScalar(speed));
          meshRef.current.lookAt(target);
        } else {
          targetRef.current.set(Math.random() * 20 - 10, obj.position[1], Math.random() * 20 - 10);
        }
      }

      // Reactive behavior
      if (obj.behaviors?.includes('reactive')) {
        const windStrength = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        meshRef.current.rotation.z = windStrength;
        meshRef.current.position.x = obj.position[0] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      }

      // Trigger behavior
      if (obj.behaviors?.includes('trigger')) {
        const pulseScale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
        if (triggerActiveRef.current) {
          meshRef.current.scale.setScalar(pulseScale);
        }
      }
    } catch (e) {
      if (state.clock.elapsedTime < 1) console.error("[R3F] LiveObject loop failure:", e);
    }
  });

  const renderMaterial = () => {
    const mat = obj.material || { baseColor: '#ffffff', metallic: 0, roughness: 0.5, emissive: 0 };
    const preset = mat.shaderPreset || 'none';

    if (preset === 'hologram') {
      return (
        <MeshDistortMaterial
          color={mat.baseColor}
          speed={5}
          distort={0.4}
          radius={1}
          emissive={mat.baseColor}
          emissiveIntensity={2}
          transparent
          opacity={0.6}
        />
      );
    }
    if (preset === 'glass') {
      return (
        <meshPhysicalMaterial
          color={mat.baseColor}
          transmission={1}
          thickness={0.5}
          roughness={mat.roughness}
          metalness={mat.metallic}
          ior={1.5}
          clearcoat={1}
        />
      );
    }
    if (preset === 'neon') {
      return (
        <meshStandardMaterial
          color={mat.baseColor}
          emissive={mat.baseColor}
          emissiveIntensity={10}
        />
      );
    }
    if (preset === 'chrome') {
      return (
        <meshStandardMaterial
          color={mat.baseColor}
          metalness={1}
          roughness={0}
        />
      );
    }

    return (
      <meshStandardMaterial
        color={mat.baseColor}
        metalness={mat.metallic}
        roughness={mat.roughness}
        emissive={mat.baseColor}
        emissiveIntensity={mat.emissive}
      />
    );
  };

  const getGeometry = () => {
    if (obj.modelUrl) {
      return (
        <Suspense fallback={<mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial wireframe color="#00f2ff" opacity={0.3} transparent /></mesh>}>
          <Gltf src={obj.modelUrl} castShadow receiveShadow />
        </Suspense>
      );
    }

    switch (obj.type) {
      case 'prop':
        return (
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            {renderMaterial()}
          </mesh>
        );
      case 'light':
        return (
          <mesh>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial emissive={obj.material?.baseColor || "#ffff00"} emissiveIntensity={5} />
          </mesh>
        );
      default:
        return (
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={obj.material?.baseColor || "#ffffff"} />
          </mesh>
        );
    }
  };

  return (
    <group
      ref={meshRef}
      position={obj.position}
      rotation={obj.rotation.map(r => THREE.MathUtils.degToRad(r)) as [number, number, number]}
      scale={obj.scale}
      onClick={(e) => { e.stopPropagation(); onSelect(); if (obj.behaviors?.includes('trigger')) triggerActiveRef.current = !triggerActiveRef.current; }}
      visible={obj.visible}
    >
      <ErrorBoundary fallback={<mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="red" wireframe /></mesh>}>
        {getGeometry()}
      </ErrorBoundary>
      {isSelected && (
        <>
          <mesh scale={[1.1, 1.1, 1.1]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#00f2ff" wireframe transparent opacity={0.5} />
          </mesh>
          <group>
            <mesh position={[0.8, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.08, 0.2, 8]} />
              <meshBasicMaterial color="#ff4444" />
            </mesh>
            <mesh position={[0, 0.8, 0]}>
              <coneGeometry args={[0.08, 0.2, 8]} />
              <meshBasicMaterial color="#44ff44" />
            </mesh>
            <mesh position={[0, 0, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.08, 0.2, 8]} />
              <meshBasicMaterial color="#4444ff" />
            </mesh>
          </group>
        </>
      )}
    </group>
  );
};

const GameDashboard: React.FC<GameDashboardProps> = ({
  onBuild, buildInfo, assets, physics, worldConfig, sceneObjects, pipelines,
  renderConfig, compositingConfig, simulation, onUpdatePhysics, onUpdateWorld,
  onUpdateSceneObject, onAddSceneObject, onUpdateConfig, onRunAction, onSendVisualFeedback,
  nodes, edges, onNeuralUpdate, variableData = {}, engineLogs,
  onImportAsset, onAddAsset, sculptHistory, redoStack, onSculptTerrain, onUndoSculpt, onRedoSculpt, onClearSculpt,
  isFullscreen = false
}) => {
  const [activeWorkspace, setActiveWorkspace] = useState<'layout' | 'shading' | 'world' | 'data' | 'rendering' | 'pipelines'>('layout');
  const [cameraMode, setCameraMode] = useState<'standard' | 'item'>('standard');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [telemetry, setTelemetry] = useState({ fps: 144, history: Array(30).fill(144) });
  const [localPipelines, setLocalPipelines] = useState(pipelines);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-select first object on mount if available
  useEffect(() => {
    if (sceneObjects.length > 0 && !selectedObjectId) {
      setSelectedObjectId(sceneObjects[0].id);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => {
        const next = simulation.status === 'playing' ? 140 + Math.random() * 8 : 144;
        return { fps: next, history: [...prev.history.slice(1), next] };
      });
    }, 300);
    return () => clearInterval(interval);
  }, [simulation.status]);

  const handleImport = (asset: GameAsset) => {
    onImportAsset(asset);
    if (asset.type === 'mesh') {
      onAddSceneObject({
        name: asset.name,
        type: 'prop',
        position: [0, 5, 0],
        rotation: [0, 0, 0],
        scale: [2, 2, 2],
        visible: true,
        modelUrl: asset.url,
        material: {
          baseColor: asset.name.includes('Geometry') ? '#00f2ff' : '#ffffff',
          metallic: 0.8,
          roughness: 0.2,
          emissive: 0.05
        }
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAddAsset) {
      // Create local URL for preview
      const url = URL.createObjectURL(file);

      // Save to local filesystem via bridge
      const { saveAssetToLocal } = await import('../services/bridgeService');
      const result = await saveAssetToLocal(file.name, file);

      if (result.success) {
        console.log('[BRIDGE] Asset saved locally:', result.output);
      } else {
        console.warn('[BRIDGE] Failed to save locally, using blob URL:', result.error);
      }

      const newAsset: GameAsset = {
        id: `imported-${Date.now()}`,
        name: file.name,
        type: 'mesh',
        format: file.name.split('.').pop() || 'glb',
        size: file.size,
        ownerId: 'local-user',
        isPublic: false,
        downloads: 0,
        likes: 0,
        status: result.success ? 'optimized' : 'raw',
        createdAt: Date.now(),
        aiGenerated: false,
        url: url
      };
      onAddAsset(newAsset);
    }
  };

  const handleRunTest = () => {
    onRunAction('RUN_TEST_SUITE');
    onBuild('Stress test: Verify binary-to-spatial sync.');
  };

  /**
   * Performs a high-entropy randomization of the selected entity properties,
   * simulating a "Matrix Chaos" event.
   */
  const handleRandomize = () => {
    if (!selectedObjectId) return;
    const obj = sceneObjects.find(o => o.id === selectedObjectId);
    if (!obj) return;

    onUpdateSceneObject(obj.id, {
      scale: [0.5 + Math.random() * 2, 0.5 + Math.random() * 2, 0.5 + Math.random() * 2] as any,
      rotation: [Math.random() * 360, Math.random() * 360, Math.random() * 360] as any,
      position: [obj.position[0] + (Math.random() - 0.5), obj.position[1], obj.position[2] + (Math.random() - 0.5)]
    });
    onRunAction('RANDOMIZE_EFFECT');
  };

  const handleMaterialUpdate = (key: string, value: any) => {
    if (!selectedObjectId) return;
    const obj = sceneObjects.find(o => o.id === selectedObjectId);
    if (!obj) return;
    onUpdateSceneObject(obj.id, {
      material: { ...obj.material, [key]: value } as any
    });
  };

  /**
   * Executes AI-driven spatial adjustments.
   */
  const handleAiAction = (action: string) => {
    if (!selectedObjectId) return;
    onRunAction(`AI_EXEC_${action}`);

    if (action === 'GROUND') {
      const obj = sceneObjects.find(o => o.id === selectedObjectId);
      if (obj) {
        // Calculate ground Y based on object scale (assuming origin at center)
        const groundY = (obj.scale[1] / 2);
        onUpdateSceneObject(selectedObjectId, {
          position: [obj.position[0], groundY, obj.position[2]]
        });
      }
    }
  };

  const handleAddPipeline = () => {
    const newPipeline: PipelineConfig = {
      id: `p-${Date.now()}`,
      name: `Neural_Node_${localPipelines.length + 1}`,
      provider: 'Local',
      status: 'online',
      endpoints: ['/local/compute'],
      latency: 0
    };
    setLocalPipelines(prev => [...prev, newPipeline]);
  };

  const renderSidebarContent = () => {
    switch (activeWorkspace) {
      case 'layout':
      case 'shading':
        return (
          <div className="h-full flex flex-col overflow-y-auto no-scrollbar p-6">
            <h3 className="text-xl font-black uppercase tracking-[0.3em] text-cyan-50 border-b border-white/5 pb-8 mb-8">Matrix Inspector</h3>

            {/* Inspector Controls */}
            {selectedObjectId ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                <div className="p-8 bg-[#050a15] rounded-[2rem] border border-cyan-500/10">
                  <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest block mb-2">Selected Entity</span>
                  <span className="text-lg font-black text-cyan-50 uppercase tracking-widest">{sceneObjects.find(o => o.id === selectedObjectId)?.name}</span>
                </div>
                {['position', 'rotation', 'scale'].map(prop => (
                  <div key={prop} className="space-y-4">
                    <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest px-2">{prop} Modulation</span>
                    <div className="grid grid-cols-3 gap-3">
                      {[0, 1, 2].map(i => (
                        <input
                          key={i} type="number" step="0.1"
                          value={((sceneObjects.find(o => o.id === selectedObjectId) as any)[prop as keyof SceneObject] as number[])[i]}
                          onChange={(e) => {
                            const obj = sceneObjects.find(o => o.id === selectedObjectId);
                            if (!obj) return;
                            const next = [...(obj as any)[prop]];
                            next[i] = parseFloat(e.target.value) || 0;
                            onUpdateSceneObject(obj.id, { [prop]: next as any });
                          }}
                          className="w-full bg-[#050a15] border border-cyan-900/40 rounded-xl p-3 text-center text-xs font-mono text-cyan-400 outline-none focus:border-cyan-500"
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Material Editor */}
                <div className="space-y-4 pt-6 border-t border-cyan-900/30">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest px-2">Material Synthesis</span>
                    <button onClick={() => handleMaterialUpdate('baseColor', '#' + Math.floor(Math.random() * 16777215).toString(16))} className="text-[8px] bg-cyan-900/40 hover:bg-cyan-500 hover:text-white px-2 py-1 rounded transition-all uppercase">RND Color</button>
                  </div>
                  <div className="space-y-4 bg-[#0a1222]/50 p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center space-x-4">
                      <input type="color" value={sceneObjects.find(o => o.id === selectedObjectId)?.material?.baseColor || '#ffffff'} onChange={(e) => handleMaterialUpdate('baseColor', e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-2 border-white/10" />
                      <div className="flex-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Shader Preset</label>
                        <select
                          value={sceneObjects.find(o => o.id === selectedObjectId)?.material?.shaderPreset || 'none'}
                          onChange={(e) => handleMaterialUpdate('shaderPreset', e.target.value)}
                          className="w-full bg-[#050a15] border border-cyan-900/40 rounded-lg p-2 text-[10px] text-cyan-400 outline-none"
                        >
                          <option value="none">Standard PBR</option>
                          <option value="glass">💎 Glass (Physical)</option>
                          <option value="chrome">💿 Chrome (Mirror)</option>
                          <option value="hologram">👻 Hologram (Distort)</option>
                          <option value="neon">💡 Neon (Emissive)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex justify-between"><span className="text-[8px] uppercase text-slate-500">Metallic</span><span className="text-[8px] text-cyan-400">{(sceneObjects.find(o => o.id === selectedObjectId)?.material?.metallic || 0).toFixed(1)}</span></div>
                        <input type="range" min="0" max="1" step="0.1" value={sceneObjects.find(o => o.id === selectedObjectId)?.material?.metallic || 0} onChange={(e) => handleMaterialUpdate('metallic', parseFloat(e.target.value))} className="w-full h-1 accent-cyan-500" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between"><span className="text-[8px] uppercase text-slate-500">Roughness</span><span className="text-[8px] text-emerald-400">{(sceneObjects.find(o => o.id === selectedObjectId)?.material?.roughness || 0.5).toFixed(1)}</span></div>
                        <input type="range" min="0" max="1" step="0.1" value={sceneObjects.find(o => o.id === selectedObjectId)?.material?.roughness || 0.5} onChange={(e) => handleMaterialUpdate('roughness', parseFloat(e.target.value))} className="w-full h-1 accent-emerald-500" />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <div className="flex justify-between"><span className="text-[8px] uppercase text-slate-500">Emissive Intensity</span><span className="text-[8px] text-orange-400">{(sceneObjects.find(o => o.id === selectedObjectId)?.material?.emissive || 0).toFixed(1)}</span></div>
                        <input type="range" min="0" max="10" step="0.5" value={sceneObjects.find(o => o.id === selectedObjectId)?.material?.emissive || 0} onChange={(e) => handleMaterialUpdate('emissive', parseFloat(e.target.value))} className="w-full h-1 accent-orange-500" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Hot-Functions */}
                <div className="space-y-4 pt-4">
                  <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest px-2">Neural Actions</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleRandomize} className="py-3 bg-cyan-900/30 hover:bg-cyan-600/30 border border-cyan-500/30 rounded-xl text-[9px] font-black uppercase text-cyan-400 transition-all flex items-center justify-center gap-2 group">
                      <span className="group-hover:scale-110 transition-transform">🎲</span> Chaos
                    </button>
                    <button onClick={() => handleAiAction('GROUND')} className="py-3 bg-emerald-900/30 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-xl text-[9px] font-black uppercase text-emerald-400 transition-all flex items-center justify-center gap-2 group">
                      <span className="group-hover:scale-110 transition-transform">⬇️</span> Ground
                    </button>
                    <button onClick={() => setIsAnnotating(true)} className="col-span-2 py-3 bg-purple-900/30 hover:bg-purple-600/30 border border-purple-500/30 rounded-xl text-[9px] font-black uppercase text-purple-400 transition-all flex items-center justify-center gap-2 group">
                      <span className="group-hover:scale-110 transition-transform">✏️</span> Annotate / Sketch
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 opacity-40 text-center space-y-6 border-2 border-dashed border-white/10 rounded-[3rem] bg-white/5">
                <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center animate-pulse">
                  <svg className="w-8 h-8 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                </div>
                <div>
                  <h5 className="text-[12px] font-black uppercase tracking-[0.4em] text-white">Ghost Select Active</h5>
                  <p className="text-[9px] text-slate-500 mt-2">Target an entity in the viewport or Hierarchy to synthesize.</p>
                </div>
              </div>
            )}

            {/* Layout Hierarchy / Entity List */}
            <div className="mt-8 pt-8 border-t border-cyan-900/40">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400 px-2">Scene Hierarchy</h4>
                <span className="text-[9px] text-slate-600 font-mono">{sceneObjects.length} Entities</span>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto no-scrollbar">
                {sceneObjects.map(obj => (
                  <div
                    key={obj.id}
                    onClick={() => setSelectedObjectId(obj.id)}
                    className={`p-3 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center justify-between group ${selectedObjectId === obj.id ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="opacity-40">{obj.type === 'npc' ? '👤' : obj.type === 'light' ? '💡' : '📦'}</span>
                      {obj.name}
                    </div>
                    {selectedObjectId === obj.id && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-cyan-900/40">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Asset Registry</h4>
                <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-cyan-500/10 rounded-lg text-cyan-400 transition-all" title="Import Local Model (.glb, .gltf)"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".glb,.gltf" />
              </div>
              <div className="space-y-3">
                {assets.map(asset => (
                  <div key={asset.id} className="p-4 bg-cyan-950/20 border border-cyan-500/10 rounded-2xl group hover:border-cyan-500/40 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[11px] font-bold text-cyan-50 truncate w-3/4">{asset.name}</span>
                      <span className="text-[8px] bg-cyan-950 px-1.5 py-0.5 rounded text-cyan-600 font-black uppercase">{asset.type}</span>
                    </div>
                    {asset.url && <div className="mb-2 text-[8px] text-emerald-500 font-black uppercase tracking-tighter flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>Local Source Ready</div>}
                    <button onClick={() => handleImport(asset)} className="w-full py-2 bg-cyan-600/10 hover:bg-cyan-600 text-cyan-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Inject</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'world':
        return (
          <div className="p-6 space-y-8 overflow-y-auto no-scrollbar h-full">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400 border-b border-white/5 pb-2">Atmosphere & Time</h4>
            <div className="space-y-6">
              <div className="p-4 bg-[#0a1222]/50 border border-white/5 rounded-2xl space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between"><span className="text-[9px] font-black uppercase text-slate-500">Local Time</span><span className="text-[10px] font-mono text-cyan-400">{((worldConfig.timeOfDay || 12)).toFixed(1)}h</span></div>
                  <input type="range" min="0" max="24" step="0.5" value={worldConfig.timeOfDay || 12} onChange={(e) => onUpdateWorld({ timeOfDay: parseFloat(e.target.value) })} className="w-full h-1 accent-cyan-500" />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-slate-500 block mb-2">Atmospheric Injector</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'cyberpunk', label: '🌆 Cyberpunk', color: '#ff00ff', density: 0.8 },
                      { id: 'golden', label: '☀️ Golden Hour', color: '#ffaa00', density: 0.2 },
                      { id: 'space', label: '🌌 Deep Space', color: '#050a15', density: 0.1 },
                      { id: 'toxic', label: '🤢 Toxic Fog', color: '#00ff00', density: 1.5 }
                    ].map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => onUpdateWorld({
                          atmosphereColor: preset.color,
                          atmosphereDensity: preset.density,
                          biome: preset.id === 'cyberpunk' ? 'cyber' : worldConfig.biome
                        })}
                        className="py-2 bg-white/5 hover:bg-cyan-500/20 border border-white/10 rounded-lg text-[9px] font-black uppercase text-slate-300 transition-all"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-slate-500 block mb-2">Terrain Biome</label>
                <select value={worldConfig.biome} onChange={(e) => onUpdateWorld({ biome: e.target.value as any })} className="w-full bg-[#050a15] border border-cyan-900/40 rounded-xl p-3 text-xs text-cyan-400 outline-none">
                  <option value="temperate">🌲 Temperate Forest</option>
                  <option value="arid">🏜️ Arid Desert</option>
                  <option value="arctic">❄️ Arctic Tundra</option>
                  <option value="volcanic">🌋 Volcanic</option>
                  <option value="cyber">🌆 Cyberpunk</option>
                  <option value="urban">🏙️ Urban</option>
                </select>
              </div>
            </div>

            <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400 border-b border-white/5 pb-2 pt-4">Procedural DNA</h4>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input type="number" value={worldConfig.seed} onChange={(e) => onUpdateWorld({ seed: parseInt(e.target.value) || 0 })} className="flex-1 bg-[#050a15] border border-cyan-900/40 rounded-xl p-3 text-center text-xs font-mono text-cyan-400 outline-none focus:border-cyan-500" />
                <button onClick={() => onUpdateWorld({ seed: Math.floor(Math.random() * 999999) })} className="px-4 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-400 hover:text-white rounded-xl text-[9px] font-black uppercase transition-all">RND Seed</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] uppercase text-slate-500 mb-1 block">Complexity</label>
                  <input type="range" min="0.1" max="1" step="0.1" value={worldConfig.terrainScale} onChange={(e) => onUpdateWorld({ terrainScale: parseFloat(e.target.value) })} className="w-full accent-cyan-500" />
                </div>
                <div>
                  <label className="text-[8px] uppercase text-slate-500 mb-1 block">Vegetation</label>
                  <input type="range" min="0" max="1" step="0.05" value={worldConfig.vegetationDensity} onChange={(e) => onUpdateWorld({ vegetationDensity: parseFloat(e.target.value) })} className="w-full accent-emerald-500" />
                </div>
              </div>
            </div>

            <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400 border-b border-white/5 pb-2 pt-4">Physics Console</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase text-slate-500">Gravity Strength</span>
                <input type="number" value={physics.gravity} onChange={(e) => onUpdatePhysics({ gravity: parseFloat(e.target.value) })} className="w-20 bg-[#050a15] border border-cyan-900/40 rounded p-1 text-center text-[10px] font-mono text-cyan-400 outline-none" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase text-slate-500">Time dilation</span>
                <input type="range" min="0" max="2" step="0.1" value={physics.timeScale} onChange={(e) => onUpdatePhysics({ timeScale: parseFloat(e.target.value) })} className="w-32 accent-purple-500" />
              </div>
            </div>

            <button
              onClick={() => onRunAction('GENERATE_WORLD')}
              className="w-full py-4 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-cyan-500/20 mt-4"
            >
              🌍 Re-materialize Reality
            </button>
          </div>
        );
      case 'data':
        return (
          <div className="p-6 space-y-6 overflow-y-auto no-scrollbar h-full">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400 border-b border-white/5 pb-2">Telemetry & Metrics</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-cyan-950/20 rounded-2xl border border-cyan-500/10 backdrop-blur-md">
                <div className="text-[8px] uppercase text-slate-500 mb-1 font-black tracking-widest">Entities</div>
                <div className="text-2xl font-black text-cyan-50">{sceneObjects.length}</div>
              </div>
              <div className="p-4 bg-emerald-950/20 rounded-2xl border border-emerald-500/10 backdrop-blur-md">
                <div className="text-[8px] uppercase text-slate-500 mb-1 font-black tracking-widest">Uptime</div>
                <div className="text-2xl font-black text-emerald-50">{simulation.time.toFixed(1)}s</div>
              </div>
            </div>

            {/* Live activity graph (simulated) */}
            <div className="p-4 bg-[#050a15] rounded-2xl border border-white/5 h-32 relative overflow-hidden group">
              <div className="flex justify-between items-start relative z-10">
                <span className="text-[8px] font-black text-cyan-500 uppercase">Neural Activity (Hz)</span>
                <span className="text-[10px] font-mono text-cyan-50 italic">STABLE</span>
              </div>
              <div className="absolute inset-0 flex items-end opacity-40 group-hover:opacity-60 transition-opacity">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-cyan-500 mx-0.5 rounded-t-sm animate-pulse"
                    style={{
                      height: `${30 + Math.sin(simulation.time + i) * 20}%`,
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '2s'
                    }}
                  />
                ))}
              </div>
            </div>

            <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400 border-b border-white/5 pb-2 pt-4">Entity Inspector</h4>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Search Entities..."
                className="w-full bg-[#050a15] border border-cyan-900/40 rounded-xl p-3 text-[10px] text-cyan-400 outline-none focus:border-cyan-50"
              />
              <div className="max-h-60 overflow-y-auto no-scrollbar space-y-1">
                {sceneObjects.map(obj => (
                  <button
                    key={obj.id}
                    onClick={() => setSelectedObjectId(obj.id)}
                    className={`w-full flex justify-between items-center p-3 rounded-xl transition-all ${selectedObjectId === obj.id ? 'bg-cyan-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                  >
                    <span className="text-[10px] font-black uppercase truncate">{obj.name}</span>
                    <span className="text-[8px] opacity-60 font-mono">[{obj.type}]</span>
                  </button>
                ))}
              </div>
            </div>

            <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400 border-b border-white/5 pb-2 pt-4">Neural State Variables</h4>
            <div className="space-y-2">
              {Object.entries(variableData || {}).length === 0 ? (
                <div className="text-[10px] text-slate-500 italic p-4 text-center border border-dashed border-cyan-900/30 rounded-xl">No global variables synced.</div>
              ) : Object.entries(variableData || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between items-center bg-[#0a1222] p-3 rounded-xl border border-cyan-900/30 shadow-sm">
                  <span className="text-[10px] font-mono text-cyan-400 truncate w-1/2">{k}</span>
                  <span className="text-[10px] text-slate-300 truncate w-1/2 text-right">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'rendering':
        return (
          <div className="p-6 space-y-8 overflow-y-auto no-scrollbar h-full">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400 border-b border-white/5 pb-2">Render Engine & Post-FX</h4>
            <div className="space-y-6">
              <div className="p-4 bg-[#0a1222]/50 border border-white/5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-slate-500">Bloom Pulse</span>
                  <input type="range" min="0" max="5" step="0.5" value={compositingConfig.bloom} onChange={(e) => onUpdateConfig('compositing', { bloom: parseFloat(e.target.value) })} className="accent-cyan-500 w-32" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-slate-500">Chromatic Aberration</span>
                  <input type="range" min="0" max="0.01" step="0.001" value={compositingConfig.chromaticAberration} onChange={(e) => onUpdateConfig('compositing', { chromaticAberration: parseFloat(e.target.value) })} className="accent-cyan-500 w-32" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-slate-500">Vignette Intensity</span>
                  <input type="range" min="0" max="1" step="0.1" value={compositingConfig.vignette} onChange={(e) => onUpdateConfig('compositing', { vignette: parseFloat(e.target.value) })} className="accent-cyan-500 w-32" />
                </div>
                <div className="h-px bg-white/5"></div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-slate-500">Retro Scanlines</span>
                  <input type="range" min="0" max="1" step="0.1" value={compositingConfig.scanlines || 0} onChange={(e) => onUpdateConfig('compositing', { scanlines: parseFloat(e.target.value) })} className="accent-cyan-500 w-32" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-slate-500">Film Grain / Noise</span>
                  <input type="range" min="0" max="1" step="0.1" value={compositingConfig.noise || 0} onChange={(e) => onUpdateConfig('compositing', { noise: parseFloat(e.target.value) })} className="accent-cyan-500 w-32" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[9px] font-black uppercase text-slate-500">Global Exposure</label>
                  <button
                    className="w-4 h-4 flex items-center justify-center rounded bg-white/5 text-slate-600 hover:text-cyan-400 transition-colors text-[8px]"
                    onClick={() => neuralRegistry.emit('ui:explain', { id: 'render-exposure', context: 'Controls the overall brightness of the scene, similar to a physical camera lens exposure.' })}
                  >
                    ?
                  </button>
                </div>
                <input type="range" min="0" max="3" step="0.1" value={compositingConfig.exposure} onChange={(e) => onUpdateConfig('compositing', { exposure: parseFloat(e.target.value) })} className="w-full accent-cyan-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-500 block mb-2">Target Output</label>
                  <select value={renderConfig.resolution} onChange={(e) => onUpdateConfig('render', { resolution: e.target.value })} className="w-full bg-[#050a15] border border-cyan-900/40 rounded-xl p-3 text-[10px] text-cyan-400 outline-none">
                    <option value="720p">720p (Performance)</option>
                    <option value="1080p">1080p (Balanced)</option>
                    <option value="4K">4K (Ultra)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-500 block mb-2">Anti-Aliasing</label>
                  <button
                    onClick={() => onUpdateConfig('render', { denoising: !renderConfig.denoising })}
                    className={`w-full py-3 rounded-xl text-[9px] font-black uppercase transition-all ${renderConfig.denoising ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-500'}`}
                  >
                    {renderConfig.denoising ? 'FXAA ACTIVE' : 'FXAA DISABLED'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'pipelines':
        return (
          <div className="p-6 space-y-4 overflow-y-auto no-scrollbar h-full">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400 border-b border-white/5 pb-2">CI/CD Pipelines</h4>
            {localPipelines.map(p => (
              <div key={p.id} className="p-4 bg-[#050a15] border border-cyan-900/30 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-cyan-50">{p.name}</span>
                  <div className={`w-2 h-2 rounded-full ${p.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'}`}></div>
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 uppercase tracking-widest mb-3">
                  <span>{p.provider}</span>
                  <span>{p.latency}ms</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onRunAction(`RUN_PIPELINE_${p.id}`);
                      // Mock status update for feedback
                      setLocalPipelines(prev => prev.map(pi => pi.id === p.id ? { ...pi, status: 'offline' } : pi));
                      setTimeout(() => setLocalPipelines(prev => prev.map(pi => pi.id === p.id ? { ...pi, status: 'online' } : pi)), 2000);
                    }}
                    className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600 hover:text-white text-emerald-500 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    Run
                  </button>
                  <button
                    onClick={() => setLocalPipelines(prev => prev.filter(pi => pi.id !== p.id))}
                    className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600 hover:text-white text-rose-500 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={handleAddPipeline}
              className="w-full p-4 rounded-2xl border border-dashed border-cyan-500/20 text-center text-cyan-600 text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500/5 hover:border-cyan-500/40 transition-all"
            >
              + Add New Pipeline
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`h-full flex flex-col bg-[#050a15] text-white overflow-hidden font-sans transition-all duration-700 ${isFullscreen ? 'fixed inset-0 z-[1000]' : 'border-t border-cyan-900/30'}`}>
      {!isFullscreen && (
        <div className="flex items-center h-14 bg-[#0a1222]/95 backdrop-blur-3xl px-8 border-b border-cyan-900/40 space-x-2 shrink-0 z-50 shadow-xl">
          <div className="flex items-center space-x-4 mr-12">
            <div className={`w-2 h-2 rounded-full ${simulation.status === 'playing' ? 'bg-cyan-500 shadow-[0_0_10px_#00f2ff] animate-pulse' : 'bg-slate-700'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-cyan-100/50">Matrix PRO Runtime</span>
          </div>

          <div className="flex-1 flex items-center space-x-1 h-full">
            {['layout', 'shading', 'world', 'data', 'rendering', 'pipelines'].map((ws) => (
              <button
                key={ws}
                onClick={() => setActiveWorkspace(ws as any)}
                className={`px-8 h-full text-[9px] font-black uppercase transition-all flex items-center border-b-2 tracking-widest ${activeWorkspace === ws ? 'text-cyan-400 border-cyan-500 bg-cyan-600/5' : 'text-slate-600 hover:text-cyan-400 border-transparent'
                  }`}
              >
                {ws}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <button onClick={handleRunTest} className="px-6 py-2 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all">Run Logic Tests</button>
            <button onClick={() => setCameraMode(prev => prev === 'standard' ? 'item' : 'standard')} className={`px-4 py-2 ${cameraMode === 'item' ? 'bg-amber-600 text-white' : 'bg-cyan-900/20 text-cyan-400'} border border-cyan-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-cyan-600 hover:text-white transition-all`}>{cameraMode === 'standard' ? 'Item Cam' : 'Std Cam'}</button>
            <button onClick={() => onRunAction('PRESENT_BUILD')} className="p-2 bg-cyan-900/20 border border-cyan-500/20 rounded-xl text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all" title="Presentation Mode"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg></button>
            <button onClick={() => { setIsCapturing(true); setTimeout(() => { onSendVisualFeedback?.(`Runtime Snapshot: Entities = ${sceneObjects.length} FPS = ${telemetry.fps.toFixed(0)} `); setIsCapturing(false); }, 600); }} className="bg-cyan-600 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-[0_0_15px_rgba(0,242,255,0.3)]">{isCapturing ? 'TRANSMITTING' : 'DIRECTOR SNAPSHOT'}</button>
          </div>
        </div>
      )}

      {/* Main Body Area: Canvas + Sidebar Row */}
      <div className="flex-1 flex overflow-hidden relative">
        <div
          className="flex-1 relative bg-[#000000] overflow-hidden"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            try {
              const data = JSON.parse(e.dataTransfer.getData('application/json'));
              if (data.type === 'rsmv-model') {
                onAddSceneObject({
                  name: data.name,
                  type: 'prop',
                  position: [0, 0, 0], // Place at origin for now
                  rotation: [0, 0, 0],
                  scale: [1, 1, 1],
                  visible: true,
                  modelUrl: data.modelUrl
                });
              }
            } catch (err) {
              console.error("Failed to process drop:", err);
            }
          }}
        >
          {isFullscreen && (
            <div className="absolute top-10 left-10 z-50 flex items-center space-x-6">
              <button onClick={() => onRunAction('EXIT_PRESENTATION')} className="p-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl text-white hover:bg-cyan-600 transition-all group">
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400">Presentation Active</span>
                <span className="text-2xl font-black text-white uppercase tracking-widest drop-shadow-lg">Runtime: v{buildInfo.lastBuild ? 'Final' : 'Live'}</span>
              </div>
            </div>
          )}

          <Suspense fallback={<div className="flex items-center justify-center h-full text-cyan-500 animate-pulse uppercase text-xs font-black tracking-widest">Waking Runtime Engine...</div>}>
            {!isFullscreen && (
              <div className="absolute top-4 left-4 z-50 flex gap-2">
                <button onClick={() => xrStore.enterVR()} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20 border border-purple-400/30">Enter VR</button>
                <button onClick={() => xrStore.enterAR()} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-cyan-500/20 border border-cyan-400/30">Enter AR</button>
              </div>
            )}
            <Canvas
              shadows
              gl={{
                antialias: true,
                preserveDrawingBuffer: true,
                powerPreference: "high-performance"
              }}
              dpr={[1, 2]}
            >
              <XR store={xrStore}>
                <PerspectiveCamera
                  makeDefault
                  position={cameraMode === 'item' ? [3, 2, 3] : [15, 15, 15]}
                  fov={cameraMode === 'item' ? 35 : 45}
                />
                <OrbitControls makeDefault enabled={!isAnnotating} />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <Sky
                  sunPosition={[
                    100 * Math.cos((((worldConfig.timeOfDay || 12) - 6) / 24) * Math.PI * 2),
                    100 * Math.sin((((worldConfig.timeOfDay || 12) - 6) / 24) * Math.PI * 2),
                    100
                  ]}
                  turbidity={10 * (worldConfig.atmosphereDensity || 0.1)}
                  rayleigh={3 * (worldConfig.atmosphereDensity || 0.1)}
                  mieCoefficient={0.005}
                  mieDirectionalG={0.8}
                />
                <Environment preset={(worldConfig.timeOfDay || 12) > 18 || (worldConfig.timeOfDay || 12) < 6 ? "night" : "sunset"} />
                <ambientLight intensity={((worldConfig.timeOfDay || 12) > 18 || (worldConfig.timeOfDay || 12) < 6) ? 0.2 : 0.5} color={worldConfig.atmosphereColor || "#ffffff"} />
                <pointLight
                  position={[10, 20, 10]}
                  intensity={((worldConfig.timeOfDay || 12) > 18 || (worldConfig.timeOfDay || 12) < 6) ? 0.5 : 2}
                  color={worldConfig.atmosphereColor || "#ffffff"}
                  castShadow
                />

                <ViewportManager />
                <SyntheticEnvironment envName={worldConfig.syntheticEnvironment || 'none'} />

                {sceneObjects.map(obj => (
                  <LiveObject
                    key={obj.id}
                    obj={obj}
                    isSelected={selectedObjectId === obj.id}
                    onSelect={() => setSelectedObjectId(obj.id)}
                    isPlaying={simulation.status === 'playing' || isFullscreen}
                  />
                ))}

                {!isFullscreen && <Grid renderOrder={-1} position={[0, -0.01, 0]} infiniteGrid cellSize={1} sectionSize={5} sectionColor="#00f2ff" cellColor="#0a1222" fadeDistance={50} />}

                {/* Procedural Ground Plane with Global Shader */}
                <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
                  <planeGeometry args={[200, 200]} />
                  {worldConfig.globalShader ? (
                    <ShaderMaterialWrapper
                      fragmentShader={worldConfig.globalShader}
                      time={simulation.time}
                    />
                  ) : (
                    <meshStandardMaterial color="#0a1222" roughness={1} metalness={0.1} />
                  )}
                </mesh>

                {/* Post-Processing Effects Layer */}
                <SafeEffectComposer compositingConfig={compositingConfig} />
              </XR>
            </Canvas>
          </Suspense>

          <div className={`absolute bottom-6 right-6 flex flex-col space-y-4 z-40 transition-opacity duration-500 ${isFullscreen ? 'opacity-30' : 'opacity-100'}`}>
            {/* Bridge Connection Manager - Compact version for Dashboard overlay */}
            <div className="bg-[#0a1222]/80 backdrop-blur-2xl p-4 rounded-2xl border border-cyan-500/20 shadow-2xl min-w-[300px] flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${ws?.readyState === 1 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 animate-pulse'}`}></div>
                <span className="text-[10px] font-black uppercase text-cyan-600 tracking-widest">Neural Link</span>
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase">{ws?.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'}</span>
            </div>

            <div className="bg-[#0a1222]/80 backdrop-blur-2xl p-6 rounded-3xl border border-cyan-500/20 shadow-2xl min-w-[300px] pointer-events-auto">
              <div className="flex justify-between items-end mb-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase text-cyan-600 tracking-widest mb-1">PRO TELEMETRY</span>
                  <span className="text-3xl font-black text-cyan-50 tabular-nums">{telemetry.fps.toFixed(0)} <span className="text-xs opacity-30 tracking-normal font-normal">FPS</span></span>
                </div>
                <div className="h-8 w-24 flex items-end space-x-1">
                  {telemetry.history.map((h, i) => (
                    <div key={i} className="flex-1 bg-cyan-500/30 rounded-t-sm" style={{ height: `${(h / 144) * 100}% ` }}></div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                <div className="flex flex-col"><span className="opacity-40 mb-0.5 text-[8px]">Pipeline</span><span className="text-emerald-400">WebGPU/LIVE</span></div>
                <div className="flex flex-col text-right"><span className="opacity-40 mb-0.5 text-[8px]">Memory</span><span className="text-cyan-400">0.4 GB</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Precision Sidebar - Fixed width, high density, properly contained */}
        {!isFullscreen && (
          <div className="w-[380px] bg-[#0a1222] border-l border-cyan-900/40 shrink-0 flex flex-col h-full overflow-hidden shadow-2xl nexus-glass">
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {renderSidebarContent()}
            </div>
          </div>
        )}
      </div>

      <AnnotationOverlay
        isActive={isAnnotating}
        onClose={() => setIsAnnotating(false)}
        onProcess={(img, mode) => {
          onSendVisualFeedback?.(img);
          onRunAction(`ANNOTATION_PROCESSED_${mode.toUpperCase()} `);

          if (mode === '3d' && selectedObjectId) {
            // Simulate AI remodeling feedback
            console.log('[FORGE] Triggering AI 3D Reconstruction...');
            // In a real scenario, this would wait for a worker response.
            // For now, we update the status or object placeholder.
            onUpdateSceneObject(selectedObjectId, {
              name: `Remodeled_${selectedObjectId}`,
              type: 'prop'
            });
          }
        }}
      />
    </div>
  );
};

export default GameDashboard;
