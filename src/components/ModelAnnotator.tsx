
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, Layers, Wand2, X, Play, Save, PenTool } from 'lucide-react';
import * as THREE from 'three';

interface Point {
    x: number;
    y: number;
    id: string;
}

interface Connection {
    from: string;
    to: string;
}

interface Skeleton {
    points: Point[];
    connections: Connection[];
}

interface ModelAnnotatorProps {
    onExport?: (skeleton: any) => void;
}

const ModelAnnotator: React.FC<ModelAnnotatorProps> = ({ onExport }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [points, setPoints] = useState<Point[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
    const [mode, setMode] = useState<'pan' | 'draw' | 'connect'>('draw');

    // Simple drawing loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;

        const render = () => {
            // Clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw connections
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2;
            connections.forEach(conn => {
                const p1 = points.find(p => p.id === conn.from);
                const p2 = points.find(p => p.id === conn.to);
                if (p1 && p2) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            });

            // Draw points
            points.forEach(p => {
                const isSelected = p.id === selectedPoint;

                ctx.fillStyle = isSelected ? '#f59e0b' : '#10b981';
                ctx.beginPath();
                ctx.arc(p.x, p.y, isSelected ? 8 : 5, 0, Math.PI * 2);
                ctx.fill();

                // Glow
                if (isSelected) {
                    ctx.shadowColor = '#f59e0b';
                    ctx.shadowBlur = 15;
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }
            });

            animId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animId);
    }, [points, connections, selectedPoint]);

    const handleCanvasClick = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Hit test
        const clickedPoint = points.find(p => Math.hypot(p.x - x, p.y - y) < 15);

        if (mode === 'draw') {
            if (clickedPoint) {
                setSelectedPoint(clickedPoint.id);
            } else {
                const newPoint: Point = { x, y, id: `pt_${Date.now()}` };
                setPoints(prev => [...prev, newPoint]);
                // Auto-connect to previously selected if exists to form chain
                if (selectedPoint) {
                    setConnections(prev => [...prev, { from: selectedPoint, to: newPoint.id }]);
                }
                setSelectedPoint(newPoint.id);
            }
        } else if (mode === 'connect') {
            if (clickedPoint && selectedPoint && clickedPoint.id !== selectedPoint) {
                // Toggle connection
                const exists = connections.some(c =>
                    (c.from === selectedPoint && c.to === clickedPoint.id) ||
                    (c.from === clickedPoint.id && c.to === selectedPoint)
                );

                if (!exists) {
                    setConnections(prev => [...prev, { from: selectedPoint, to: clickedPoint.id }]);
                }
                setSelectedPoint(clickedPoint.id);
            } else if (clickedPoint) {
                setSelectedPoint(clickedPoint.id);
            }
        }
    };

    const handleExport = () => {
        // Convert 2D points to normalized 3D coordinates (assuming Z=0 for now)
        const rect = canvasRef.current?.getBoundingClientRect();
        const width = rect?.width || 800;
        const height = rect?.height || 600;

        const skeletonData = {
            meta: { type: 'skeleton_2d', timestamp: Date.now() },
            joints: points.map(p => ({
                id: p.id,
                position: {
                    x: (p.x / width) * 2 - 1,
                    y: -(p.y / height) * 2 + 1,
                    z: 0
                }
            })),
            bones: connections
        };

        if (onExport) {
            onExport(skeletonData);
        } else {
            console.log('[SKELETON EXPORT]', skeletonData);
            alert('Skeleton exported to console');
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-[#050a15] text-slate-300 relative">
            <div className="absolute top-4 left-4 z-10 flex gap-2 bg-[#0a1222]/80 p-2 rounded-lg border border-cyan-900/30 backdrop-blur">
                <button
                    onClick={() => setMode('draw')}
                    className={`p-2 rounded ${mode === 'draw' ? 'bg-cyan-600' : 'hover:bg-white/10'}`} title="Draw Points"
                >
                    <PenTool size={18} />
                </button>
                <button
                    onClick={() => setMode('connect')}
                    className={`p-2 rounded ${mode === 'connect' ? 'bg-cyan-600' : 'hover:bg-white/10'}`} title="Connect Joints"
                >
                    <Layers size={18} />
                </button>
                <div className="w-px bg-white/20 mx-1" />
                <button onClick={() => setPoints([])} className="p-2 hover:bg-rose-500/20 text-rose-400 rounded" title="Clear">
                    <X size={18} />
                </button>
                <button onClick={handleExport} className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded" title="Generate Mesh">
                    <Play size={18} />
                </button>
            </div>

            {/* Background hint */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="text-6xl font-black text-cyan-900 uppercase">Skeleton Canvas</div>
            </div>

            <canvas
                ref={canvasRef}
                width={1200}
                height={800}
                className="w-full h-full cursor-crosshair touch-none"
                onClick={handleCanvasClick}
            />

            <div className="h-48 border-t border-cyan-900/30 bg-[#0a1222] p-4 font-mono text-xs overflow-y-auto">
                <div className="text-cyan-400 mb-2 font-bold uppercase">Joint Hierarchy</div>
                {points.map(p => (
                    <div key={p.id} className="flex justify-between hover:bg-white/5 p-1 rounded cursor-pointer" onClick={() => setSelectedPoint(p.id)}>
                        <span className={selectedPoint === p.id ? 'text-yellow-400' : 'text-slate-400'}>{p.id}</span>
                        <span className="text-slate-600">[{Math.round(p.x)}, {Math.round(p.y)}]</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ModelAnnotator;
