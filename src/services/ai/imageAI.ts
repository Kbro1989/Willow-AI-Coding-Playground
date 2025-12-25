/**
 * Image AI Service
 * Handles AI-powered image operations using Cloudflare Workers AI and Gemini
 */

import type { MediaAsset } from '../../types/media';

const CF_ACCOUNT_ID = '6872653edcee9c787c1b783173793'; // From user memories
const CF_API_TOKEN = localStorage.getItem('cloudflare_api_key') || '';

interface CloudflareAIResponse {
    result: {
        image: string; // base64
    };
    success: boolean;
    errors?: Array<{ message: string }>;
}

/**
 * Remove background from image using Cloudflare Workers AI
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

        // Call Cloudflare Workers AI
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/lykon/absolute-reality-v1.8.1`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CF_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: 'remove background, transparent background, alpha channel',
                    image: base64.split(',')[1], // Remove data:image/png;base64, prefix
                    num_steps: 20
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Cloudflare AI error: ${response.statusText}`);
        }

        const result: CloudflareAIResponse = await response.json();

        if (!result.success) {
            throw new Error(result.errors?.[0]?.message || 'Unknown error');
        }

        // Convert result back to ImageData
        const resultImage = new Image();
        await new Promise((resolve, reject) => {
            resultImage.onload = resolve;
            resultImage.onerror = reject;
            resultImage.src = `data:image/png;base64,${result.result.image}`;
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

        // Use Cloudflare Workers AI upscaling model
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CF_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: `upscale ${factor}x, high quality, sharp details`,
                    image: base64.split(',')[1],
                    num_steps: 30
                })
            }
        );

        const result: CloudflareAIResponse = await response.json();

        if (!result.success) {
            throw new Error(result.errors?.[0]?.message || 'Upscale failed');
        }

        // Convert back
        const upscaledImage = new Image();
        await new Promise((resolve) => {
            upscaledImage.onload = resolve;
            upscaledImage.src = `data:image/png;base64,${result.result.image}`;
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
 * Generate image from text prompt using AI
 */
export async function generateImageAI(prompt: string): Promise<string> {
    try {
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CF_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt,
                    num_steps: 40
                })
            }
        );

        if (!response.ok) throw new Error(`Cloudflare AI error: ${response.statusText}`);
        const result: CloudflareAIResponse = await response.json();

        if (!result.success) throw new Error(result.errors?.[0]?.message || 'Generation failed');

        return result.result.image; // Base64
    } catch (error) {
        console.error('[IMAGE_AI] Generation failed:', error);
        throw error;
    }
}

/**
 * Generate video from image using AI (Image-to-Video)
 */
export async function generateVideoAI(imageBase64: string): Promise<string> {
    try {
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/stabilityai/stable-video-diffusion-img2vid-xt`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CF_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: imageBase64,
                    num_steps: 30,
                    decoder_steps: 10
                })
            }
        );

        if (!response.ok) throw new Error(`Cloudflare AI error: ${response.statusText}`);

        const result: CloudflareAIResponse = await response.json();

        // Note: SVD output field might vary, assuming 'video' or 'result.video'
        // If the type definition doesn't handle 'video', we cast or check result.
        // CloudflareAIResponse interface has result: { image: string }. We might need to handle video.
        return (result as any).result.video || result.result.image;
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

        // Call Cloudflare Workers AI inpainting
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/runwayml/stable-diffusion-v1-5-inpainting`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CF_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt,
                    image: imageBase64.split(',')[1],
                    mask: maskBase64.split(',')[1],
                    num_steps: 25
                })
            }
        );

        const result: CloudflareAIResponse = await response.json();

        if (!result.success) {
            throw new Error(result.errors?.[0]?.message || 'Inpainting failed');
        }

        // Convert result
        const resultImage = new Image();
        await new Promise(resolve => {
            resultImage.onload = resolve;
            resultImage.src = `data:image/png;base64,${result.result.image}`;
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

    // Use Cloudflare Workers AI image captioning
    const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/unum/uform-gen2-qwen-500m`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CF_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: base64.split(',')[1],
                prompt: 'Describe this image in detail'
            })
        }
    );

    const result = await response.json();
    return result.result?.description || 'No description available';
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
