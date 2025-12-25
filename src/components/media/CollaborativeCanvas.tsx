
import React, { useState, useRef, useEffect } from 'react';
import { MousePointer2, Pen, Square, Circle, Type, Eraser, Share2, Users } from 'lucide-react';

interface Point { x: number; y: number; }

interface CanvasElement {
    id: string;
    type: 'path' | 'rect' | 'circle' | 'text';
    points?: Point[]; // For paths
    x?: number;      // For shapes/text
    y?: number;
    width?: number;
    height?: number;
    radius?: number;
    color: string;
    text?: string;
}

interface Collaborator {
    id: string;
    name: string;
    color: string;
    x: number;
    y: number;
}

const TOOLS = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'pen', icon: Pen, label: 'Pen' },
    { id: 'rect', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
];

export const CollaborativeCanvas: React.FC = () => {
    const [elements, setElements] = useState<CanvasElement[]>([]);
    const [activeTool, setActiveTool] = useState('select');
    const [color, setColor] = useState('#06b6d4'); // Cyan-500
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
    const svgRef = useRef<SVGSVGElement>(null);

    // Simulated Collaborators
    const [collaborators, setCollaborators] = useState<Collaborator[]>([
        { id: 'u1', name: 'Alice', color: '#f472b6', x: 200, y: 300 },
        { id: 'u2', name: 'Bob', color: '#a78bfa', x: 500, y: 150 },
    ]);

    // Simulate remote mouse movement
    useEffect(() => {
        const interval = setInterval(() => {
            setCollaborators(prev => prev.map(c => ({
                ...c,
                x: c.x + (Math.random() - 0.5) * 20,
                y: c.y + (Math.random() - 0.5) * 20,
            })));
        }, 100);
        return () => clearInterval(interval);
    }, []);

    const getMousePos = (e: React.MouseEvent) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const rect = svgRef.current.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (activeTool === 'select') return;
        setIsDrawing(true);
        const pos = getMousePos(e);

        if (activeTool === 'pen') {
            setCurrentPoints([pos]);
        } else if (activeTool === 'rect' || activeTool === 'circle') {
            // Start shape preview logic here if we were doing drag-to-create size
            // For now, simple click-to-place-default or drag logic
            // We'll implement drag-to-size for shapes:
            setCurrentPoints([pos]); // Start point
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing) return;
        const pos = getMousePos(e);

        if (activeTool === 'pen') {
            setCurrentPoints(prev => [...prev, pos]);
        } else if (activeTool === 'rect' || activeTool === 'circle') {
            // Just tracking current end point for preview
            setCurrentPoints(prev => [prev[0], pos]);
        }
    };

    const handleMouseUp = () => {
        if (!isDrawing) return;
        setIsDrawing(false);

        if (activeTool === 'pen' && currentPoints.length > 1) {
            const newEl: CanvasElement = {
                id: Math.random().toString(36).substr(2, 9),
                type: 'path',
                points: currentPoints,
                color: color
            };
            setElements(prev => [...prev, newEl]);
        } else if (activeTool === 'rect' && currentPoints.length === 2) {
            const start = currentPoints[0];
            const end = currentPoints[1];
            const newEl: CanvasElement = {
                id: Math.random().toString(36).substr(2, 9),
                type: 'rect',
                x: Math.min(start.x, end.x),
                y: Math.min(start.y, end.y),
                width: Math.abs(end.x - start.x),
                height: Math.abs(end.y - start.y),
                color: color
            };
            setElements(prev => [...prev, newEl]);
        } else if (activeTool === 'circle' && currentPoints.length === 2) {
            const start = currentPoints[0];
            const end = currentPoints[1];
            const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
            const newEl: CanvasElement = {
                id: Math.random().toString(36).substr(2, 9),
                type: 'circle',
                x: start.x,
                y: start.y,
                radius: radius,
                color: color
            };
            setElements(prev => [...prev, newEl]);
        }

        setCurrentPoints([]);
    };

    const clearCanvas = () => setElements([]);

    return (
        <div className="flex flex-col h-full bg-[#050a15] text-white">
            {/* Header Toolbar */}
            <div className="h-14 border-b border-cyan-900/30 flex items-center justify-between px-6 bg-[#0a1222]">
                <div className="flex items-center space-x-4">
                    <div className="flex bg-cyan-950/30 rounded-lg p-1 border border-cyan-900/30">
                        {TOOLS.map(tool => (
                            <button
                                key={tool.id}
                                onClick={() => setActiveTool(tool.id)}
                                className={`p-2 rounded-md transition-all ${activeTool === tool.id
                                        ? 'bg-cyan-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-900/20'
                                    }`}
                                title={tool.label}
                            >
                                <tool.icon className="w-5 h-5" />
                            </button>
                        ))}
                    </div>
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                    />
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex -space-x-2">
                        {collaborators.map(c => (
                            <div key={c.id} className="w-8 h-8 rounded-full border-2 border-[#0a1222] flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: c.color }}>
                                {c.name[0]}
                            </div>
                        ))}
                        <div className="w-8 h-8 rounded-full border-2 border-[#0a1222] bg-slate-700 flex items-center justify-center text-[10px] text-slate-300">
                            +2
                        </div>
                    </div>
                    <button className="flex items-center space-x-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-bold transition-colors">
                        <Share2 className="w-4 h-4" />
                        <span>Invite</span>
                    </button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative overflow-hidden bg-[#02040a] cursor-crosshair">
                {/* Grid Background */}
                <div className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #22d3ee 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}
                />

                <svg
                    ref={svgRef}
                    className="w-full h-full"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {/* Render Existing Elements */}
                    {elements.map(el => {
                        if (el.type === 'path' && el.points) {
                            const d = `M ${el.points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
                            return <path key={el.id} d={d} stroke={el.color} strokeWidth="3" fill="none" strokeLinecap="round" />;
                        }
                        if (el.type === 'rect') {
                            return <rect key={el.id} x={el.x} y={el.y} width={el.width} height={el.height} stroke={el.color} strokeWidth="2" fill={el.color} fillOpacity="0.2" />;
                        }
                        if (el.type === 'circle') {
                            return <circle key={el.id} cx={el.x} cy={el.y} r={el.radius} stroke={el.color} strokeWidth="2" fill={el.color} fillOpacity="0.2" />;
                        }
                        return null;
                    })}

                    {/* Render Preview of Current Draw */}
                    {isDrawing && currentPoints.length > 0 && (
                        <>
                            {activeTool === 'pen' && (
                                <path
                                    d={`M ${currentPoints.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                                    stroke={color}
                                    strokeWidth="3"
                                    fill="none"
                                    strokeLinecap="round"
                                    opacity="0.6"
                                />
                            )}
                            {activeTool === 'rect' && currentPoints.length >= 2 && (
                                <rect
                                    x={Math.min(currentPoints[0].x, currentPoints[currentPoints.length - 1].x)}
                                    y={Math.min(currentPoints[0].y, currentPoints[currentPoints.length - 1].y)}
                                    width={Math.abs(currentPoints[currentPoints.length - 1].x - currentPoints[0].x)}
                                    height={Math.abs(currentPoints[currentPoints.length - 1].y - currentPoints[0].y)}
                                    stroke={color}
                                    strokeWidth="2"
                                    fill={color}
                                    fillOpacity="0.1"
                                    strokeDasharray="5,5"
                                />
                            )}
                            {activeTool === 'circle' && currentPoints.length >= 2 && (
                                <circle
                                    cx={currentPoints[0].x}
                                    cy={currentPoints[0].y}
                                    r={Math.sqrt(Math.pow(currentPoints[currentPoints.length - 1].x - currentPoints[0].x, 2) + Math.pow(currentPoints[currentPoints.length - 1].y - currentPoints[0].y, 2))}
                                    stroke={color}
                                    strokeWidth="2"
                                    fill={color}
                                    fillOpacity="0.1"
                                    strokeDasharray="5,5"
                                />
                            )}
                        </>
                    )}

                    {/* Render Collaborator Cursors */}
                    {collaborators.map(c => (
                        <g key={c.id} style={{ transform: `translate(${c.x}px, ${c.y}px)`, transition: 'transform 0.1s linear' }}>
                            <MousePointer2 className="w-4 h-4" fill={c.color} stroke="white" />
                            <text x="12" y="12" fill={c.color} fontSize="10" fontWeight="bold">{c.name}</text>
                        </g>
                    ))}

                </svg>

                {/* Floating Controls */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#0a1222] border border-cyan-900/50 rounded-full px-6 py-2 shadow-xl flex items-center space-x-4">
                    <span className="text-xs text-slate-400 font-mono">CANVAS READY</span>
                    <div className="w-px h-4 bg-white/10" />
                    <button onClick={clearCanvas} className="text-xs text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider">Clear Board</button>
                </div>
            </div>
        </div>
    );
};
