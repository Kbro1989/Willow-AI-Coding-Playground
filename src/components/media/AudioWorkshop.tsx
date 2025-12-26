import React, { useState, useRef } from 'react';
import { Mic, Play, Square, Download, Music, Volume2, Wand2, Activity, Settings } from 'lucide-react';
import audioProcessing from '../../services/media/audioProcessing';
import { forgeMedia } from '../../services/forgeMediaService';

const AudioWorkshop: React.FC = () => {
    // Modes: 'recorder' | 'tts'
    const [activeMode, setActiveMode] = useState<'recorder' | 'tts'>('recorder');

    // Recorder State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // TTS State
    const [ttsText, setTtsText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Playback / Result State
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [transcription, setTranscription] = useState<string | null>(null);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    const [showSettings, setShowSettings] = useState(false);

    // --- Recorder Logic ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);

                // Auto-transcribe?
                handleTranscribe(audioBlob);

                // Cleanup stream
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Microphone access denied or not available.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleTranscribe = async (blob: Blob) => {
        setTranscription('Transcribing...');
        try {
            const { routeNexus } = await import('../../backend/routeToModel');

            // Convert blob to base64 for the router
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64data = reader.result as string;
                const response = await routeNexus({
                    type: 'audio',
                    prompt: base64data,
                    options: { audioMode: 'stt' }
                });

                if (!(response instanceof ReadableStream)) {
                    setTranscription(response.content || 'Transcription failed.');
                }
            };
        } catch (error) {
            console.error('Transcription failed:', error);
            setTranscription('Transcription failed.');
        }
    };

    // --- TTS Logic ---
    const handleTTS = async () => {
        if (!ttsText.trim()) return;
        setIsGenerating(true);
        try {
            const { routeNexus } = await import('../../backend/routeToModel');
            const response = await routeNexus({
                type: 'audio',
                prompt: ttsText,
                options: { audioMode: 'tts' }
            });

            if (!(response instanceof ReadableStream)) {
                const finalAudioUrl = (response as any).audioUrl || `data:audio/mpeg;base64,${response.content}`;
                setAudioUrl(finalAudioUrl);
                setTranscription(ttsText);

                // Register with Forge Media
                forgeMedia.addAsset({
                    type: 'audio',
                    url: finalAudioUrl,
                    prompt: ttsText,
                    model: response.model,
                    tags: ['ai-generated', 'audio-workshop']
                });
            }
        } catch (error) {
            console.error('TTS failed:', error);
            alert('Failed to generate speech.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const url = URL.createObjectURL(file);
            setAudioUrl(url);

            // Auto-transcribeuploaded audio
            handleTranscribe(file);
        } catch (error) {
            console.error('[AUDIO_WORKSHOP] Upload error:', error);
            alert('Failed to process audio upload');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#0f1115] text-white">
            {/* Header */}
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-[#1a1d24]">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    <span className="font-semibold text-sm">Audio Workshop</span>

                    <div className="flex items-center gap-1 ml-4 border-l border-white/10 pl-4">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={`p-1.5 hover:bg-white/10 rounded-lg transition-all ${showSettings ? 'text-purple-400 bg-white/10' : 'text-white/40'}`}
                            title="Workshop Settings"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                        {showSettings && (
                            <div className="absolute top-16 right-4 w-64 bg-[#1a1d24] border border-white/10 rounded-xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                                <h4 className="text-xs font-black uppercase text-purple-400 mb-3 block">Engine Configuration</h4>
                                <div className="space-y-2 text-[10px] text-zinc-400">
                                    <div className="flex justify-between"><span>Model</span> <span className="text-white">Whisper v3 Large</span></div>
                                    <div className="flex justify-between"><span>Sample Rate</span> <span className="text-white">48kHz</span></div>
                                    <div className="flex justify-between"><span>Bitrate</span> <span className="text-white">320kbps</span></div>
                                    <div className="flex justify-between"><span>Latency</span> <span className="text-emerald-400">Low (12ms)</span></div>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all"
                        >
                            📁 Upload
                        </button>
                    </div>
                </div>

                {/* Mode Switcher */}
                <div className="flex bg-black/20 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveMode('recorder')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeMode === 'recorder' ? 'bg-purple-500/20 text-purple-300 shadow-sm' : 'text-white/40 hover:text-white/60'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Mic className="w-3.5 h-3.5" />
                            Recorder
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveMode('tts')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeMode === 'tts' ? 'bg-blue-500/20 text-blue-300 shadow-sm' : 'text-white/40 hover:text-white/60'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Wand2 className="w-3.5 h-3.5" />
                            AI Voice Gen
                        </div>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                {/* Left Panel: Input Area */}
                <div className="flex-1 p-6 flex flex-col items-center justify-center relative border-r border-white/5 bg-gradient-to-b from-[#13151a] to-[#0f1115]">

                    {activeMode === 'recorder' ? (
                        <div className="text-center space-y-8">
                            <div className={`relative w-48 h-48 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${isRecording ? 'border-red-500/50 bg-red-500/10 shadow-[0_0_50px_rgba(239,68,68,0.2)]' : 'border-white/10 bg-white/5'}`}>
                                <Mic className={`w-16 h-16 ${isRecording ? 'text-red-400 animate-pulse' : 'text-white/20'}`} />
                                {isRecording && (
                                    <div className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-ping opacity-20"></div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="text-2xl font-mono text-white/80 tabular-nums">
                                    {isRecording ? "Recording..." : "Ready to Record"}
                                </div>

                                <button
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={`px-8 py-3 rounded-full font-semibold flex items-center justify-center gap-2 mx-auto transition-all ${isRecording
                                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                                        : 'bg-white text-black hover:bg-gray-200'
                                        }`}
                                >
                                    {isRecording ? (
                                        <><Square className="w-4 h-4 fill-current" /> Stop Recording</>
                                    ) : (
                                        <><Mic className="w-4 h-4" /> Start Recording</>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full max-w-2xl flex flex-col h-full py-4 space-y-4">
                            <div>
                                <label className="nexus-label">Vocal Synthesis Script</label>
                                <textarea
                                    className="nexus-textarea w-full h-64 font-sans text-lg leading-relaxed"
                                    placeholder="Type something amazing for the AI to say..."
                                    value={ttsText}
                                    onChange={(e) => setTtsText(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={handleTTS}
                                    disabled={isGenerating || !ttsText.trim()}
                                    className="nexus-btn-accent px-8 py-3 font-black uppercase tracking-widest flex items-center gap-3"
                                >
                                    {isGenerating ? (
                                        <Activity className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Wand2 className="w-4 h-4" />
                                    )}
                                    {isGenerating ? 'Synthesizing Audio...' : 'Manifest Speech'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Results & Timeline (Mini) */}
                {(audioUrl || transcription) && (
                    <div className="md:w-96 bg-[#13151a] border-l border-white/10 flex flex-col">
                        <div className="p-4 border-b border-white/10 font-medium text-xs text-white/40 uppercase tracking-wider">
                            Result
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {/* Audio Player */}
                            {audioUrl && (
                                <div className="bg-[#1a1d24] rounded-xl p-4 border border-white/5">
                                    <div className="flex items-center gap-2 mb-3 text-purple-300 text-sm font-medium">
                                        <Volume2 className="w-4 h-4" />
                                        Audio Preview
                                    </div>
                                    <audio
                                        ref={audioPlayerRef}
                                        src={audioUrl}
                                        controls
                                        className="w-full h-8"
                                    />
                                    <button
                                        className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/60 transition-colors"
                                        onClick={() => {
                                            const a = document.createElement('a');
                                            a.href = audioUrl;
                                            a.download = `audio-${Date.now()}.webm`;
                                            a.click();
                                        }}
                                    >
                                        <Download className="w-3 h-3" /> Download Audio
                                    </button>
                                </div>
                            )}

                            {/* Transcription / Script */}
                            <div className="bg-[#1a1d24] rounded-xl p-4 border border-white/5 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-3 text-blue-300 text-sm font-medium">
                                    <span className="opacity-70">Script / Transcription</span>
                                </div>
                                <div className="flex-1 p-3 bg-black/20 rounded-lg text-sm text-white/70 leading-relaxed overflow-y-auto max-h-[300px] whitespace-pre-wrap font-mono">
                                    {transcription || "..."}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AudioWorkshop;
