/**
 * Image Studio Component
 * Professional image editor with layers, AI tools, and non-destructive editing
 */

import React, { useState, useRef, useEffect } from 'react';
import mediaContext from '../../services/media/mediaContextService';
import { cloudflareProvider } from '../../services/cloudflareProvider';
import {
    Settings,
    Save,
    Eye,
    Sparkles,
    RefreshCw,
    ScanLine,
    Layers,
    Sliders,
    Zap
} from 'lucide-react';
import {
    createLayer,
    resizeImage,
    cropImage,
    rotateImage,
    flipImage,
    adjustBrightnessContrast,
    applyFilter,
    compositeLayers,
    removeBackground,
    upscaleImage,
    enhanceImage,
    exportImage,
    loadImage,
    type ImageLayer,
    type ImageEditorState,
    type FilterType
} from '../../services/media/imageProcessing';
import type { MediaAsset } from '../../types/media';
import { forgeMedia } from '../../services/forgeMediaService';

interface ImageStudioProps {
    asset?: MediaAsset;
    onClose?: () => void;
    onSave?: (asset: MediaAsset) => void;
}

type Tool = 'select' | 'brush' | 'eraser' | 'crop' | 'text';


export const ImageStudio: React.FC<ImageStudioProps> = ({ asset, onClose, onSave }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [state, setState] = useState<ImageEditorState>({
        width: asset?.metadata?.width || 1280,
        height: asset?.metadata?.height || 720,
        layers: [createLayer(asset?.metadata?.width || 1280, asset?.metadata?.height || 720, 'Background')],
        activeLayerId: null,
        history: [],
        historyIndex: -1
    });

    const [tool, setTool] = useState<Tool>('select');
    const [activeTab, setActiveTab] = useState<'layers' | 'adjust' | 'ai'>('layers');
    const [zoom, setZoom] = useState(100);
    const [brightness, setBrightness] = useState(0);
    const [contrast, setContrast] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [exportFormat, setExportFormat] = useState<'png' | 'jpg' | 'webp'>('png');
    const [aiPrompt, setAiPrompt] = useState('');
    const [analysisResults, setAnalysisResults] = useState<any[]>([]);

    // Coordinate Translation Utility (NEW)
    const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e.nativeEvent) {
            clientX = e.nativeEvent.touches[0].clientX;
            clientY = e.nativeEvent.touches[0].clientY;
        } else {
            const mouseEvent = e as React.MouseEvent;
            clientX = mouseEvent.clientX;
            clientY = mouseEvent.clientY;
        }

        // Translate screen coords to canvas coords, accounting for CSS scaling (zoom)
        return {
            x: Math.round((clientX - rect.left) * (canvas.width / rect.width)),
            y: Math.round((clientY - rect.top) * (canvas.height / rect.height))
        };
    };

    // Load asset on mount (Dynamic dimension update)
    useEffect(() => {
        if (asset?.url) {
            loadAsset(asset.url);
        }
    }, [asset]);

    // Set first layer as active
    useEffect(() => {
        if (state.layers.length > 0 && !state.activeLayerId) {
            setState(prev => ({ ...prev, activeLayerId: prev.layers[0].id }));
        }
    }, [state.layers.length]);

    // Render canvas
    useEffect(() => {
        renderCanvas();
    }, [state.layers, zoom]);

    const loadAsset = async (url: string) => {
        try {
            setIsProcessing(true);
            const imageData = await loadImage(url);

            const bgLayer = createLayer(imageData.width, imageData.height, 'Background');
            bgLayer.imageData = imageData;

            setState({
                width: imageData.width,
                height: imageData.height,
                layers: [bgLayer],
                activeLayerId: bgLayer.id,
                history: [],
                historyIndex: -1
            });
        } catch (error) {
            console.error('[IMAGE_STUDIO] Failed to load asset:', error);
            alert('Failed to load image');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsProcessing(true);
            const imageData = await loadImage(file);

            // Create a new layer with the uploaded image
            const newLayer = createLayer(imageData.width, imageData.height, file.name);
            newLayer.imageData = imageData;

            setState(prev => ({
                width: Math.max(prev.width, imageData.width),
                height: Math.max(prev.height, imageData.height),
                layers: [...prev.layers, newLayer],
                activeLayerId: newLayer.id,
                history: [],
                historyIndex: -1
            }));
        } catch (error) {
            console.error('[IMAGE_STUDIO] Upload error:', error);
            alert('Failed to process image upload');
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDetectObjects = async () => {
        const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
        if (!activeLayer?.imageData) return;

        setIsProcessing(true);
        try {
            // Convert current image data to blob for analysis
            const canvas = document.createElement('canvas');
            canvas.width = activeLayer.imageData.width;
            canvas.height = activeLayer.imageData.height;
            const ctx = canvas.getContext('2d')!;
            ctx.putImageData(activeLayer.imageData, 0, 0);

            const blob = await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b!), 'image/png'));

            // Rule #2: No direct AI calls. Routing through Nexus backend.
            const { routeNexus } = await import('../../backend/routeToModel');
            const response = await routeNexus({
                type: 'vision',
                prompt: blob as any // Nexus router handles blob -> analysis
            });

            if (response instanceof ReadableStream) {
                throw new Error('Streaming not supported for vision analysis');
            }

            const results = JSON.parse(response.content || '[]');
            setAnalysisResults(results);
        } catch (error) {
            console.error('[IMAGE_STUDIO] Vision analysis error:', error);
            alert('Failed to analyze image');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGenerateAI = async () => {
        if (!aiPrompt.trim()) return;

        setIsProcessing(true);
        try {
            // Rule #2: No direct AI calls. Routing through Nexus backend.
            const { routeNexus } = await import('../../backend/routeToModel');
            const response = await routeNexus({
                type: 'image',
                prompt: aiPrompt
            });

            if (response instanceof ReadableStream) {
                throw new Error('Streaming not supported for image generation');
            }

            // Image response content is the base64 string
            const dataUrl = `data:image/png;base64,${response.content}`;

            const imageData = await loadImage(dataUrl);
            const aiLayer = createLayer(imageData.width, imageData.height, `AI: ${aiPrompt.slice(0, 15)}...`);
            aiLayer.imageData = imageData;

            setState(prev => ({
                width: Math.max(prev.width, imageData.width),
                height: Math.max(prev.height, imageData.height),
                layers: [...prev.layers, aiLayer],
                activeLayerId: aiLayer.id,
                history: [],
                historyIndex: -1
            }));

            // Register with Forge Media
            forgeMedia.addAsset({
                type: 'image',
                url: dataUrl,
                prompt: aiPrompt,
                model: response.model,
                tags: ['ai-generated', 'image-studio']
            });

            setAiPrompt('');
            setActiveTab('layers');
        } catch (error) {
            console.error('[IMAGE_STUDIO] AI Generation error:', error);
            alert('Failed to generate image with AI');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleToolSelect = (newTool: Tool) => {
        setTool(newTool);
        console.log(`[STUDIO] Active tool switched to: ${newTool}`);
        // Visual feedback would usually be a Toast
    };

    const handleSettingsClick = () => {
        console.log('[STUDIO] Opening Engine Settings...');
        alert('Image Studio Settings (Cloudflare Model Configuration) coming soon.');
    };

    const handleSaveOverlay = async () => {
        if (!state.layers.length) return;
        setIsProcessing(true);
        try {
            await handleExport();
            console.log('[STUDIO] Snapshot saved to Media Registry');
        } finally {
            setIsProcessing(false);
        }
    };

    const renderCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d')!;
        canvas.width = state.width;
        canvas.height = state.height;

        // Clear
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, state.width, state.height);

        // Composite all layers
        const composite = compositeLayers(state.layers, state.width, state.height);
        ctx.putImageData(composite, 0, 0);
    };

    const addLayer = () => {
        const newLayer = createLayer(state.width, state.height, `Layer ${state.layers.length + 1}`);
        setState(prev => ({
            ...prev,
            layers: [...prev.layers, newLayer],
            activeLayerId: newLayer.id
        }));
    };

    const duplicateLayer = (layerId: string) => {
        const layer = state.layers.find(l => l.id === layerId);
        if (!layer) return;

        const duplicate: ImageLayer = {
            ...layer,
            id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: `${layer.name} copy`
        };

        setState(prev => ({
            ...prev,
            layers: [...prev.layers, duplicate]
        }));
    };

    const deleteLayer = (layerId: string) => {
        if (state.layers.length === 1) {
            alert('Cannot delete the last layer');
            return;
        }

        setState(prev => {
            const newLayers = prev.layers.filter(l => l.id !== layerId);
            const newActiveId = prev.activeLayerId === layerId
                ? newLayers[0]?.id || null
                : prev.activeLayerId;

            return {
                ...prev,
                layers: newLayers,
                activeLayerId: newActiveId
            };
        });
    };

    const updateLayer = (layerId: string, updates: Partial<ImageLayer>) => {
        setState(prev => ({
            ...prev,
            layers: prev.layers.map(l => l.id === layerId ? { ...l, ...updates } : l)
        }));
    };

    const moveLayer = (layerId: string, direction: 'up' | 'down') => {
        setState(prev => {
            const index = prev.layers.findIndex(l => l.id === layerId);
            if (index === -1) return prev;

            const newLayers = [...prev.layers];
            const targetIndex = direction === 'up' ? index + 1 : index - 1;

            if (targetIndex < 0 || targetIndex >= newLayers.length) return prev;

            [newLayers[index], newLayers[targetIndex]] = [newLayers[targetIndex], newLayers[index]];

            return { ...prev, layers: newLayers };
        });
    };

    const handleFilter = async (filter: FilterType) => {
        const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
        if (!activeLayer?.imageData) return;

        setIsProcessing(true);
        try {
            const filtered = applyFilter(activeLayer.imageData, filter);
            updateLayer(activeLayer.id, { imageData: filtered });
        } catch (error) {
            console.error('[IMAGE_STUDIO] Filter error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAdjustments = async () => {
        const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
        if (!activeLayer?.imageData) return;

        setIsProcessing(true);
        try {
            const adjusted = adjustBrightnessContrast(activeLayer.imageData, brightness, contrast);
            updateLayer(activeLayer.id, { imageData: adjusted });
        } catch (error) {
            console.error('[IMAGE_STUDIO] Adjustment error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRotate = async (degrees: number) => {
        const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
        if (!activeLayer?.imageData) return;

        setIsProcessing(true);
        try {
            const rotated = rotateImage(activeLayer.imageData, degrees);
            updateLayer(activeLayer.id, { imageData: rotated });
        } catch (error) {
            console.error('[IMAGE_STUDIO] Rotate error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFlip = async (direction: 'horizontal' | 'vertical') => {
        const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
        if (!activeLayer?.imageData) return;

        setIsProcessing(true);
        try {
            const flipped = flipImage(activeLayer.imageData, direction);
            updateLayer(activeLayer.id, { imageData: flipped });
        } catch (error) {
            console.error('[IMAGE_STUDIO] Flip error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemoveBackground = async () => {
        const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
        if (!activeLayer?.imageData) return;

        setIsProcessing(true);
        try {
            const result = await removeBackground(activeLayer.imageData);
            updateLayer(activeLayer.id, { imageData: result });
        } catch (error) {
            console.error('[IMAGE_STUDIO] Remove background error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpscale = async (factor: 2 | 4) => {
        const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
        if (!activeLayer?.imageData) return;

        setIsProcessing(true);
        try {
            const result = await upscaleImage(activeLayer.imageData, factor);
            updateLayer(activeLayer.id, { imageData: result });
            // Also need to update global width/height if it's the base layer, or let it be distinct?
            // For now, let's update canvas size to match if it's the only layer or background
            if (state.layers.length === 1 || activeLayer.name === 'Background') {
                setState(prev => ({ ...prev, width: result.width, height: result.height }));
            }
        } catch (error) {
            console.error('[IMAGE_STUDIO] Upscale error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEnhance = async () => {
        const activeLayer = state.layers.find(l => l.id === state.activeLayerId);
        if (!activeLayer?.imageData) return;

        setIsProcessing(true);
        try {
            const result = await enhanceImage(activeLayer.imageData);
            updateLayer(activeLayer.id, { imageData: result });
        } catch (error) {
            console.error('[IMAGE_STUDIO] Enhance error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExport = async () => {
        setIsProcessing(true);
        try {
            const composite = compositeLayers(state.layers, state.width, state.height);
            const blob = await exportImage(composite, exportFormat);

            // Save to media library
            const file = new File([blob], `edited-${Date.now()}.${exportFormat}`, { type: blob.type });
            const result = await mediaContext.importAsset(file, {
                tags: ['edited', 'image-studio'],
                metadata: {
                    description: `Edited in Image Studio at ${new Date().toLocaleString()}`
                }
            });

            if (result.success) {
                alert('Exported to Media Library!');
                onSave?.(result.asset!);
            }
        } catch (error) {
            console.error('[IMAGE_STUDIO] Export error:', error);
            alert('Export failed');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#050a15] text-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-cyan-500/30 bg-[#0a1222] shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-black uppercase tracking-widest text-cyan-400">
                        🎨 Image Studio
                    </h2>
                    {asset && <span className="text-xs text-slate-400">{asset.name}</span>}
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                    />
                    <button
                        onClick={handleSettingsClick}
                        className="p-2 mr-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400 transition-all"
                        title="Studio Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                        📁 Upload
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                        💾 Export
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 ml-2 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-all"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Tools */}
                <div className="w-16 bg-[#0a1222] border-r border-slate-700 flex flex-col items-center py-4 gap-2 shrink-0">
                    {[
                        { id: 'select' as Tool, icon: '↖️', title: 'Select' },
                        { id: 'brush' as Tool, icon: '🖌️', title: 'Brush' },
                        { id: 'eraser' as Tool, icon: '🧹', title: 'Eraser' },
                        { id: 'crop' as Tool, icon: '✂️', title: 'Crop' },
                        { id: 'text' as Tool, icon: '🔤', title: 'Text' }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => handleToolSelect(t.id)}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${tool === t.id ? 'bg-cyan-600 scale-110' : 'bg-slate-800 hover:bg-slate-700'
                                }`}
                            title={t.title}
                        >
                            <span className="text-xl">{t.icon}</span>
                        </button>
                    ))}
                </div>

                {/* Canvas Area */}
                <div className="flex-1 flex flex-col bg-[#1a1a1a] overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-3 bg-[#0a1222]/80 border-b border-slate-700 flex items-center gap-4 shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 uppercase">Zoom:</span>
                            <button onClick={() => setZoom(Math.max(25, zoom - 25))} className="p-1 bg-slate-800 hover:bg-slate-700 rounded">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                            </button>
                            <span className="text-xs text-cyan-400 w-12 text-center">{zoom}%</span>
                            <button onClick={() => setZoom(Math.min(400, zoom + 25))} className="p-1 bg-slate-800 hover:bg-slate-700 rounded">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>

                        <div className="h-6 w-px bg-slate-700"></div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 uppercase">Transform:</span>
                            <button onClick={() => handleRotate(90)} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs">↻ 90°</button>
                            <button onClick={() => handleFlip('horizontal')} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs">↔️</button>
                            <button onClick={() => handleFlip('vertical')} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs">↕️</button>
                        </div>
                    </div>

                    {/* Canvas Area with Handlers */}
                    <div className="flex-1 flex items-center justify-center overflow-auto p-8 custom-scrollbar bg-[radial-gradient(circle_at_center,_#1a1a1f_0%,_#050505_100%)]">
                        <div
                            style={{
                                transform: `scale(${zoom / 100})`,
                                transformOrigin: 'center',
                                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 0 100px rgba(0,0,0,0.8), 0 0 20px rgba(139, 92, 246, 0.1)'
                            }}
                        >
                            <canvas
                                ref={canvasRef}
                                onMouseDown={(e) => {
                                    const pos = getMousePos(e);
                                    console.log('[CANVAS] Interaction at:', pos);
                                    // Tool execution logic would go here
                                }}
                                onMouseMove={(e) => {
                                    if (e.buttons === 1) {
                                        const pos = getMousePos(e);
                                        // Drawing logic implementation
                                    }
                                }}
                                className="border border-white/5 rounded-sm cursor-crosshair"
                                style={{ imageRendering: 'pixelated' }}
                            />
                        </div>
                    </div>

                    {isProcessing && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm font-bold text-cyan-400 uppercase tracking-widest">Processing...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar - Layers & Adjustments */}
                <div className="w-80 bg-[#0a1222] border-l border-slate-700 flex flex-col shrink-0">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-700">
                        <button
                            onClick={() => setActiveTab('layers')}
                            className={`flex-1 py-3 text-[10px] font-black uppercase transition-colors flex flex-col items-center gap-1 ${activeTab === 'layers' ? 'bg-cyan-600 text-white shadow-[inset_0_0_10px_rgba(0,0,0,0.3)]' : 'text-slate-400 hover:text-cyan-400'}`}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            Layers
                        </button>
                        <button
                            onClick={() => setActiveTab('adjust')}
                            className={`flex-1 py-3 text-[10px] font-black uppercase transition-colors flex flex-col items-center gap-1 ${activeTab === 'adjust' ? 'bg-cyan-600 text-white shadow-[inset_0_0_10px_rgba(0,0,0,0.3)]' : 'text-slate-400 hover:text-cyan-400'}`}
                        >
                            <Sliders className="w-3.5 h-3.5" />
                            Colors
                        </button>
                        <button
                            onClick={() => setActiveTab('ai')}
                            className={`flex-1 py-3 text-[10px] font-black uppercase transition-colors flex flex-col items-center gap-1 ${activeTab === 'ai' ? 'bg-purple-600 text-white shadow-[inset_0_0_10px_rgba(0,0,0,0.3)]' : 'text-slate-400 hover:text-purple-400'}`}
                        >
                            <Zap className="w-3.5 h-3.5" />
                            AI Tools
                        </button>
                    </div>

                    {/* Content Panel */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {activeTab === 'layers' && (
                            <>
                                <div className="p-3 border-b border-slate-700 flex items-center justify-between">
                                    <span className="text-xs font-black uppercase text-slate-400">Layers ({state.layers.length})</span>
                                    <button
                                        onClick={addLayer}
                                        className="p-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-all"
                                        title="Add Layer"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                    {[...state.layers].reverse().map(layer => (
                                        <div
                                            key={layer.id}
                                            onClick={() => setState(prev => ({ ...prev, activeLayerId: layer.id }))}
                                            className={`p-3 rounded-xl border cursor-pointer transition-all ${state.activeLayerId === layer.id
                                                ? 'border-cyan-500 bg-cyan-600/10'
                                                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                                                }`}
                                        >
                                            {/* Layer Item Content */}
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-bold text-cyan-50 truncate">{layer.name}</span>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }}
                                                        className="p-1 hover:bg-slate-700 rounded"
                                                        title={layer.visible ? 'Hide' : 'Show'}
                                                    >
                                                        {layer.visible ? '👁️' : '🚫'}
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                                                        className="p-1 hover:bg-red-600 rounded"
                                                        title="Delete"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] text-slate-400 uppercase w-16">Opacity</span>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="1"
                                                        step="0.01"
                                                        value={layer.opacity}
                                                        onChange={(e) => updateLayer(layer.id, { opacity: parseFloat(e.target.value) })}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="flex-1 accent-cyan-500"
                                                    />
                                                </div>
                                                <select
                                                    value={layer.blendMode}
                                                    onChange={(e) => updateLayer(layer.id, { blendMode: e.target.value as any })}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-cyan-400 outline-none"
                                                >
                                                    <option value="normal">Normal</option>
                                                    <option value="multiply">Multiply</option>
                                                    <option value="screen">Screen</option>
                                                    <option value="overlay">Overlay</option>
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {activeTab === 'adjust' && (
                            <div className="p-4 space-y-6">
                                {/* Adjustment sliders (placeholder for now) */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Brightness</label>
                                    <input
                                        type="range" min="-100" max="100" value={brightness}
                                        onChange={(e) => { setBrightness(parseInt(e.target.value)); handleAdjustments(); }}
                                        className="w-full accent-cyan-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Contrast</label>
                                    <input
                                        type="range" min="-100" max="100" value={contrast}
                                        onChange={(e) => { setContrast(parseInt(e.target.value)); handleAdjustments(); }}
                                        className="w-full accent-cyan-500"
                                    />
                                </div>
                                <div className="pt-4 border-t border-slate-700">
                                    <span className="text-xs font-black uppercase text-slate-400 block mb-2">Filters</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'grayscale', label: 'Grayscale' },
                                            { id: 'sepia', label: 'Sepia' },
                                            { id: 'invert', label: 'Invert' },
                                            { id: 'blur', label: 'Blur' },
                                            { id: 'sharpen', label: 'Sharpen' }
                                        ].map(f => (
                                            <button
                                                key={f.id}
                                                onClick={() => handleFilter(f.id as any)}
                                                disabled={!state.activeLayerId || isProcessing}
                                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-xs font-bold transition-all"
                                            >
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ai' && (
                            <div className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <span className="text-xs font-black uppercase text-slate-400">Computer Vision</span>
                                    <button
                                        onClick={handleDetectObjects}
                                        disabled={!state.activeLayerId || isProcessing}
                                        className="w-full px-3 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-xs font-black uppercase transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>👁️</span> Detect Objects
                                    </button>

                                    {analysisResults.length > 0 && (
                                        <div className="mt-2 space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                                            {analysisResults.map((res, i) => (
                                                <div key={i} className="flex items-center justify-between text-[10px] bg-slate-800/50 p-1.5 rounded border border-slate-700/50">
                                                    <span className="capitalize text-slate-200">{res.label}</span>
                                                    <span className="text-purple-400 font-bold">{Math.round(res.score * 100)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                                        <span className="text-xs font-black text-purple-400 uppercase tracking-widest">Workers AI</span>
                                    </div>

                                    <button
                                        onClick={handleRemoveBackground}
                                        disabled={!state.activeLayerId || isProcessing}
                                        className="w-full px-3 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-xs font-black uppercase transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>🪄</span> Remove Background
                                    </button>

                                    <button
                                        onClick={handleEnhance}
                                        disabled={!state.activeLayerId || isProcessing}
                                        className="w-full px-3 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-xs font-black uppercase transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>✨</span> Auto Enhance
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-xs font-black uppercase text-slate-400">Upscaling</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => handleUpscale(2)}
                                            disabled={!state.activeLayerId || isProcessing}
                                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-xs font-bold transition-all"
                                        >
                                            Upscale 2x
                                        </button>
                                        <button
                                            onClick={() => handleUpscale(4)}
                                            disabled={!state.activeLayerId || isProcessing}
                                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-xs font-bold transition-all"
                                        >
                                            Upscale 4x
                                        </button>
                                    </div>
                                </div>

                                <div className="p-3 border-t border-slate-700 mt-4 space-y-3">
                                    <span className="text-xs font-black uppercase text-purple-400">FLUX-1 Turbo</span>
                                    <textarea
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        placeholder="Describe the image you want to generate..."
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-cyan-50 h-20 outline-none focus:border-purple-500 transition-all"
                                    />
                                    <button
                                        onClick={handleGenerateAI}
                                        disabled={isProcessing || !aiPrompt.trim()}
                                        className="w-full px-3 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-xs font-black uppercase transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>🚀</span> Generate Asset
                                    </button>
                                </div>

                                <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-xl">
                                    <p className="text-[10px] text-slate-400 leading-relaxed">
                                        AI operations process safely on Cloudflare Workers. Your image data is handled privately.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageStudio;
