
import { Buffer } from "buffer";

export type VoicePreset = {
    id: string;
    name: string;
    category: "character" | "narration" | "effect";
    pitch: number;
    rate: number;
    description: string;
};

export const MOCK_VOICES: VoicePreset[] = [
    { id: "narrator-depths", name: "Narrator (Deep)", category: "narration", pitch: 0.8, rate: 0.9, description: "Deep, resonant narration voice." },
    { id: "goblin-scout", name: "Goblin Scout", category: "character", pitch: 1.5, rate: 1.2, description: "High-pitched, skittish goblin." },
    { id: "knight-captain", name: "Knight Captain", category: "character", pitch: 0.6, rate: 0.8, description: "Authoritative, commanding tone." },
    { id: "mystic-seer", name: "Mystic Seer", category: "character", pitch: 1.2, rate: 0.7, description: "Ethereal, slow-paced whisper." },
    { id: "system-ai", name: "System AI", category: "effect", pitch: 1.0, rate: 1.0, description: "Standard synthetic AI voice." },
];

export class VoiceService {
    private static instance: VoiceService;
    private synthesis: SpeechSynthesis;
    private generatedClips: Map<string, Blob> = new Map();

    private constructor() {
        this.synthesis = window.speechSynthesis;
    }

    static getInstance(): VoiceService {
        if (!VoiceService.instance) {
            VoiceService.instance = new VoiceService();
        }
        return VoiceService.instance;
    }

    async getVoices(): Promise<VoicePreset[]> {
        return MOCK_VOICES;
    }

    /**
     * Mocks an API call to ElevenLabs or similar service.
     * In reality, uses browser SpeechSynthesis and records it to a Blob (simulated).
     */
    async synthesize(text: string, voiceId: string): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const preset = MOCK_VOICES.find(v => v.id === voiceId) || MOCK_VOICES[0];

            // Since we can't easily record SpeechSynthesis output to a Blob in a pure browser mock without MediaStreamDestination shenanigans (which are flaky),
            // we will simulate the "network delay" and return a dummy Blob or try to use a basic oscillator "glitch" noise if text is short, 
            // BUT for a "Voice Service" UI, users usually want to HEAR it.
            // A better mock approach for "Clip Generation" that results in a file is to use the Web Audio API to render an AudioBuffer.
            // However, SpeechSynthesis is audio-only output.

            // Strategy: We will play the audio using SpeechSynthesis for immediate feedback,
            // but the "Blob" returned will be a placeholder WAV generated via Web Audio API 
            // that roughly matches the duration, so it can be "saved" and "dragged".

            const utter = new SpeechSynthesisUtterance(text);
            utter.pitch = preset.pitch;
            utter.rate = preset.rate;

            // Try to pick a voice that matches
            const systemVoices = this.synthesis.getVoices();
            // Simple heuristic to pick a gender/style if possible, otherwise default
            const targetVoice = systemVoices.find(v => v.name.includes("Google") || v.lang.startsWith("en")) || systemVoices[0];
            if (targetVoice) utter.voice = targetVoice;

            // We'll use the 'end' event to resolve the blob, acting like "downloading"
            utter.onend = () => {
                // Generate a mock WAV blob of silence/beep with duration roughly estimated
                const estimatedDuration = text.length * 0.1; // coarse estimate
                const mockBlob = this.createMockWav(estimatedDuration);
                const clipId = `clip-${Date.now()}`;
                this.generatedClips.set(clipId, mockBlob);
                console.log(`[VoiceService] Generated clip ${clipId} for text: "${text.substring(0, 20)}..."`);
                resolve(mockBlob);
            };

            utter.onerror = (e) => {
                console.error("Speech synthesis error", e);
                reject(e);
            };

            // Speak it immediately (Preview)
            this.synthesis.speak(utter);
        });
    }

    /**
     * Creates a dummy WAV file (mostly silence/noise) just to have a valid file object to pass around.
     */
    private createMockWav(durationSeconds: number): Blob {
        const sampleRate = 44100;
        const numFrames = durationSeconds * sampleRate;
        const numChannels = 1;
        const bytesPerSample = 2;
        const blockAlign = numChannels * bytesPerSample;
        const byteRate = sampleRate * blockAlign;
        const dataSize = numFrames * blockAlign;

        const buffer = new ArrayBuffer(44 + dataSize);
        const view = new DataView(buffer);

        // RIFF chunk
        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataSize, true);
        this.writeString(view, 8, 'WAVE');

        // fmt chunk
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true); // Subchunk1Size
        view.setUint16(20, 1, true); // AudioFormat (PCM)
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, 16, true); // BitsPerSample

        // data chunk
        this.writeString(view, 36, 'data');
        view.setUint32(40, dataSize, true);

        // Write dummy data (sine wave beep for first 0.5s, then silence)
        const offset = 44;
        for (let i = 0; i < numFrames; i++) {
            let sample = 0;
            if (i < sampleRate * 0.5) {
                // 440Hz beep
                sample = Math.sin(2 * Math.PI * i * 440 / sampleRate) * 0x3FFF;
            }
            view.setInt16(offset + i * 2, sample, true);
        }

        return new Blob([view], { type: "audio/wav" });
    }

    private writeString(view: DataView, offset: number, string: string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }
}
