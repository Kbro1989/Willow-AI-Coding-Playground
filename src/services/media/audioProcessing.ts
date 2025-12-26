/**
 * Audio Processing Service
 * Wrapper around modelRouter for Audio operations (STT, TTS, Logic)
 */
import { route, ModelResponse } from '../modelRouter';

export interface TranscriptionResult {
    text: string;
    confidence?: number;
}

export interface SpeechResult {
    audioUrl: string; // Blob URL or base64 data URI
    duration?: number;
}

const audioProcessing = {
    /**
     * Transcribe audio to text
     * @param audioBase64 Base64 encoded audio data (webm/wav)
     */
    async transcribe(audioBase64: string): Promise<TranscriptionResult> {
        console.log('[MediaService] Transcribing Audio...');
        try {
            const response = await route({
                type: 'audio',
                prompt: audioBase64.replace(/^data:audio\/\w+;base64,/, ''), // Strip prefix if present
                options: { audioMode: 'stt' }
            });

            if (response instanceof ReadableStream) {
                throw new Error('Streaming not supported for transcription');
            }

            const res = response as ModelResponse;
            return {
                text: res.content || '',
            };
        } catch (error) {
            console.error('[MediaService] Transcription Failed:', error);
            throw error;
        }
    },

    /**
     * Synthesize text to speech
     * @param text Text to speak
     */
    async synthesize(text: string): Promise<SpeechResult> {
        console.log('[MediaService] Synthesizing Speech...');
        try {
            const response = await route({
                type: 'audio',
                prompt: text,
                options: { audioMode: 'tts' }
            });

            if (response instanceof ReadableStream) {
                throw new Error('Streaming not supported for speech synthesis');
            }

            const res = response as ModelResponse;

            // Response might have audioUrl directly (Gemini Native) or content as base64 (Cloudflare)
            if (res.audioUrl) {
                return { audioUrl: res.audioUrl };
            }

            if (!res.content) throw new Error('No audio content returned');

            // Check if it already has data URI prefix
            const audioData = res.content.startsWith('data:')
                ? res.content
                : `data:audio/mp3;base64,${res.content}`;

            return {
                audioUrl: audioData
            };
        } catch (error) {
            console.error('[MediaService] Synthesis Failed:', error);
            throw error;
        }
    },

    /**
     * Compose Music (Future / Gemini VEO Audio?)
     * For now, returns a placeholder or routes to "audio" with prompt
     */
    async generateMusic(prompt: string): Promise<SpeechResult> {
        // Placeholder: In real implementation this might use a different model
        // or the same 'audio' type with a different prompt structure.
        // Cloudflare doesn't have music gen yet (AudioLDM is usually heavy).
        // We'll fallback to Gemini (if available) or mockup.
        throw new Error('Music Generation not yet supported by current backend configuration.');
    }

};

export default audioProcessing;
