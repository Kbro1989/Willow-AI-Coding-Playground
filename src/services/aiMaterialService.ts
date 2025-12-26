import { modelRouter } from './modelRouter';
import { forgeMedia } from './forgeMediaService';
import { nexusBus } from './nexusCommandBus';

export interface MaterialGenerationResult {
    mapUrl: string;
    normalMapUrl?: string; // Future: Generate normals from diffuse
    roughness?: number;
    metalness?: number;
}

class AiMaterialService {
    /**
     * Generate a full material set from a prompt
     */
    async generateMaterial(prompt: string): Promise<MaterialGenerationResult> {
        const taskId = `mat-${Math.random().toString(36).slice(2, 7)}`;
        const abortController = new AbortController();

        nexusBus.registerJob({
            id: taskId,
            type: 'ai',
            description: `Material Gen: ${prompt.substring(0, 20)}...`,
            abortController
        });

        try {
            console.log(`[MATERIAL_GEN] Synthesizing material for: ${prompt}`);

            // 1. Generate core diffuse texture using Cloudflare or Gemini
            const response = await modelRouter.route({
                type: 'image',
                prompt: `Seamless 3D texture: ${prompt}, high fidelity, 4k, professional PBR map`,
                options: { signal: abortController.signal }
            });

            if (response instanceof ReadableStream) {
                throw new Error('Streaming not supported for textures');
            }

            const dataUrl = `data:image/png;base64,${response.content}`;

            // 2. Register with Forge Media
            forgeMedia.addAsset({
                type: 'image',
                url: dataUrl,
                prompt: `Texture: ${prompt}`,
                model: response.model,
                tags: ['material', '3d-texture', 'pbr']
            });

            return {
                mapUrl: dataUrl,
                roughness: 0.7,
                metalness: 0.1 // Defaults for now
            };
        } finally {
            nexusBus.completeJob(taskId);
        }
    }
}

export const aiMaterialService = new AiMaterialService();
export default aiMaterialService;
