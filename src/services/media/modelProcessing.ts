/**
 * Model Processing Service
 * "Coding -> Fun" Approach: Generates 3D scenes via Code (React Three Fiber)
 * Leverages Cloudflare/Gemini Code models to create persistent 3D assets.
 */

import { route } from '../modelRouter';

export interface ModelGenerationResult {
    code: string;
    description: string;
    model: string;
}

const SYSTEM_PROMPT_3D = `You are a specialized 3D Graphics Coder.
Your goal is to write a single React Functional Component that renders a 3D scene using @react-three/fiber and @react-three/drei.
- Return ONLY the code for the component.
- The component should be named 'GeneratedScene'.
- Use standard HTML/JSX syntax.
- You can use standard hooks (useRef, useState, useFrame).
- You can use 'drei' helpers like <OrbitControls />, <Environment />, <Stars />, <Box>, <Sphere>, <MeshDistortMaterial>, etc.
- Do NOT include imports. Assume 'React', 'useRef', 'useState' and R3F/Drei components are already available in the scope.
- Focus on making it look visually interesting ("Fun").
- If asked for a specific object, build it using geometric primitives (Box, Sphere, Cylinder) grouped together.
`;

const modelProcessing = {
    /**
     * Generate a 3D Scene Script based on a text prompt
     * @param prompt User description of the 3D object/scene
     */
    async generate3DScript(prompt: string): Promise<ModelGenerationResult> {
        console.log('[ModelService] Generating 3D Script...', prompt);
        try {
            // Use Standard (Cloudflare Qwen) or Premium (Gemini) based on availability
            // We'll trust the router's default "code" handling, but override structure for 3D context.

            const response = await route({
                type: 'code',
                prompt: `Create a React Three Fiber component for: ${prompt}`,
                systemPrompt: SYSTEM_PROMPT_3D,
                tier: 'standard' // Try Cloudflare Qwen first (it's good at coding)
            });

            // Clean up code (strip markdown blocks if present)
            let cleanCode = response.code || '';
            cleanCode = cleanCode.replace(/```tsx?/g, '').replace(/```/g, '').trim();

            return {
                code: cleanCode,
                description: `Generated 3D script for "${prompt}"`,
                model: response.model
            };

        } catch (error) {
            console.error('[ModelService] Generation Failed:', error);
            throw error;
        }
    },

    /**
     * Optimize or Modify an existing 3D Script
     */
    async modify3DScript(currentCode: string, modification: string): Promise<ModelGenerationResult> {
        console.log('[ModelService] Modifying 3D Script...');
        try {
            const response = await route({
                type: 'code',
                prompt: `Modify this R3F code: ${modification}\n\nCurrent Code:\n${currentCode}`,
                systemPrompt: SYSTEM_PROMPT_3D,
                tier: 'standard'
            });

            let cleanCode = response.code || '';
            cleanCode = cleanCode.replace(/```tsx?/g, '').replace(/```/g, '').trim();

            return {
                code: cleanCode,
                description: `Modified: ${modification}`,
                model: response.model
            };
        } catch (error) {
            console.error('[ModelService] Modification Failed:', error);
            throw error;
        }
    }
};

export default modelProcessing;
