/**
 * Image AI Service
 * Handles AI-powered image operations using Cloudflare Workers AI and Gemini
 * Routes through worker proxy to avoid CORS issues
 */

import type { MediaAsset } from '../../types/media';

// Use worker proxy to avoid CORS issues with direct Cloudflare API calls
const WORKER_URL = import.meta.env.VITE_AI_WORKER_URL || 'https://ai-game-studio.kristain33rs.workers.dev';

interface CloudflareAIResponse {
    result: {
        image: string; // base64
    };
    success: boolean;
    errors?: Array<{ message: string }>;
}

/**
 * Remove background from image using Cloudflare Workers AI (via worker proxy)
 */
export async function removeBackgroundAI(imageData: ImageData): Promise<ImageData> {
    try {
        // Convert ImageData to blob
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d')!;
        ctx.putImageData(imageData, 0, 0);

        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });

        // Convert to base64
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });

        // Route through worker proxy to avoid CORS
        const response = await fetch(`${WORKER_URL}/api/image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'remove-background',
                image: base64.split(',')[1],
                prompt: 'subject on pure transparent background, high contrast, studio lighting, alpha channel'
            })
        });

        if (!response.ok) {
            throw new Error(`Worker AI error: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success && result.error) {
            throw new Error(result.error);
        }

        // Convert result back to ImageData
        const resultImage = new Image();
        await new Promise((resolve, reject) => {
            resultImage.onload = resolve;
            resultImage.onerror = reject;
            resultImage.src = `data:image/png;base64,${result.image || result.result?.image}`;
        });

        const resultCanvas = document.createElement('canvas');
        resultCanvas.width = resultImage.width;
        resultCanvas.height = resultImage.height;
        const resultCtx = resultCanvas.getContext('2d')!;
        resultCtx.drawImage(resultImage, 0, 0);

        return resultCtx.getImageData(0, 0, resultImage.width, resultImage.height);
    } catch (error) {
        console.error('[IMAGE_AI] Background removal failed:', error);
        throw error;
    }
}

/**
 * Upscale image using AI (2x or 4x)
 */
export async function upscaleImageAI(imageData: ImageData, factor: 2 | 4 = 2): Promise<ImageData> {
    try {
        // Convert to blob
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d')!;
        ctx.putImageData(imageData, 0, 0);

        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });

        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });

        // Route through worker proxy
        const response = await fetch(`${WORKER_URL}/api/image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'upscale',
                image: base64.split(',')[1],
                factor,
                prompt: `upscale ${factor}x, high quality, sharp details`
            })
        });

        const result = await response.json();

        if (!result.success && result.error) {
            throw new Error(result.error);
        }

        // Convert back
        const upscaledImage = new Image();
        await new Promise((resolve) => {
            upscaledImage.onload = resolve;
            upscaledImage.src = `data:image/png;base64,${result.image || result.result?.image}`;
        });

        const resultCanvas = document.createElement('canvas');
        resultCanvas.width = upscaledImage.width;
        resultCanvas.height = upscaledImage.height;
        const resultCtx = resultCanvas.getContext('2d')!;
        resultCtx.drawImage(upscaledImage, 0, 0);

        return resultCtx.getImageData(0, 0, upscaledImage.width, upscaledImage.height);
    } catch (error) {
        console.error('[IMAGE_AI] Upscale failed:', error);
        throw error;
    }
}


/**
 * Generate image from text prompt using AI (via worker proxy)
 */
export async function generateImageAI(prompt: string): Promise<string> {
    try {
        const response = await fetch(`${WORKER_URL}/api/image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'generate', prompt })
        });

        if (!response.ok) throw new Error(`Worker AI error: ${response.statusText}`);
        const result = await response.json();

        if (!result.success && result.error) throw new Error(result.error);

        return result.image || result.result?.image; // Base64
    } catch (error) {
        console.error('[IMAGE_AI] Generation failed:', error);
        throw error;
    }
}

/**
 * Generate image using FLUX-1 Schnell (via worker proxy)
 */
export async function generateFluxImage(prompt: string, steps: number = 4): Promise<string> {
    try {
        const response = await fetch(`${WORKER_URL}/api/image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'flux', prompt, steps })
        });

        if (!response.ok) throw new Error(`Worker FLUX error: ${response.statusText}`);
        const result = await response.json();

        if (!result.success && result.error) throw new Error(result.error);

        return result.image || result.result?.image;
    } catch (error) {
        console.error('[IMAGE_AI] FLUX generation failed:', error);
        throw error;
    }
}

/**
 * Generate video from image using AI (via worker proxy)
 */
export async function generateVideoAI(imageBase64: string): Promise<string> {
    try {
        const response = await fetch(`${WORKER_URL}/api/video`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'img2vid',
                image: imageBase64
            })
        });

        if (!response.ok) throw new Error(`Worker AI error: ${response.statusText}`);

        const result = await response.json();

        return result.video || result.image || result.result?.video;
    } catch (error) {
        console.error('[IMAGE_AI] Video generation failed:', error);
        throw error;
    }
}

/**
 * Auto-enhance image (brightness, contrast, color correction)
 */
export async function autoEnhanceImage(imageData: ImageData): Promise<ImageData> {
    // Analyze histogram
    const histogram = {
        r: new Array(256).fill(0),
        g: new Array(256).fill(0),
        b: new Array(256).fill(0)
    };

    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        histogram.r[data[i]]++;
        histogram.g[data[i + 1]]++;
        histogram.b[data[i + 2]]++;
    }

    // Find min/max values (ignore 1% outliers)
    const findRange = (hist: number[]) => {
        const total = imageData.width * imageData.height;
        const threshold = total * 0.01;
        let sum = 0;
        let min = 0;
        let max = 255;

        for (let i = 0; i < 256; i++) {
            sum += hist[i];
            if (sum > threshold) {
                min = i;
                break;
            }
        }

        sum = 0;
        for (let i = 255; i >= 0; i--) {
            sum += hist[i];
            if (sum > threshold) {
                max = i;
                break;
            }
        }

        return { min, max };
    };

    const rRange = findRange(histogram.r);
    const gRange = findRange(histogram.g);
    const bRange = findRange(histogram.b);

    // Apply histogram stretch
    const output = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        // Stretch each channel
        output[i] = Math.max(0, Math.min(255,
            ((data[i] - rRange.min) / (rRange.max - rRange.min)) * 255
        ));
        output[i + 1] = Math.max(0, Math.min(255,
            ((data[i + 1] - gRange.min) / (gRange.max - gRange.min)) * 255
        ));
        output[i + 2] = Math.max(0, Math.min(255,
            ((data[i + 2] - bRange.min) / (bRange.max - bRange.min)) * 255
        ));
        output[i + 3] = data[i + 3]; // Preserve alpha
    }

    return new ImageData(output, imageData.width, imageData.height);
}

/**
 * AI-powered inpainting (fill selected area with AI-generated content)
 */
export async function inpaintImage(
    imageData: ImageData,
    maskData: ImageData,
    prompt: string
): Promise<ImageData> {
    try {
        // Convert image and mask to base64
        const imageCanvas = document.createElement('canvas');
        imageCanvas.width = imageData.width;
        imageCanvas.height = imageData.height;
        imageCanvas.getContext('2d')!.putImageData(imageData, 0, 0);

        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = maskData.width;
        maskCanvas.height = maskData.height;
        maskCanvas.getContext('2d')!.putImageData(maskData, 0, 0);

        const [imageBlob, maskBlob] = await Promise.all([
            new Promise<Blob>(res => imageCanvas.toBlob(b => res(b!), 'image/png')),
            new Promise<Blob>(res => maskCanvas.toBlob(b => res(b!), 'image/png'))
        ]);

        const reader1 = new FileReader();
        const reader2 = new FileReader();

        const [imageBase64, maskBase64] = await Promise.all([
            new Promise<string>(resolve => {
                reader1.onloadend = () => resolve(reader1.result as string);
                reader1.readAsDataURL(imageBlob);
            }),
            new Promise<string>(resolve => {
                reader2.onloadend = () => resolve(reader2.result as string);
                reader2.readAsDataURL(maskBlob);
            })
        ]);

        // Route through worker proxy
        const response = await fetch(`${WORKER_URL}/api/image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'inpaint',
                prompt,
                image: imageBase64.split(',')[1],
                mask: maskBase64.split(',')[1]
            })
        });

        const result = await response.json();

        if (!result.success && result.error) {
            throw new Error(result.error);
        }

        // Convert result
        const resultImage = new Image();
        await new Promise(resolve => {
            resultImage.onload = resolve;
            resultImage.src = `data:image/png;base64,${result.image || result.result?.image}`;
        });

        const resultCanvas = document.createElement('canvas');
        resultCanvas.width = resultImage.width;
        resultCanvas.height = resultImage.height;
        resultCanvas.getContext('2d')!.drawImage(resultImage, 0, 0);

        return resultCanvas.getContext('2d')!.getImageData(0, 0, resultImage.width, resultImage.height);
    } catch (error) {
        console.error('[IMAGE_AI] Inpainting failed:', error);
        throw error;
    }
}

/**
 * Generate image description using AI (for auto-tagging)
 */
export async function generateImageDescription(imageData: ImageData): Promise<string> {
    // Convert to blob
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d')!.putImageData(imageData, 0, 0);

    const blob = await new Promise<Blob>(resolve => {
        canvas.toBlob(b => resolve(b!), 'image/png');
    });

    const reader = new FileReader();
    const base64 = await new Promise<string>(resolve => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
    });

    // Route through worker proxy for image captioning
    const response = await fetch(`${WORKER_URL}/api/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'describe',
            image: base64.split(',')[1],
            prompt: 'Describe this image in detail'
        })
    });

    const result = await response.json();
    return result.description || result.result?.description || 'No description available';
}

/**
 * Suggest tags based on image content
 */
export async function suggestImageTags(imageData: ImageData): Promise<string[]> {
    const description = await generateImageDescription(imageData);

    // Extract keywords from description
    const words = description.toLowerCase().split(/\W+/);
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were', 'this', 'that']);

    const tags = words
        .filter(w => w.length > 3 && !commonWords.has(w))
        .slice(0, 10);

    return [...new Set(tags)];
}
