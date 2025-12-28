
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
    Node, Edge, Controls, Background, Connection,
    addEdge, applyNodeChanges, applyEdgeChanges,
    NodeChange, EdgeChange, Handle, Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { NODE_DEFINITIONS, NodeType, NodeDefinition } from '../services/n8n/nodeDefinitions';
import { workflowEngine, Workflow } from '../services/n8n/workflowEngine';
import { Play, Save, Plus, Trash2, Settings, Terminal } from 'lucide-react';
import { neuralRegistry } from '../services/ai/NeuralRegistry';

interface CustomNodeProps {
    data: {
        label: string,
        type: NodeType,
        parameters: any,
        onParameterChange: (key: string, value: any) => void
    }
}

const CustomNodeComponent = ({ data, selected }: CustomNodeProps & { selected?: boolean }) => {
    const def = NODE_DEFINITIONS[data.type];

    return (
        <div className={`px-5 py-4 rounded-3xl bg-[#0a1222]/80 border backdrop-blur-xl min-w-[200px] group transition-all duration-300 ${selected
            ? 'border-cyan-400 shadow-[0_0_30px_rgba(0,242,255,0.25)] ring-1 ring-cyan-500/50'
            : 'border-cyan-500/10 shadow-[0_10px_40px_rgba(0,0,0,0.4)] hover:border-cyan-500/30'
            }`}>
            {/* Glossy Header */}
            <div className="flex items-center border-b border-cyan-500/10 pb-4 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mr-4 border transition-all duration-500 ${selected ? 'bg-cyan-500 text-black border-cyan-400 scale-110' : 'bg-cyan-500/5 text-cyan-400 border-cyan-500/10'
                    }`}>
                    {def.icon}
                </div>
                <div>
                    <div className="text-[11px] font-black text-white uppercase tracking-[0.15em] mb-0.5">{data.label}</div>
                    <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${selected ? 'bg-cyan-400 animate-pulse' : 'bg-cyan-900'}`}></span>
                        <div className="text-[8px] text-cyan-600/80 font-black uppercase tracking-widest leading-none">{def.category}</div>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {/* Dynamic Inputs */}
                {def.inputs.map((input, idx) => (
                    <div key={`in-${idx}`} className="relative h-10 flex items-center group/port">
                        <Handle
                            type="target"
                            position={Position.Left}
                            id={input.name}
                            style={{
                                background: selected ? '#22d3ee' : '#0891b2',
                                width: '12px',
                                height: '12px',
                                left: '-10px',
                                border: '2px solid #050a15',
                                boxShadow: selected ? '0 0 10px #22d3ee' : 'none'
                            }}
                            className="transition-colors duration-300"
                        />
                        <div className="bg-black/40 border border-white/5 px-3 py-2 rounded-xl flex-1 flex items-center justify-between group-hover/port:border-cyan-500/30 transition-colors">
                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{input.name}</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/20"></div>
                        </div>
                    </div>
                ))}

                {/* Dynamic Outputs */}
                {def.outputs.map((output, idx) => (
                    <div key={`out-${idx}`} className="relative h-10 flex items-center group/port">
                        <div className="bg-black/40 border border-white/5 px-3 py-2 rounded-xl flex-1 flex items-center justify-between group-hover/port:border-emerald-500/30 transition-colors">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20"></div>
                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{output.name}</span>
                        </div>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={output.name}
                            style={{
                                background: selected ? '#34d399' : '#059669',
                                width: '12px',
                                height: '12px',
                                right: '-10px',
                                border: '2px solid #050a15',
                                boxShadow: selected ? '0 0 10px #34d399' : 'none'
                            }}
                            className="transition-colors duration-300"
                        />
                    </div>
                ))}
            </div>

            {/* Interaction Glow Layer */}
            {selected && (
                <div className="absolute inset-0 rounded-3xl bg-cyan-500/5 pointer-events-none animate-pulse"></div>
            )}
        </div>
    );
};

const nodeTypes = {
    custom: CustomNodeComponent
};

const N8NWorkflow: React.FC = () => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const addNode = useCallback((type: NodeType, pos?: { x: number, y: number }) => {
        const def = NODE_DEFINITIONS[type];
        if (!def) return;

        const id = `node_${Date.now()}`;
        const newNode: Node = {
            id,
            type: 'custom',
            position: pos || { x: 100, y: 100 },
            data: {
                label: def.label,
                type,
                parameters: Object.fromEntries(
                    def.parameters.map(p => [p.name, p.default ?? ''])
                ),
                onParameterChange: (key: string, value: any) => {
                    updateNodeParam(id, key, value);
                }
            },
        };

        setNodes((nds) => nds.concat(newNode));
        setSelectedNode(newNode); // Auto-select on add
    }, []);

    const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
    const onConnect = useCallback((connection: Connection) => setEdges((eds) => addEdge(connection, eds)), []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            const type = event.dataTransfer.getData('application/reactflow');
            if (!type) return;

            const position = { x: event.clientX - 400, y: event.clientY - 100 }; // Better offset
            addNode(type as NodeType, position);
        },
        [addNode]
    );

    const handleExecute = async () => {
        setIsRunning(true);
        setLogs(prev => [...prev, 'Starting workflow execution...']);

        // Transform ReactFlow graph to Workflow engine format
        const workflow: Workflow = {
            id: 'temp-run',
            name: 'Interactive Run',
            nodes: nodes.map(n => ({
                id: n.id,
                type: n.data.type,
                position: n.position,
                parameters: n.data.parameters
            })),
            connections: edges.map(e => ({
                id: e.id,
                sourceNode: e.source,
                sourceOutput: e.sourceHandle || 'default',
                targetNode: e.target,
                targetInput: e.targetHandle || 'default'
            }))
        };

        try {
            const result = await workflowEngine.execute(workflow);
            if (result.success) {
                setLogs(prev => [...prev, 'Execution successful!', JSON.stringify(result.outputs, null, 2)]);
            } else {
                setLogs(prev => [...prev, `Execution failed: ${result.error}`]);
            }
        } catch (e) {
            setLogs(prev => [...prev, `Critical Failure: ${e}`]);
        } finally {
            setIsRunning(false);
        }
    };

    useEffect(() => {
        neuralRegistry.registerLimb({
            id: 'pipeline',
            name: 'N8N Pipelines',
            description: 'Automated AI workflows and node-based logic engine.',
            capabilities: [
                {
                    name: 'execute_workflow',
                    description: 'Trigger the current visual workflow execution.',
                    parameters: {},
                    handler: async () => {
                        await handleExecute();
                        return { success: true };
                    }
                },
                {
                    name: 'add_node',
                    description: 'Programmatically add a node to the pipeline.',
                    parameters: {
                        type: { type: 'string', description: 'The type of node (input, ai, transform, etc.).' },
                        label: { type: 'string', description: 'Display label for the node.' }
                    },
                    handler: async (params) => {
                        addNode(params.type as NodeType);
                        return { success: true };
                    }
                }
            ]
        });
        return () => neuralRegistry.unregisterLimb('pipeline');
    }, [handleExecute, addNode]);

    const updateNodeParam = (nodeId: string, key: string, value: any) => {
        setNodes(nds => nds.map(n => {
            if (n.id === nodeId) {
                return {
                    ...n,
                    data: {
                        ...n.data,
                        parameters: { ...n.data.parameters, [key]: value }
                    }
                };
            }
            return n;
        }));
    };

    return (
        <div className="flex h-full w-full bg-[#050a15] text-slate-300">
            {/* Sidebar / Palette - Compact "Floating" Dock */}
            <div className="w-24 border-r border-white/5 p-4 flex flex-col items-center gap-6 overflow-y-auto bg-black/40 backdrop-blur-md">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 rotate-180 [writing-mode:vertical-lr] mb-4">Neural Functions</div>
                <div className="flex flex-col gap-4">
                    {Object.keys(NODE_DEFINITIONS).map(key => {
                        const def = NODE_DEFINITIONS[key as NodeType];
                        return (
                            <button
                                key={key}
                                onClick={() => addNode(key as NodeType)}
                                onDragStart={(event) => event.dataTransfer.setData('application/reactflow', key)}
                                draggable
                                className="group relative w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center cursor-pointer hover:border-cyan-500 hover:bg-cyan-500/10 hover:shadow-[0_0_25px_rgba(0,242,255,0.3)] transition-all duration-300 active:scale-90"
                                title={def.label}
                            >
                                <span className="text-3xl group-hover:scale-110 transition-transform">{def.icon}</span>

                                {/* Hover Tooltip (Enhanced) */}
                                <div className="absolute left-full ml-6 px-4 py-3 bg-[#0a1222] border border-cyan-500/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] opacity-0 group-hover:opacity-100 pointer-events-none z-[100] transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap backdrop-blur-3xl">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-xl">{def.icon}</span>
                                        <div className="text-xs font-black uppercase text-white tracking-widest">{def.label}</div>
                                    </div>
                                    <div className="text-[9px] text-slate-400 font-medium max-w-[200px] whitespace-normal leading-relaxed">{def.description}</div>
                                    <div className="mt-2 text-[8px] font-black uppercase text-cyan-600 tracking-widest">Click to spawn • Drag to place</div>
                                    {/* Arrow */}
                                    <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 border-8 border-transparent border-r-[#0a1222]"></div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Canvas */}
            <div className="flex-1 relative h-full" onDrop={onDrop} onDragOver={onDragOver}>
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button
                        onClick={handleExecute}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold uppercase tracking-widest text-xs transition-all ${isRunning ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 animate-pulse' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/40'}`}
                    >
                        <Play size={14} /> {isRunning ? 'Running...' : 'Execute'}
                    </button>
                </div>

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    onNodeClick={(_, node) => setSelectedNode(node)}
                    fitView
                >
                    <Background color="#164e63" gap={20} size={1} />
                    <Controls />
                </ReactFlow>
            </div>

            {/* Properties Panel */}
            <div className="w-80 border-l border-cyan-900/30 flex flex-col bg-[#0a1222]">
                <div className="h-1/2 p-4 border-b border-cyan-900/30 overflow-y-auto">
                    <div className="text-xs font-black uppercase tracking-widest text-cyan-500 mb-4 flex items-center gap-2">
                        <Settings size={14} /> Properties
                    </div>
                    {selectedNode ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-xl font-bold text-white">{selectedNode.data.label}</div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={async () => {
                                            if (!selectedNode) return;
                                            setLogs(prev => [...prev, `Testing node: ${selectedNode.data.label}...`]);
                                            try {
                                                const result = await workflowEngine.executeNode(
                                                    {
                                                        id: selectedNode.id,
                                                        type: selectedNode.data.type,
                                                        position: selectedNode.position,
                                                        parameters: selectedNode.data.parameters
                                                    },
                                                    {} // Mock empty inputs for isolated test
                                                );
                                                setLogs(prev => [...prev, `Test Result: ${JSON.stringify(result, null, 2)}`]);
                                            } catch (e) {
                                                setLogs(prev => [...prev, `Test Failed: ${e}`]);
                                            }
                                        }}
                                        className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-all"
                                        title="Test this node"
                                    >
                                        <Play size={12} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
                                            setSelectedNode(null);
                                        }}
                                        className="p-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-all"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase font-mono mb-6 pb-4 border-b border-white/5">{selectedNode.id}</div>

                            {NODE_DEFINITIONS[selectedNode.data.type as NodeType]?.parameters.map(param => (
                                <div key={param.name} className="space-y-2">
                                    <label className="nexus-label !text-cyan-400 flex justify-between">
                                        {param.label}
                                        {param.required && <span className="text-rose-500 text-[8px] animate-pulse">Required</span>}
                                    </label>
                                    {param.type === 'textarea' || param.type === 'code' ? (
                                        <textarea
                                            className="nexus-textarea w-full min-h-[160px] font-mono !p-3 !text-[11px]"
                                            value={selectedNode.data.parameters[param.name] || ''}
                                            onChange={(e) => updateNodeParam(selectedNode.id, param.name, e.target.value)}
                                            placeholder={`Input ${param.label.toLowerCase()} here...`}
                                        />
                                    ) : param.type === 'select' ? (
                                        <select
                                            className="nexus-input w-full !py-2.5"
                                            value={selectedNode.data.parameters[param.name] || param.default}
                                            onChange={(e) => updateNodeParam(selectedNode.id, param.name, e.target.value)}
                                        >
                                            {param.options?.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type={param.type === 'number' ? 'number' : 'text'}
                                            className="nexus-input w-full !py-2.5"
                                            value={selectedNode.data.parameters[param.name] || ''}
                                            onChange={(e) => updateNodeParam(selectedNode.id, param.name, e.target.value)}
                                            placeholder={`Enter ${param.label.toLowerCase()}...`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-slate-600 text-xs mt-10">Select a node to edit parameters</div>
                    )}
                </div>

                <div className="flex-1 flex flex-col p-4 bg-black/20">
                    <div className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-2 flex items-center gap-2">
                        <Terminal size={14} /> Execution Logs
                    </div>
                    <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1 text-emerald-400/80">
                        {logs.map((log, i) => (
                            <div key={i} className="break-words border-b border-emerald-500/10 pb-1 mb-1 last:border-0">{log}</div>
                        ))}
                        {logs.length === 0 && <div className="text-slate-700 italic">Ready to execute...</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default N8NWorkflow;
