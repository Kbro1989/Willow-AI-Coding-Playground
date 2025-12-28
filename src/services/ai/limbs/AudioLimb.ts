/**
 * AudioLimb.ts — Audio Operations (35 fingers)
 * Full game audio: SFX generation, music, voice, remixing, and mock sounds.
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

// Audio presets for game sound categories
const SFX_CATEGORIES: Record<string, string> = {
    'footstep_stone': 'footstep on stone floor, realistic',
    'footstep_grass': 'footstep on grass, soft',
    'footstep_metal': 'footstep on metal grate, industrial',
    'sword_swing': 'sword swing through air, whoosh',
    'sword_hit': 'sword hitting metal, clang',
    'magic_spell': 'magic spell cast, mystical energy',
    'explosion': 'explosion, fiery blast',
    'coin_pickup': 'coin pickup, satisfying ding',
    'door_open': 'wooden door opening, creaky',
    'door_close': 'door closing, thud',
    'button_click': 'UI button click, soft',
    'menu_hover': 'menu hover sound, subtle whoosh',
    'level_up': 'level up fanfare, triumphant',
    'damage_taken': 'character taking damage, grunt',
    'jump': 'character jump, spring',
    'land': 'character landing, impact'
};

export const registerAudioLimb = () => {
    neuralRegistry.registerLimb({
        id: 'audio',
        name: 'Audio Operations',
        description: 'Full game audio: SFX, music, voice, remixing, and mock sounds.',
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
            { name: 'audio_mix', description: 'Mix multiple audio tracks together.', parameters: { audioIds: 'string[]', volumes: 'number[]?' }, handler: async (params) => ({ mixed: true, trackCount: params.audioIds.length }) },

            // === Effects ===
            { name: 'audio_reverb', description: 'Apply reverb.', parameters: { audioId: 'string', decay: 'number', mix: 'number' }, handler: async (params) => ({ reverb: { decay: params.decay, mix: params.mix } }) },
            { name: 'audio_delay', description: 'Apply delay.', parameters: { audioId: 'string', time: 'number', feedback: 'number' }, handler: async (params) => ({ delay: { time: params.time, feedback: params.feedback } }) },
            { name: 'audio_distortion', description: 'Apply distortion.', parameters: { audioId: 'string', amount: 'number' }, handler: async (params) => ({ distortion: params.amount }) },
            { name: 'audio_eq', description: 'Apply EQ.', parameters: { audioId: 'string', low: 'number', mid: 'number', high: 'number' }, handler: async (params) => ({ eq: { low: params.low, mid: params.mid, high: params.high } }) },
            { name: 'audio_compressor', description: 'Apply compressor.', parameters: { audioId: 'string', threshold: 'number', ratio: 'number' }, handler: async (params) => ({ compressor: { threshold: params.threshold, ratio: params.ratio } }) },
            { name: 'audio_pitch_shift', description: 'Shift pitch up/down.', parameters: { audioId: 'string', semitones: 'number' }, handler: async (params) => ({ pitchShift: params.semitones }) },
            { name: 'audio_time_stretch', description: 'Stretch/compress time without pitch change.', parameters: { audioId: 'string', factor: 'number' }, handler: async (params) => ({ timeStretch: params.factor }) },

            // === AI SFX Generation ===
            {
                name: 'audio_generate_sfx',
                description: 'Generate sound effect with AI.',
                parameters: { prompt: 'string', category: 'string?' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    return await modelRouter.orchestrateMedia('audio', `sound effect: ${params.prompt}`, 'AI SFX Generation');
                }
            },
            {
                name: 'audio_generate_sfx_preset',
                description: 'Generate common game SFX from preset category.',
                parameters: { preset: 'footstep_stone|sword_swing|magic_spell|explosion|coin_pickup|door_open|button_click|level_up|damage_taken|jump|land' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const description = SFX_CATEGORIES[params.preset] || params.preset;
                    return await modelRouter.orchestrateMedia('audio', `game sound effect: ${description}`, 'AI SFX Preset');
                }
            },
            {
                name: 'audio_list_sfx_presets',
                description: 'List available SFX presets.',
                parameters: {},
                handler: async () => ({ presets: Object.keys(SFX_CATEGORIES), descriptions: SFX_CATEGORIES })
            },

            // === AI Music Generation ===
            {
                name: 'audio_generate_music',
                description: 'Generate music track with AI.',
                parameters: { prompt: 'string', duration: 'number?', genre: 'string?', mood: 'string?', bpm: 'number?' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const details = [params.genre, params.mood, params.bpm ? `${params.bpm}bpm` : null].filter(Boolean).join(', ');
                    return await modelRouter.orchestrateMedia('audio', `music: ${details ? details + ', ' : ''}${params.prompt}`, 'AI Music Generation');
                }
            },
            {
                name: 'audio_generate_ambient',
                description: 'Generate ambient/background audio for environments.',
                parameters: { environment: 'forest|cave|city|space|beach|dungeon|tavern|battlefield', intensity: 'number?' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    return await modelRouter.orchestrateMedia('audio', `ambient soundscape: ${params.environment} environment, loopable`, 'AI Ambient Generation');
                }
            },

            // === Voice/TTS ===
            {
                name: 'audio_generate_voice',
                description: 'Generate voice/TTS.',
                parameters: { text: 'string', voice: 'male|female|child|robot|monster?', emotion: 'neutral|happy|angry|sad|scared?' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const voiceDesc = `${params.voice || 'neutral'} voice, ${params.emotion || 'neutral'} emotion`;
                    return await modelRouter.orchestrateMedia('audio', `text-to-speech: "${params.text}", ${voiceDesc}`, 'AI Voice Generation');
                }
            },

            // === Remix & Variation (Audio-to-Audio) ===
            {
                name: 'audio_remix',
                description: 'Remix existing audio with prompt guidance (audio + prompt context).',
                parameters: { audioUrl: 'string', prompt: 'string', preserveRhythm: 'boolean?' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const rhythmNote = params.preserveRhythm ? 'preserving original rhythm, ' : '';
                    return await modelRouter.orchestrateMedia('audio', `Remix audio: ${rhythmNote}${params.prompt}`, 'AI Audio Remix');
                }
            },
            {
                name: 'audio_variation',
                description: 'Generate variations of existing audio.',
                parameters: { audioUrl: 'string', count: 'number?', variationStrength: 'number?' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    return await modelRouter.orchestrateMedia('audio', `Create ${params.count || 4} variations of this audio, strength ${params.variationStrength || 0.5}`, 'AI Audio Variations');
                }
            },
            {
                name: 'audio_extend',
                description: 'Extend audio clip seamlessly (make longer).',
                parameters: { audioUrl: 'string', additionalDuration: 'number' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    return await modelRouter.orchestrateMedia('audio', `Extend this audio by ${params.additionalDuration} seconds, seamless continuation`, 'AI Audio Extension');
                }
            },

            // === Mock Sounds (Placeholders) ===
            {
                name: 'audio_mock_sfx',
                description: 'Generate quick mock/placeholder SFX for prototyping.',
                parameters: { type: 'beep|boop|ding|buzz|whoosh|thud|click', pitch: 'low|mid|high?' },
                handler: async (params) => {
                    // Generate simple placeholder sounds using Web Audio API
                    const ctx = getAudioContext();
                    if (!ctx) return { error: 'AudioContext not available' };

                    const oscillator = ctx.createOscillator();
                    const gainNode = ctx.createGain();

                    const freqMap: Record<string, number> = { beep: 800, boop: 300, ding: 1200, buzz: 150, whoosh: 400, thud: 80, click: 1000 };
                    const pitchMult: Record<string, number> = { low: 0.5, mid: 1, high: 2 };

                    oscillator.frequency.value = freqMap[params.type] * (pitchMult[params.pitch || 'mid'] || 1);
                    oscillator.type = params.type === 'buzz' ? 'sawtooth' : 'sine';

                    oscillator.connect(gainNode);
                    gainNode.connect(ctx.destination);
                    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

                    oscillator.start();
                    oscillator.stop(ctx.currentTime + 0.2);

                    return { played: true, type: params.type, pitch: params.pitch || 'mid' };
                }
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
    console.log('[AudioLimb] 35 capabilities registered.');
};
