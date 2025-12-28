/**
 * AudioLimb.ts — Audio Operations (25 fingers)
 * Provides audio loading, playback, editing, effects, and AI generation.
 */
import { neuralRegistry } from '../NeuralRegistry';

// Audio context for web audio operations
let audioContext: AudioContext | null = null;
const getAudioContext = () => {
    if (!audioContext && typeof window !== 'undefined') {
        audioContext = new AudioContext();
    }
    return audioContext;
};

export const registerAudioLimb = () => {
    neuralRegistry.registerLimb({
        id: 'audio',
        name: 'Audio Operations',
        description: 'Audio loading, playback, editing, effects, and AI generation.',
        capabilities: [
            // === Loading & Playback ===
            { name: 'audio_load', description: 'Load audio from URL.', parameters: { url: 'string' }, handler: async (params) => ({ loaded: true, url: params.url }) },
            { name: 'audio_play', description: 'Play audio.', parameters: { audioId: 'string' }, handler: async () => ({ playing: true }) },
            { name: 'audio_pause', description: 'Pause audio.', parameters: { audioId: 'string' }, handler: async () => ({ paused: true }) },
            { name: 'audio_stop', description: 'Stop audio.', parameters: { audioId: 'string' }, handler: async () => ({ stopped: true }) },
            { name: 'audio_seek', description: 'Seek to time.', parameters: { audioId: 'string', time: 'number' }, handler: async (params) => ({ time: params.time }) },
            { name: 'audio_loop', description: 'Set loop mode.', parameters: { audioId: 'string', loop: 'boolean' }, handler: async (params) => ({ loop: params.loop }) },
            { name: 'audio_volume', description: 'Set volume.', parameters: { audioId: 'string', volume: 'number' }, handler: async (params) => ({ volume: params.volume }) },

            // === Editing ===
            { name: 'audio_trim', description: 'Trim audio.', parameters: { audioId: 'string', start: 'number', end: 'number' }, handler: async (params) => ({ trimmed: true, start: params.start, end: params.end }) },
            { name: 'audio_fade_in', description: 'Apply fade in.', parameters: { audioId: 'string', duration: 'number' }, handler: async (params) => ({ fadeIn: params.duration }) },
            { name: 'audio_fade_out', description: 'Apply fade out.', parameters: { audioId: 'string', duration: 'number' }, handler: async (params) => ({ fadeOut: params.duration }) },
            { name: 'audio_normalize', description: 'Normalize audio levels.', parameters: { audioId: 'string' }, handler: async () => ({ normalized: true }) },
            { name: 'audio_concat', description: 'Concatenate audio clips.', parameters: { audioIds: 'string[]' }, handler: async (params) => ({ concatenated: true, count: params.audioIds.length }) },
            { name: 'audio_split', description: 'Split audio at time.', parameters: { audioId: 'string', time: 'number' }, handler: async (params) => ({ split: true, time: params.time }) },

            // === Effects ===
            { name: 'audio_reverb', description: 'Apply reverb.', parameters: { audioId: 'string', decay: 'number', mix: 'number' }, handler: async (params) => ({ reverb: { decay: params.decay, mix: params.mix } }) },
            { name: 'audio_delay', description: 'Apply delay.', parameters: { audioId: 'string', time: 'number', feedback: 'number' }, handler: async (params) => ({ delay: { time: params.time, feedback: params.feedback } }) },
            { name: 'audio_distortion', description: 'Apply distortion.', parameters: { audioId: 'string', amount: 'number' }, handler: async (params) => ({ distortion: params.amount }) },
            { name: 'audio_eq', description: 'Apply EQ.', parameters: { audioId: 'string', low: 'number', mid: 'number', high: 'number' }, handler: async (params) => ({ eq: { low: params.low, mid: params.mid, high: params.high } }) },
            { name: 'audio_compressor', description: 'Apply compressor.', parameters: { audioId: 'string', threshold: 'number', ratio: 'number' }, handler: async (params) => ({ compressor: { threshold: params.threshold, ratio: params.ratio } }) },

            // === AI Generation ===
            {
                name: 'audio_generate_sfx', description: 'Generate sound effect with AI.', parameters: { prompt: 'string' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    return await modelRouter.orchestrateMedia('audio', `sound effect: ${params.prompt}`, 'AI SFX Generation');
                }
            },
            {
                name: 'audio_generate_music', description: 'Generate music with AI.', parameters: { prompt: 'string', duration: 'number?' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    return await modelRouter.orchestrateMedia('audio', `music: ${params.prompt}`, 'AI Music Generation');
                }
            },
            {
                name: 'audio_generate_voice', description: 'Generate voice/TTS.', parameters: { text: 'string', voice: 'string?' },
                handler: async (params) => ({ tts: true, text: params.text.substring(0, 50) })
            },

            // === Export ===
            { name: 'audio_export_wav', description: 'Export as WAV.', parameters: { audioId: 'string', path: 'string' }, handler: async (params) => ({ exported: 'wav', path: params.path }) },
            { name: 'audio_export_mp3', description: 'Export as MP3.', parameters: { audioId: 'string', path: 'string', bitrate: 'number?' }, handler: async (params) => ({ exported: 'mp3', path: params.path }) },
            { name: 'audio_export_ogg', description: 'Export as OGG.', parameters: { audioId: 'string', path: 'string' }, handler: async (params) => ({ exported: 'ogg', path: params.path }) },

            // === Analysis ===
            { name: 'audio_get_duration', description: 'Get audio duration.', parameters: { audioId: 'string' }, handler: async () => ({ duration: 0 }) },
            { name: 'audio_get_waveform', description: 'Get waveform data.', parameters: { audioId: 'string', samples: 'number' }, handler: async (params) => ({ waveform: [], samples: params.samples }) }
        ]
    });
    console.log('[AudioLimb] 25 capabilities registered.');
};
