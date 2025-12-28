
import React, { useState, useEffect } from 'react';
import { VoiceService, VoicePreset, MOCK_VOICES } from '../../voice/voiceService';
import { Play, Download, Trash, RefreshCw } from 'lucide-react';

export const AudioClipManager: React.FC = () => {
    const [text, setText] = useState("");
    const [selectedVoice, setSelectedVoice] = useState<string>(MOCK_VOICES[0].id);
    const [clips, setClips] = useState<{ id: string, text: string, blob: Blob, url: string }[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [voices, setVoices] = useState<VoicePreset[]>([]);

    useEffect(() => {
        VoiceService.getInstance().getVoices().then(setVoices);
    }, []);

    const handleGenerate = async () => {
        if (!text) return;
        setIsGenerating(true);
        try {
            const blob = await VoiceService.getInstance().synthesize(text, selectedVoice);
            const url = URL.createObjectURL(blob);
            setClips(prev => [{
                id: `clip-${Date.now()}`,
                text: text,
                blob: blob,
                url: url
            }, ...prev]);
        } catch (e) {
            console.error(e);
            alert("Failed to generate clip");
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePlay = (url: string) => {
        const audio = new Audio(url);
        audio.play();
    };

    const handleDelete = (id: string, url: string) => {
        URL.revokeObjectURL(url);
        setClips(prev => prev.filter(c => c.id !== id));
    };

    // Helper to get voice name
    const getVoiceName = (id: string) => voices.find(v => v.id === id)?.name || id;

    return (
        <div className="h-full flex flex-col p-4 bg-[#1e1e1e] text-white overflow-hidden">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-blue-400">Voice Synthesis</span> Studio
            </h2>

            {/* Input Section */}
            <div className="bg-[#2d2d2d] p-4 rounded-lg shadow-lg mb-4 flex flex-col gap-3">
                <div className="flex gap-2">
                    <select
                        className="bg-[#3d3d3d] border border-[#555] rounded px-3 py-2 flex-grow focus:outline-none focus:border-blue-500"
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                    >
                        {voices.map(voice => (
                            <option key={voice.id} value={voice.id}>
                                {voice.name} ({voice.category})
                            </option>
                        ))}
                    </select>
                </div>

                <textarea
                    className="bg-[#1a1a1a] p-3 rounded border border-[#444] min-h-[100px] resize-none focus:outline-none focus:border-blue-500"
                    placeholder="Enter dialogue here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />

                <div className="flex justify-end">
                    <button
                        className={`px-6 py-2 rounded font-bold flex items-center gap-2 transition-colors ${isGenerating
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-500'
                            }`}
                        onClick={handleGenerate}
                        disabled={isGenerating || !text.trim()}
                    >
                        {isGenerating ? (
                            <><RefreshCw className="animate-spin w-4 h-4" /> Generating...</>
                        ) : (
                            <><Play className="w-4 h-4" /> Generate Clip</>
                        )}
                    </button>
                </div>
            </div>

            {/* Clips List */}
            <div className="flex-grow overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Generated Clips</h3>
                <div className="flex flex-col gap-2">
                    {clips.length === 0 && (
                        <div className="text-center text-gray-500 py-8 italic">
                            No clips generated yet. Start typing above!
                        </div>
                    )}
                    {clips.map(clip => (
                        <div key={clip.id} className="bg-[#252525] p-3 rounded border border-[#333] flex items-center justify-between hover:border-[#555] transition-colors group">
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate w-[200px] text-white" title={clip.text}>"{clip.text}"</p>
                                <p className="text-xs text-gray-400">
                                    {getVoiceName(selectedVoice)} • {(clip.blob.size / 1024).toFixed(1)} KB
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    className="p-2 rounded-full hover:bg-[#444] text-green-400"
                                    onClick={() => handlePlay(clip.url)}
                                    title="Play Preview"
                                >
                                    <Play className="w-4 h-4" />
                                </button>
                                <a
                                    href={clip.url}
                                    download={`voice_clip_${clip.id}.wav`}
                                    className="p-2 rounded-full hover:bg-[#444] text-blue-400"
                                    title="Download WAV"
                                >
                                    <Download className="w-4 h-4" />
                                </a>
                                <button
                                    className="p-2 rounded-full hover:bg-[#444] text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDelete(clip.id, clip.url)}
                                    title="Delete"
                                >
                                    <Trash className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
