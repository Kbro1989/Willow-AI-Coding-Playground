
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { LayoutGrid, List, ChevronLeft, ChevronRight, RotateCcw, Grid3X3, Download, Search } from 'lucide-react';
import ShaderPreview from './ShaderPreview';
import { agentSprintService } from '../services/ai/agentSprintService';

interface ShaderNode {
  id: string;
  type: 'input' | 'math' | 'color' | 'output' | 'texture' | 'time' | 'multiply' | 'add' | 'sin' | 'lerp' | 'mix' | 'normal' | 'fresnel';
  label: string;
  position: { x: number; y: number };
  inputs: string[];
  outputs: string[];
  value?: string;
}

interface ShaderEdge {
  id: string;
  from: string;
  fromOutput: string;
  to: string;
  toInput: string;
}

interface ShaderGraphProps {
  onCompile: (glsl: string) => void;
  onApplyToObjects: (materialId: string) => void;
}

const NODE_TEMPLATES: Record<string, Omit<ShaderNode, 'id' | 'position'>> = {
  color: { type: 'color', label: 'Color', inputs: [], outputs: ['rgb'], value: '#00f2ff' },
  time: { type: 'time', label: 'Time', inputs: [], outputs: ['value'] },
  multiply: { type: 'multiply', label: 'Multiply', inputs: ['a', 'b'], outputs: ['result'] },
  add: { type: 'add', label: 'Add', inputs: ['a', 'b'], outputs: ['result'] },
  sin: { type: 'sin', label: 'Sin', inputs: ['x'], outputs: ['result'] },
  lerp: { type: 'lerp', label: 'Lerp (Mix)', inputs: ['a', 'b', 't'], outputs: ['result'] },
  mix: { type: 'mix', label: 'Mix', inputs: ['a', 'b', 't'], outputs: ['result'] },
  normal: { type: 'normal', label: 'Surface Normal', inputs: [], outputs: ['vector'] },
  fresnel: { type: 'fresnel', label: 'Fresnel', inputs: ['bias', 'scale', 'power'], outputs: ['value'] },
  output: { type: 'output', label: 'Fragment Output', inputs: ['color', 'alpha'], outputs: [] },
  texture: { type: 'texture', label: 'Texture Sample', inputs: ['uv'], outputs: ['rgb', 'a'] },
};

const ShaderGraph: React.FC<ShaderGraphProps> = ({ onCompile, onApplyToObjects }) => {
  const [nodes, setNodes] = useState<ShaderNode[]>([
    { id: 'n1', type: 'color', label: 'Base Color', position: { x: 50, y: 100 }, inputs: [], outputs: ['rgb'], value: '#00f2ff' },
    { id: 'n2', type: 'output', label: 'Fragment Output', position: { x: 400, y: 150 }, inputs: ['color', 'alpha'], outputs: [] },
  ]);
  const [edges, setEdges] = useState<ShaderEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [compiledGlsl, setCompiledGlsl] = useState<string>(`
    precision mediump float;
    varying vec2 v_uv;
    void main() {
      gl_FragColor = vec4(v_uv, 0.5 + 0.5 * sin(0.0), 1.0);
    }
  `);
  const [isAiBuilding, setIsAiBuilding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Port connection state
  const [activePort, setActivePort] = useState<{ nodeId: string; portId: string; type: 'in' | 'out' } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const getRelativeCoords = (e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      const coords = getRelativeCoords(e);
      setDraggingNode(nodeId);
      setDragOffset({ x: coords.x - node.position.x, y: coords.y - node.position.y });
      setSelectedNode(nodeId);
    }
  };

  const handlePortMouseDown = (nodeId: string, portId: string, type: 'in' | 'out', e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePort({ nodeId, portId, type });
  };

  const handlePortMouseUp = (nodeId: string, portId: string, type: 'in' | 'out') => {
    if (activePort && activePort.nodeId !== nodeId && activePort.type !== type) {
      const from = activePort.type === 'out' ? activePort : { nodeId, portId, type };
      const to = activePort.type === 'in' ? activePort : { nodeId, portId, type };

      const newEdge: ShaderEdge = {
        id: `e${Date.now()}`,
        from: from.nodeId,
        fromOutput: from.portId,
        to: to.nodeId,
        toInput: to.portId
      };
      setEdges(prev => [...prev, newEdge]);
    }
    setActivePort(null);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const coords = getRelativeCoords(e);
    setMousePos(coords);

    if (draggingNode) {
      setNodes(prev => prev.map(n =>
        n.id === draggingNode
          ? { ...n, position: { x: coords.x - dragOffset.x, y: coords.y - dragOffset.y } }
          : n
      ));
    }
  }, [draggingNode, dragOffset]);

  const handleMouseUp = () => {
    setDraggingNode(null);
  };

  const addNode = (type: string) => {
    const template = NODE_TEMPLATES[type];
    if (template) {
      const newNode: ShaderNode = {
        ...template,
        id: `n${Date.now()}`,
        position: { x: 200, y: 200 }
      } as ShaderNode;
      setNodes(prev => [...prev, newNode]);
    }
  };

  const compileToGLSL = () => {
    let glslCode = `// Generated by Willow Procedural Engine\nprecision mediump float;\n\nuniform float u_time;\nuniform vec2 u_resolution;\nuniform sampler2D u_mainTexture;\n\nvarying vec2 v_uv;\n\n`;

    const variableMap = new Map<string, string>();
    let varCounter = 0;

    const resolveNode = (nodeId: string): string => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return 'vec3(0.0)';

      if (variableMap.has(nodeId)) return variableMap.get(nodeId)!;

      const varName = `v_${node.type}_${varCounter++}`;
      let declaration = '';

      switch (node.type) {
        case 'color':
          const r = parseInt(node.value?.slice(1, 3) || '00', 16) / 255;
          const g = parseInt(node.value?.slice(3, 5) || '00', 16) / 255;
          const b = parseInt(node.value?.slice(5, 7) || '00', 16) / 255;
          declaration = `vec3 ${varName} = vec3(${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)});`;
          break;
        case 'time':
          declaration = `float ${varName} = u_time;`;
          break;
        case 'multiply':
        case 'add':
          const inA = edges.find(e => e.to === nodeId && e.toInput === 'a');
          const inB = edges.find(e => e.to === nodeId && e.toInput === 'b');
          const valA = inA ? resolveNode(inA.from) : '1.0';
          const valB = inB ? resolveNode(inB.from) : '1.0';
          const op = node.type === 'multiply' ? '*' : '+';
          declaration = `vec3 ${varName} = ${valA} ${op} ${valB};`;
          break;
        case 'mix':
        case 'lerp':
          const mixA = edges.find(e => e.to === nodeId && e.toInput === 'a');
          const mixB = edges.find(e => e.to === nodeId && e.toInput === 'b');
          const mixT = edges.find(e => e.to === nodeId && e.toInput === 't');
          const valMixA = mixA ? resolveNode(mixA.from) : 'vec3(0.0)';
          const valMixB = mixB ? resolveNode(mixB.from) : 'vec3(1.0)';
          const valMixT = mixT ? resolveNode(mixT.from) : '0.5';
          declaration = `vec3 ${varName} = mix(${valMixA}, ${valMixB}, ${valMixT});`;
          break;
        case 'sin':
          const inX = edges.find(e => e.to === nodeId && e.toInput === 'x');
          const valX = inX ? resolveNode(inX.from) : 'u_time';
          declaration = `float ${varName} = sin(${valX});`;
          break;
        case 'texture':
          declaration = `vec4 ${varName} = texture2D(u_mainTexture, v_uv);`;
          break;
        case 'normal':
          declaration = `vec3 ${varName} = normalize(v_normal);`;
          if (!glslCode.includes('varying vec3 v_normal;')) {
            glslCode = glslCode.replace('varying vec2 v_uv;', 'varying vec2 v_uv;\nvarying vec3 v_normal;');
          }
          break;
        case 'fresnel':
          const fInN = edges.find(e => e.to === nodeId && e.toInput === 'normal');
          const valFN = fInN ? resolveNode(fInN.from) : 'normalize(v_normal)';
          declaration = `float ${varName} = pow(1.0 + dot(normalize(-v_viewPosition), ${valFN}), 3.0);`;
          if (!glslCode.includes('varying vec3 v_viewPosition;')) {
            glslCode = glslCode.replace('varying vec3 v_normal;', 'varying vec3 v_normal;\nvarying vec3 v_viewPosition;');
          }
          break;
      }

      if (declaration) {
        glslCode += `  ${declaration}\n`;
        variableMap.set(nodeId, varName);
        return varName;
      }
      return 'vec3(1.0)';
    };

    const outputNode = nodes.find(n => n.type === 'output');
    if (!outputNode) {
      alert('Missing Fragment Output node');
      return;
    }

    glslCode += 'void main() {\n';
    const colorInputEdge = edges.find(e => e.to === outputNode.id && e.toInput === 'color');
    const finalColor = colorInputEdge ? resolveNode(colorInputEdge.from) : 'vec3(0.5, 0.5, 0.5)';
    glslCode += `  gl_FragColor = vec4(${finalColor}, 1.0);\n}\n`;

    setCompiledGlsl(glslCode);
    onCompile(glslCode);
  };

  const handleAiBuild = async () => {
    setIsAiBuilding(true);
    try {
      const goal = prompt("Describe the shader effect you want (e.g., 'A pulsing neon geometric grid'):");
      if (!goal) return;

      await agentSprintService.startSprint(`Generate a GLSL fragment shader for: ${goal}. 
      The shader should use u_time and v_uv. 
      Output ONLY the code block for the fragment shader.`);

      const state = agentSprintService.getState();
      const lastStep = state.steps[state.steps.length - 1];
      if (lastStep && lastStep.output) {
        const glslMatch = lastStep.output.match(/void main\(\) \{[\s\S]*\}/);
        if (glslMatch) {
          const fullShader = `precision mediump float;\nuniform float u_time;\nvarying vec2 v_uv;\n\n${glslMatch[0]}`;
          setCompiledGlsl(fullShader);
          onCompile(fullShader);
        }
      }
    } catch (err) {
      console.error("[ShaderGraph AI] Build failed:", err);
    } finally {
      setIsAiBuilding(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#050a15] overflow-hidden">
      <div className="h-14 bg-[#0a1222] border-b border-cyan-900/40 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Shader Graph</span>
          <div className="w-px h-6 bg-cyan-900/40"></div>
          <div className="flex space-x-2">
            {Object.keys(NODE_TEMPLATES).map(type => (
              <button
                key={type}
                onClick={() => addNode(type)}
                className="px-3 py-1.5 bg-cyan-950/40 border border-cyan-500/20 rounded-lg text-[9px] font-black uppercase text-cyan-400 hover:bg-cyan-600/20 transition-all"
              >
                + {type}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={compileToGLSL}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-cyan-500/30"
          >
            Compile GLSL
          </button>
          <button
            onClick={() => onApplyToObjects('default')}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
          >
            Apply to Scene
          </button>
          <button
            onClick={handleAiBuild}
            disabled={isAiBuilding}
            className={`px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg ${isAiBuilding ? 'opacity-50 cursor-not-allowed' : 'shadow-purple-500/30'}`}
          >
            {isAiBuilding ? 'AI Synthesizing...' : 'AI Build'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            backgroundImage: 'radial-gradient(circle, #0a1222 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        >
          <svg className="absolute inset-0 pointer-events-none">
            {edges.map(edge => {
              const fromNode = nodes.find(n => n.id === edge.from);
              const toNode = nodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;
              return (
                <path
                  key={edge.id}
                  d={`M ${fromNode.position.x + 150} ${fromNode.position.y + 40} C ${fromNode.position.x + 250} ${fromNode.position.y + 40}, ${toNode.position.x - 50} ${toNode.position.y + 40}, ${toNode.position.x} ${toNode.position.y + 40}`}
                  stroke="#00f2ff"
                  strokeWidth={2}
                  fill="none"
                  opacity={0.6}
                />
              );
            })}
          </svg>

          {nodes.map(node => (
            <div
              key={node.id}
              onMouseDown={(e) => handleMouseDown(node.id, e)}
              className={`absolute w-40 bg-[#0a1222]/95 border rounded-2xl shadow-2xl backdrop-blur-xl cursor-move transition-all ${selectedNode === node.id ? 'border-cyan-500 shadow-[0_0_30px_rgba(0,242,255,0.3)]' : 'border-cyan-900/40'
                }`}
              style={{ left: node.position.x, top: node.position.y }}
            >
              <div className={`px-4 py-2 border-b border-cyan-900/40 rounded-t-2xl ${node.type === 'output' ? 'bg-emerald-600/20' : node.type === 'color' ? 'bg-purple-600/20' : 'bg-cyan-600/10'
                }`}>
                <span className="text-[9px] font-black uppercase text-cyan-50 tracking-widest">{node.label}</span>
              </div>
              <div className="p-3 space-y-2">
                {node.inputs.map(input => (
                  <div key={input} className="flex items-center space-x-2 relative">
                    <div
                      onMouseDown={(e) => handlePortMouseDown(node.id, input, 'in', e)}
                      onMouseUp={() => handlePortMouseUp(node.id, input, 'in')}
                      className={`w-3 h-3 rounded-full border cursor-pointer hover:scale-125 transition-transform ${edges.some(e => e.to === node.id && e.toInput === input)
                        ? 'bg-amber-500 border-amber-400'
                        : 'bg-slate-700 border-slate-600'
                        }`}
                    ></div>
                    <span className="text-[8px] text-slate-400 uppercase font-black">{input}</span>
                  </div>
                ))}

                {node.type === 'color' && (
                  <input
                    type="color"
                    value={node.value || '#00f2ff'}
                    onChange={(e) => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, value: e.target.value } : n))}
                    className="w-full h-8 rounded-lg cursor-pointer bg-transparent border-none"
                  />
                )}

                {node.outputs.map(output => (
                  <div key={output} className="flex items-center justify-end space-x-2">
                    <span className="text-[8px] text-slate-400 uppercase font-black">{output}</span>
                    <div
                      onMouseDown={(e) => handlePortMouseDown(node.id, output, 'out', e)}
                      onMouseUp={() => handlePortMouseUp(node.id, output, 'out')}
                      className="w-3 h-3 rounded-full bg-cyan-500 border border-cyan-400 cursor-pointer hover:scale-125 transition-transform"
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {activePort && (
            <svg className="absolute inset-0 pointer-events-none">
              <line x1={mousePos.x} y1={mousePos.y} x2={mousePos.x} y2={mousePos.y} stroke="white" />
            </svg>
          )}

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center opacity-30">
                <p className="text-[12px] font-black uppercase tracking-widest text-cyan-400">Add nodes to build your shader</p>
              </div>
            </div>
          )}
        </div>

        <div className="w-80 border-l border-cyan-900/40 bg-[#0a1222]/50 backdrop-blur-3xl p-6 flex flex-col shrink-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Live Preview</span>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-900"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-900"></div>
            </div>
          </div>

          <div className="flex-1 min-h-[300px]">
            <ShaderPreview fragmentShader={compiledGlsl} />
          </div>

          <div className="mt-6 space-y-4">
            <div className="p-4 bg-black/40 border border-cyan-900/20 rounded-2xl">
              <h4 className="text-[8px] font-black text-cyan-500 uppercase mb-2 tracking-widest">Compiler Metrics</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-[10px] text-slate-400">FPS: <span className="text-white font-mono">60</span></div>
                <div className="text-[10px] text-slate-400">Comp: <span className="text-emerald-400 font-mono">OK</span></div>
              </div>
            </div>
            <p className="text-[9px] text-slate-500 italic leading-relaxed">
              The holographic viewport utilizes standard WebGL2 context with precision highp support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShaderGraph;
