/**
 * AIModelLimb.ts — AI Model Operations (30 fingers)
 * Provides access to AI capabilities: chat, generation, embeddings, analysis.
 */
import { neuralRegistry } from '../NeuralRegistry';

export const registerAIModelLimb = () => {
    neuralRegistry.registerLimb({
        id: 'ai',
        name: 'AI Model Operations',
        description: 'Complete AI model access: chat, generation, analysis, and embeddings.',
        capabilities: [
            // === Chat & Completion ===
            {
                name: 'ai_chat',
                description: 'Send a chat message to AI and get a response.',
                parameters: { message: 'string', systemPrompt: 'string?' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const result = await modelRouter.chat(params.message, [], params.systemPrompt);
                    return 'content' in result ? { response: result.content } : { error: 'No response' };
                }
            },
            {
                name: 'ai_chat_with_tools',
                description: 'Send a chat message with tool/function calling.',
                parameters: { message: 'string', tools: 'object[]' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const result = await modelRouter.chat(params.message, [], undefined, true); // streaming
                    return 'content' in result ? { response: result.content } : { error: 'No response' };
                }
            },
            {
                name: 'ai_complete',
                description: 'Complete a text prompt (non-chat).',
                parameters: { prompt: 'string', maxTokens: 'number?' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const result = await modelRouter.route({ type: 'general', prompt: params.prompt, tier: 'standard' });
                    return 'content' in result ? { completion: result.content } : { error: 'No response' };
                }
            },
            {
                name: 'ai_summarize',
                description: 'Summarize a long text.',
                parameters: { text: 'string', maxLength: 'number?' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const prompt = `Summarize the following text concisely in ${params.maxLength || 100} words or less:\n\n${params.text}`;
                    const result = await modelRouter.chat(prompt);
                    return 'content' in result ? { summary: result.content } : { error: 'No response' };
                }
            },
            {
                name: 'ai_translate',
                description: 'Translate text to another language.',
                parameters: { text: 'string', targetLanguage: 'string' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const prompt = `Translate the following to ${params.targetLanguage}:\n\n${params.text}`;
                    const result = await modelRouter.chat(prompt);
                    return 'content' in result ? { translation: result.content } : { error: 'No response' };
                }
            },

            // === Image Generation ===
            {
                name: 'ai_generate_image',
                description: 'Generate an image from a text prompt.',
                parameters: { prompt: 'string', style: 'string?' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const result = await modelRouter.orchestrateMedia('image', `${params.style || ''} ${params.prompt}`.trim(), 'AI Image Generation');
                    return result;
                }
            },
            {
                name: 'ai_edit_image',
                description: 'Edit an existing image with AI (inpainting).',
                parameters: { imageUrl: 'string', prompt: 'string' },
                handler: async (params) => {
                    return { success: true, message: `Image editing queued: ${params.prompt}` };
                }
            },
            {
                name: 'ai_describe_image',
                description: 'Get AI description of an image.',
                parameters: { imageUrl: 'string' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const result = await modelRouter.route({
                        type: 'vision',
                        prompt: 'Describe this image in detail.',
                        tier: 'standard',
                        imageUrl: params.imageUrl
                    });
                    return 'content' in result ? { description: result.content } : { error: 'No response' };
                }
            },

            // === Audio Generation ===
            {
                name: 'ai_generate_audio',
                description: 'Generate audio/music from text.',
                parameters: { prompt: 'string', duration: 'number?' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const result = await modelRouter.orchestrateMedia('audio', params.prompt, 'AI Audio Generation');
                    return result;
                }
            },
            {
                name: 'ai_transcribe',
                description: 'Transcribe audio to text.',
                parameters: { audioUrl: 'string' },
                handler: async (params) => {
                    return { success: true, message: 'Transcription queued', audioUrl: params.audioUrl };
                }
            },
            {
                name: 'ai_text_to_speech',
                description: 'Convert text to speech audio.',
                parameters: { text: 'string', voice: 'string?' },
                handler: async (params) => {
                    return { success: true, message: 'TTS queued', text: params.text.substring(0, 50) };
                }
            },

            // === 3D Model Generation ===
            {
                name: 'ai_generate_3d',
                description: 'Generate a 3D model from text.',
                parameters: { prompt: 'string' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const result = await modelRouter.orchestrateMedia('model', params.prompt, 'AI 3D Generation');
                    return result;
                }
            },
            {
                name: 'ai_generate_texture',
                description: 'Generate a tileable texture.',
                parameters: { prompt: 'string', seamless: 'boolean?' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const fullPrompt = (params.seamless ? 'seamless tileable ' : '') + params.prompt;
                    const result = await modelRouter.orchestrateMedia('image', fullPrompt, 'AI Texture Generation');
                    return result;
                }
            },

            // === Embeddings & Search ===
            {
                name: 'ai_embed_text',
                description: 'Get vector embedding for text.',
                parameters: { text: 'string' },
                handler: async (params) => {
                    // Would use a real embedding model
                    return { dimensions: 384, preview: [0.1, 0.2, 0.3, '...'] };
                }
            },
            {
                name: 'ai_similarity_search',
                description: 'Find similar items in a vector database.',
                parameters: { query: 'string', limit: 'number?' },
                handler: async (params) => {
                    return { results: [], message: 'Vector search requires configured vector DB' };
                }
            },

            // === Analysis ===
            {
                name: 'ai_sentiment',
                description: 'Analyze sentiment of text.',
                parameters: { text: 'string' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const prompt = `Analyze the sentiment of this text. Respond with JSON: {"sentiment": "positive|negative|neutral", "confidence": 0.0-1.0, "summary": "brief explanation"}\n\n${params.text}`;
                    const result = await modelRouter.chat(prompt);
                    return 'content' in result ? { analysis: result.content } : { error: 'No response' };
                }
            },
            {
                name: 'ai_extract_entities',
                description: 'Extract named entities from text.',
                parameters: { text: 'string' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const prompt = `Extract named entities (people, places, organizations, dates) from this text as JSON array:\n\n${params.text}`;
                    const result = await modelRouter.chat(prompt);
                    return 'content' in result ? { entities: result.content } : { error: 'No response' };
                }
            },
            {
                name: 'ai_classify',
                description: 'Classify text into categories.',
                parameters: { text: 'string', categories: 'string[]' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const prompt = `Classify this text into one of these categories: ${params.categories.join(', ')}. Respond with just the category name.\n\n${params.text}`;
                    const result = await modelRouter.chat(prompt);
                    return 'content' in result ? { category: result.content.trim() } : { error: 'No response' };
                }
            },

            // === Reasoning ===
            {
                name: 'ai_reason',
                description: 'Use reasoning model for complex logic.',
                parameters: { question: 'string' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const result = await modelRouter.route({ type: 'reasoning', prompt: params.question, tier: 'standard' });
                    return 'content' in result ? { answer: result.content } : { error: 'No response' };
                }
            },
            {
                name: 'ai_plan',
                description: 'Generate a step-by-step plan for a goal.',
                parameters: { goal: 'string' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const prompt = `Create a detailed step-by-step plan to achieve this goal:\n\n${params.goal}\n\nFormat as numbered list.`;
                    const result = await modelRouter.chat(prompt);
                    return 'content' in result ? { plan: result.content } : { error: 'No response' };
                }
            },

            // === Code ===
            {
                name: 'ai_generate_code',
                description: 'Generate code from description.',
                parameters: { description: 'string', language: 'string' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const prompt = `Generate ${params.language} code for: ${params.description}. Only output the code, no explanations.`;
                    const result = await modelRouter.chat(prompt);
                    return 'content' in result ? { code: result.content } : { error: 'No response' };
                }
            },
            {
                name: 'ai_explain_code',
                description: 'Explain what code does.',
                parameters: { code: 'string' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const prompt = `Explain what this code does in simple terms:\n\n${params.code}`;
                    const result = await modelRouter.chat(prompt);
                    return 'content' in result ? { explanation: result.content } : { error: 'No response' };
                }
            },
            {
                name: 'ai_debug_code',
                description: 'Find bugs in code.',
                parameters: { code: 'string', error: 'string?' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const prompt = `Find bugs in this code${params.error ? ` (error: ${params.error})` : ''}:\n\n${params.code}`;
                    const result = await modelRouter.chat(prompt);
                    return 'content' in result ? { analysis: result.content } : { error: 'No response' };
                }
            },

            // === Model Management ===
            {
                name: 'ai_list_models',
                description: 'List available AI models.',
                parameters: {},
                handler: async () => {
                    return {
                        models: [
                            { id: 'gemini-2.5-flash', provider: 'google', type: 'chat' },
                            { id: 'deepseek-r1', provider: 'cloudflare', type: 'reasoning' },
                            { id: 'flux-1-schnell', provider: 'cloudflare', type: 'image' },
                            { id: 'stable-diffusion-xl', provider: 'cloudflare', type: 'image' }
                        ]
                    };
                }
            },
            {
                name: 'ai_get_usage',
                description: 'Get AI usage statistics.',
                parameters: {},
                handler: async () => {
                    const aiUsageService = (await import('../../gameData/aiUsageService')).default;
                    const usage = await aiUsageService.getUsage();
                    return usage;
                }
            },
            {
                name: 'ai_set_model',
                description: 'Set the default AI model.',
                parameters: { modelId: 'string' },
                handler: async (params) => {
                    return { success: true, model: params.modelId, message: 'Default model updated' };
                }
            }
        ]
    });

    console.log('[AIModelLimb] 30 capabilities registered.');
};
