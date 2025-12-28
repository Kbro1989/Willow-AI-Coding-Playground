
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
        try {
            const WORKER_URL = 'https://ai-game-studio.kristain33rs.workers.dev';
            const response = await fetch(`${WORKER_URL}/api/speech`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voiceId })
            });

            if (!response.ok) {
                throw new Error(`Speech synthesis failed: ${response.status}`);
            }

            const blob = await response.blob();
            const clipId = `clip-${Date.now()}`;
            this.generatedClips.set(clipId, blob);
            console.log(`[VoiceService] Generated real-time clip ${clipId}`);
            return blob;
        } catch (error) {
            console.error("[VoiceService] Synthesis Failed, falling back to local SpeechSynthesis", error);
            return this.synthesizeLocal(text, voiceId);
        }
    }

    /**
     * Fallback to browser SpeechSynthesis
     */
    private async synthesizeLocal(text: string, voiceId: string): Promise<Blob> {
        return new Promise((resolve, reject) => {
            const preset = MOCK_VOICES.find(v => v.id === voiceId) || MOCK_VOICES[0];
            const utter = new SpeechSynthesisUtterance(text);
            utter.pitch = preset.pitch;
            utter.rate = preset.rate;

            const systemVoices = this.synthesis.getVoices();
            const targetVoice = systemVoices.find(v => v.name.includes("Google") || v.lang.startsWith("en")) || systemVoices[0];
            if (targetVoice) utter.voice = targetVoice;

            utter.onend = () => {
                const estimatedDuration = text.length * 0.1;
                const mockBlob = this.createMockWav(estimatedDuration);
                resolve(mockBlob);
            };

            utter.onerror = (e) => reject(e);
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
