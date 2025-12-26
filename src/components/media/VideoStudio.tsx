
import React, { useState } from 'react';
import { videoProcessing } from '../../services/media/videoProcessing';
import { forgeMedia } from '../../services/forgeMediaService';
import { Film, Play, Settings, Save, AlertCircle, Loader } from 'lucide-react';

const STYLES = [
    { id: 'cinematic', label: 'Cinematic' },
    { id: 'anime', label: 'Anime' },
    { id: 'claymation', label: 'Claymation' },
    { id: 'pixel', label: 'Pixel Art' },
];

const RATIOS = [
    { id: '16:9', label: '16:9' },
    { id: '9:16', label: '9:16' },
    { id: '1:1', label: 'Square' },
];

export const VideoStudio: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState('cinematic');
    const [selectedRatio, setSelectedRatio] = useState('16:9');
    const [isGenerating, setIsGenerating] = useState(false);
    const [resultVideo, setResultVideo] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [generationTime, setGenerationTime] = useState(0);

    const handleSettings = () => {
        alert('Cinematic Synthesis Settings: FPS: 24, Motion: 5.0, Bucket: 127');
    };

    const handleSave = () => {
        if (!resultVideo) return;
        const link = document.createElement('a');
        link.href = resultVideo;
        link.download = `cinematic-${Date.now()}.mp4`;
        link.click();
        console.log('[VIDEO] Sequence exported to disk');
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setError(null);
        setResultVideo(null);
        const start = Date.now();

        try {
            // Rule #2: No direct AI calls. Routing through Nexus backend.
            const { routeNexus } = await import('../../backend/routeToModel');
            const response = await routeNexus({
                type: 'video',
                prompt: `${prompt}. Style: ${selectedStyle}`
            });

            if (response instanceof ReadableStream) {
                throw new Error('Streaming not supported for video generation');
            }

            const finalVideoUrl = (response as any).videoUrl || response.imageUrl || null;
            setResultVideo(finalVideoUrl);
            setGenerationTime(Date.now() - start);

            if (finalVideoUrl) {
                forgeMedia.addAsset({
                    type: 'video',
                    url: finalVideoUrl,
                    prompt: prompt,
                    model: response.model,
                    tags: ['ai-generated', 'video-studio', selectedStyle]
                });
            }
        } catch (err: any) {
            setError(err.message || 'Video generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black text-white overflow-hidden font-sans">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
                <div className="flex items-center space-x-3">
                    <Film className="w-6 h-6 text-purple-500" />
                    <h2 className="text-xl font-bold tracking-tight">Cinematic Logic</h2>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={handleSettings}
                        className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <Settings className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Controls */}
                <div className="w-80 bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col space-y-6 overflow-y-auto">

                    {/* Visual Style */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Visual Style</label>
                        <div className="grid grid-cols-2 gap-2">
                            {STYLES.map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => setSelectedStyle(style.id)}
                                    className={`p-3 text-sm rounded-lg border text-left transition-all ${selectedStyle === style.id
                                        ? 'bg-purple-900/30 border-purple-500/50 text-purple-200'
                                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-750'
                                        }`}
                                >
                                    {style.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Aspect Ratio */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Frame Ratio</label>
                        <div className="flex space-x-2 bg-zinc-800 p-1 rounded-lg">
                            {RATIOS.map(ratio => (
                                <button
                                    key={ratio.id}
                                    onClick={() => setSelectedRatio(ratio.id)}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${selectedRatio === ratio.id
                                        ? 'bg-zinc-600 text-white shadow-sm'
                                        : 'text-zinc-400 hover:text-zinc-200'
                                        }`}
                                >
                                    {ratio.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Prompt Input */}
                    <div className="space-y-3 flex-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Director's Script</label>
                        <textarea
                            className="w-full h-40 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none placeholder-zinc-600"
                            placeholder="Describe the scene in detail...&#10;e.g., A cyberpunk street during rain, neon reflections, cinematic lighting"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>

                    <button
                        disabled={isGenerating || !prompt}
                        onClick={handleGenerate}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all ${isGenerating
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/20'
                            }`}
                    >
                        {isGenerating ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                <span>Rendering Frame...</span>
                            </>
                        ) : (
                            <>
                                <Play className="w-5 h-5 fill-current" />
                                <span>Generate Sequence</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Main Preview Area */}
                <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center relative p-8">

                    {error && (
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-red-900/80 border border-red-500/50 text-red-200 px-6 py-3 rounded-full flex items-center space-x-2 backdrop-blur-sm">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className={`relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl transition-all border border-zinc-800 bg-zinc-900 flex items-center justify-center group ${isGenerating ? 'animate-pulse' : ''}`}>

                        {resultVideo ? (
                            <video
                                src={resultVideo}
                                controls
                                autoPlay
                                loop
                                className="w-full h-full object-contain bg-black"
                            />
                        ) : (
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <Film className="w-8 h-8 text-zinc-600 group-hover:text-purple-500 transition-colors" />
                                </div>
                                <h3 className="text-zinc-500 font-medium">Ready to Simulate</h3>
                                <p className="text-zinc-600 text-sm max-w-md">Enter a prompt to generate a 2-4 second cinematic loop using AI video synthesis.</p>
                            </div>
                        )}

                        {/* Save Overlay (Only if result exists) */}
                        {resultVideo && (
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={handleSave}
                                    className="bg-black/50 hover:bg-black/70 backdrop-blur-md p-2 rounded-lg text-white border border-white/10"
                                >
                                    <Save className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                    </div>

                    {/* Footer Info */}
                    {resultVideo && (
                        <div className="mt-6 flex items-center space-x-6 text-zinc-500 text-sm">
                            <span>Time: {(generationTime / 1000).toFixed(1)}s</span>
                            <span>Res: 1024x576</span>
                            <span>Model: SVD-XT</span>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
