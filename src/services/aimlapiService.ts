/**
 * AIML API Service
 * Provides access to AIML API models including TripoSR (image-to-3D) and GLM-4.7 (text generation)
 * API Documentation: https://docs.aimlapi.com
 */

const AIMLAPI_BASE_URL = 'https://api.aimlapi.com/v1';

export interface AimlapiImageTo3DRequest {
    imageUrl: string;
}

export interface AimlapiImageTo3DResponse {
    url: string;
    fileName: string;
    blob: Blob;
    format: 'glb' | 'obj';
    metadata: any;
}

export interface AimlapiTextRequest {
    prompt: string;
    messages?: Array<{ role: string; content: string }>;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    tools?: any[];
    toolChoice?: string;
}

export interface AimlapiTextResponse {
    content: string;
    reasoning?: string;
    toolCalls?: any[];
    model: string;
}

/**
 * Convert 2D image to 3D model using TripoSR
 * Model: triposr
 * Input: Image URL (jpg, png, webp)
 * Output: GLB or OBJ file
 * Time: ~30-90 seconds
 */
export async function imageToModel(imageUrl: string, apiKey: string): Promise<AimlapiImageTo3DResponse> {
    try {
        console.log('[AIML/TRIPOSR] Starting image-to-3D conversion:', imageUrl);

        const response = await fetch(`${AIMLAPI_BASE_URL}/images/generations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'triposr',
                image_url: imageUrl,
            }),
        });

        if (!response.ok) {
            let errorMessage = response.statusText;
            try {
                const error = await response.json();
                errorMessage = error.error?.message || error.message || errorMessage;
            } catch (e) {
                // Response not JSON
            }
            throw new Error(`AIML API error: ${errorMessage}`);
        }

        const data = await response.json();

        if (!data.model_mesh || !data.model_mesh.url) {
            throw new Error('Invalid response from TripoSR - missing model_mesh');
        }

        const meshUrl = data.model_mesh.url;
        const fileName = data.model_mesh.file_name;

        console.log('[AIML/TRIPOSR] Downloading 3D model:', fileName);

        // Download the 3D model file
        const meshResponse = await fetch(meshUrl);
        if (!meshResponse.ok) {
            throw new Error(`Failed to download 3D model: ${meshResponse.status}`);
        }

        const meshBlob = await meshResponse.blob();

        console.log('[AIML/TRIPOSR] 3D model ready:', fileName, meshBlob.size, 'bytes');

        return {
            url: meshUrl,
            fileName,
            blob: meshBlob,
            format: fileName.endsWith('.glb') ? 'glb' : 'obj',
            metadata: data
        };
    } catch (error) {
        console.error('[AIML/TRIPOSR] Image-to-3D conversion failed:', error);
        throw error;
    }
}

/**
 * Chat completion using GLM-4.7
 * Model: zhipu/glm-4.7
 * Features: 200K context window, function calling, reasoning
 */
export async function chatWithGLM(request: AimlapiTextRequest, apiKey: string): Promise<AimlapiTextResponse> {
    try {
        console.log('[AIML/GLM-4.7] Starting chat request');

        const response = await fetch(`${AIMLAPI_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'zhipu/glm-4.7',
                messages: request.messages || [{ role: 'user', content: request.prompt }],
                max_completion_tokens: request.maxTokens || 8192,
                temperature: request.temperature ?? 0.7,
                top_p: request.topP ?? 0.9,
                stream: false,
                tools: request.tools,
                tool_choice: request.toolChoice,
            }),
        });

        if (!response.ok) {
            let errorMessage = response.statusText;
            try {
                const error = await response.json();
                errorMessage = error.error?.message || error.message || errorMessage;
            } catch (e) {
                // Response not JSON
            }
            throw new Error(`AIML API error: ${errorMessage}`);
        }

        const data = await response.json();

        if (!data.choices || !data.choices[0]) {
            throw new Error('Invalid response from GLM-4.7 - missing choices');
        }

        return {
            content: data.choices[0].message.content,
            reasoning: data.choices[0].message.reasoning_content,
            toolCalls: data.choices[0].message.tool_calls,
            model: 'zhipu/glm-4.7'
        };
    } catch (error) {
        console.error('[AIML/GLM-4.7] Chat request failed:', error);
        throw error;
    }
}

export const aimlapiService = {
    imageToModel,
    chatWithGLM
};

export default aimlapiService;
