
import { modelRouter } from '../modelRouter';

export interface VideoGenerationResult {
    videoUrl: string;
    model: string;
    prompt: string;
}

export const videoProcessing = {
    /**
     * Generate a cinematic video from a text prompt
     */
    generateCinematic: async (prompt: string, style: string = 'cinematic'): Promise<VideoGenerationResult> => {
        // Enhance prompt based on style
        let enhancedPrompt = prompt;
        switch (style) {
            case 'anime':
                enhancedPrompt = `anime style, vibrant colors, ${prompt}`;
                break;
            case 'claymation':
                enhancedPrompt = `claymation style, stop motion, plasticine texture, ${prompt}`;
                break;
            case 'pixel':
                enhancedPrompt = `pixel art style, 16-bit, retro game, ${prompt}`;
                break;
            default:
                enhancedPrompt = `cinematic movie scene, 8k resolution, photorealistic, ${prompt}`;
        }

        // Call model router (which delegates to Cloudflare SVD)
        const result = await modelRouter.route({
            type: 'video',
            prompt: enhancedPrompt
        });

        return {
            videoUrl: result.imageUrl || '', // modelRouter returns videoUrl in imageUrl field for compat
            model: result.model,
            prompt: enhancedPrompt
        };
    }
};
