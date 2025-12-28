
import React, { useRef, useState, useEffect } from 'react';
import mediaContext from '../services/media/mediaContextService';

interface AnnotationOverlayProps {
    isActive: boolean;
    onClose: () => void;
    onProcess: (imageData: string, mode: '3d' | 'image' | 'code') => void;
}

type Tool = 'pen' | 'eraser' | 'line' | 'rect' | 'circle' | 'text';

interface HistoryState {
    imageData: ImageData;
}

export const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({ isActive, onClose, onProcess }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
    const [outputMode, setOutputMode] = useState<'3d' | 'image' | 'code'>('3d');
    const [color, setColor] = useState('#00f2ff');
    const [tool, setTool] = useState<Tool>('pen');
    const [brushSize, setBrushSize] = useState(3);
    const [opacity, setOpacity] = useState(1);
    const [history, setHistory] = useState<HistoryState[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.lineWidth = brushSize;
                ctx.strokeStyle = color;
                ctx.globalAlpha = opacity;
                setContext(ctx);
                saveToHistory(ctx);
            }
        }
    }, []);

    useEffect(() => {
        if (context) {
            context.strokeStyle = color;
            context.fillStyle = color;
            context.lineWidth = tool === 'eraser' ? brushSize * 2 : brushSize;
            context.globalAlpha = opacity;
        }
    }, [color, brushSize, opacity, tool, context]);

    const saveToHistory = (ctx: CanvasRenderingContext2D) => {
        if (!canvasRef.current) return;
        const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ imageData });
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const undo = () => {
        if (historyIndex > 0 && context && canvasRef.current) {
            const newIndex = historyIndex - 1;
            context.putImageData(history[newIndex].imageData, 0, 0);
            setHistoryIndex(newIndex);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1 && context && canvasRef.current) {
            const newIndex = historyIndex + 1;
            context.putImageData(history[newIndex].imageData, 0, 0);
            setHistoryIndex(newIndex);
        }
    };

    const startDrawing = (e: React.MouseEvent) => {
        if (!context || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (tool === 'pen' || tool === 'eraser') {
            context.beginPath();
            context.moveTo(x, y);
        } else {
            setStartPos({ x, y });
        }

        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing || !context || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (tool === 'pen') {
            context.lineTo(x, y);
            context.stroke();
        } else if (tool === 'eraser') {
            context.save();
            context.globalCompositeOperation = 'destination-out';
            context.lineTo(x, y);
            context.stroke();
            context.restore();
        } else if (startPos && (tool === 'line' || tool === 'rect' || tool === 'circle')) {
            // For shapes, redraw from history to show preview
            if (historyIndex >= 0) {
                context.putImageData(history[historyIndex].imageData, 0, 0);
            }

            context.beginPath();
            const width = x - startPos.x;
            const height = y - startPos.y;

            if (tool === 'line') {
                context.moveTo(startPos.x, startPos.y);
                context.lineTo(x, y);
                context.stroke();
            } else if (tool === 'rect') {
                context.strokeRect(startPos.x, startPos.y, width, height);
            } else if (tool === 'circle') {
                const radius = Math.sqrt(width * width + height * height);
                context.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
                context.stroke();
            }
        }
    };

    const stopDrawing = () => {
        if (context) {
            context.closePath();
            if (isDrawing) {
                saveToHistory(context);
            }
        }
        setIsDrawing(false);
        setStartPos(null);
    };

    const handleProcess = () => {
        if (canvasRef.current) {
            const dataUrl = canvasRef.current.toDataURL('image/png');
            onProcess(dataUrl, outputMode);
        }
    };

    const handleSaveToLibrary = async () => {
        if (!canvasRef.current) return;

        const dataUrl = canvasRef.current.toDataURL('image/png');
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `sketch-${Date.now()}.png`, { type: 'image/png' });

        const result = await mediaContext.importAsset(file, {
            tags: ['sketch', 'annotation'],
            metadata: {
                description: `Annotation sketch created at ${new Date().toLocaleString()}`
            }
        });

        if (result.success) {
            alert('Saved to Media Library!');
        }
    };

    const clear = () => {
        if (context && canvasRef.current) {
            context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            saveToHistory(context);
        }
    };

    if (!isActive) return null;

    return (
        <div className="absolute inset-0 z-50 pointer-events-auto cursor-crosshair">
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="absolute inset-0"
            />

            {/* Enhanced HUD Toolbar */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#0a1222]/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl px-6 py-3 shadow-[0_0_30px_rgba(0,242,255,0.2)]">
                <div className="flex items-center space-x-4">
                    <span className="text-[10px] font-black uppercase text-cyan-400 tracking-widest animate-pulse">✏️ Drawing Mode</span>
                    <div className="h-6 w-px bg-cyan-900/50"></div>

                    {/* Tool Selection */}
                    <div className="flex gap-1">
                        {[
                            { id: 'pen' as Tool, icon: '✏️', title: 'Pen' },
                            { id: 'eraser' as Tool, icon: '🧹', title: 'Eraser' },
                            { id: 'line' as Tool, icon: '📏', title: 'Line' },
                            { id: 'rect' as Tool, icon: '⬜', title: 'Rectangle' },
                            { id: 'circle' as Tool, icon: '⭕', title: 'Circle' },
                            { id: 'text' as Tool, icon: '🔤', title: 'Text Label' }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTool(t.id)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${tool === t.id ? 'bg-cyan-600 scale-110' : 'bg-slate-800 hover:bg-slate-700'
                                    }`}
                                title={t.title}
                            >
                                {t.icon}
                            </button>
                        ))}
                    </div>

                    <div className="h-6 w-px bg-cyan-900/50"></div>

                    {/* Color Palette */}
                    <div className="flex gap-1">
                        {['#00f2ff', '#ff0055', '#ccff00', '#ffffff', '#000000', '#8b5cf6'].map(c => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-6 h-6 rounded-lg border-2 transition-all ${color === c ? 'border-white scale-110 shadow-lg' : 'border-white/20 hover:scale-105'
                                    }`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>

                    <div className="h-6 w-px bg-cyan-900/50"></div>

                    {/* Brush Controls */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-slate-400 uppercase w-12">Size</span>
                            <input
                                type="range"
                                min="1"
                                max="50"
                                value={brushSize}
                                onChange={(e) => setBrushSize(Number(e.target.value))}
                                className="w-20 accent-cyan-500"
                            />
                            <span className="text-[9px] text-cyan-400 w-6">{brushSize}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-slate-400 uppercase w-12">Opacity</span>
                            <input
                                type="range"
                                min="0.1"
                                max="1"
                                step="0.1"
                                value={opacity}
                                onChange={(e) => setOpacity(Number(e.target.value))}
                                className="w-20 accent-cyan-500"
                            />
                            <span className="text-[9px] text-cyan-400 w-6">{Math.round(opacity * 100)}</span>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-cyan-900/50"></div>

                    {/* Undo/Redo */}
                    <div className="flex gap-1">
                        <button
                            onClick={undo}
                            disabled={historyIndex <= 0}
                            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all"
                            title="Undo (Ctrl+Z)"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                        </button>
                        <button
                            onClick={redo}
                            disabled={historyIndex >= history.length - 1}
                            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all"
                            title="Redo (Ctrl+Y)"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                            </svg>
                        </button>
                    </div>

                    <div className="h-6 w-px bg-cyan-900/50"></div>

                    {/* Output Mode */}
                    <select
                        value={outputMode}
                        onChange={(e) => setOutputMode(e.target.value as any)}
                        className="bg-slate-800 text-[10px] font-black uppercase text-white outline-none px-3 py-1 rounded-lg"
                    >
                        <option value="3d">🎭 3D AI</option>
                        <option value="image">🖼️ Vision</option>
                        <option value="code">💻 Code</option>
                    </select>

                    <div className="h-6 w-px bg-cyan-900/50"></div>

                    {/* Actions */}
                    <button
                        onClick={handleSaveToLibrary}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1 rounded-lg text-[10px] font-black uppercase transition-all"
                        title="Save to Media Library"
                    >
                        💾 Save
                    </button>

                    <button
                        onClick={handleProcess}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-1 rounded-lg text-[10px] font-black uppercase transition-all"
                        title="Process with AI"
                    >
                        ⚒️ Forge
                    </button>

                    <button onClick={clear} className="text-slate-400 hover:text-white px-2" title="Clear canvas">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>

                    <button onClick={onClose} className="text-slate-400 hover:text-white px-2" title="Close">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg text-[10px] text-slate-400">
                <span className="font-bold text-cyan-400">Shortcuts:</span> Ctrl+Z (Undo) • Ctrl+Y (Redo) • ESC (Close)
            </div>
        </div>
    );
};
