/**
 * Image Processing Service
 * Handles all image transformations, AI enhancements, and exports
 */

import type { MediaAsset, MediaOperation } from '../../types/media';

export type FilterType = 'grayscale' | 'sepia' | 'invert' | 'blur' | 'sharpen';

export interface ImageLayer {
    id: string;
    name: string;
    visible: boolean;
    opacity: number;
    blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';
    imageData: ImageData | null;
    locked: boolean;
}

export interface ImageEditorState {
    width: number;
    height: number;
    layers: ImageLayer[];
    activeLayerId: string | null;
    history: ImageData[];
    historyIndex: number;
}

/**
 * Create a new blank layer
 */
export function createLayer(width: number, height: number, name: string = 'Layer'): ImageLayer {
    return {
        id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        imageData: null,
        locked: false
    };
}

/**
 * Resize image maintaining aspect ratio
 */
export async function resizeImage(
    imageData: ImageData,
    targetWidth: number,
    targetHeight: number,
    maintainAspect: boolean = true
): Promise<ImageData> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Calculate dimensions
    let width = targetWidth;
    let height = targetHeight;

    if (maintainAspect) {
        const aspectRatio = imageData.width / imageData.height;
        if (targetWidth / targetHeight > aspectRatio) {
            width = targetHeight * aspectRatio;
        } else {
            height = targetWidth / aspectRatio;
        }
    }

    // Draw original to temp canvas
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = imageData.width;
    sourceCanvas.height = imageData.height;
    sourceCanvas.getContext('2d')!.putImageData(imageData, 0, 0);

    // Draw resized to target canvas
    canvas.width = width;
    canvas.height = height;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, 0, 0, width, height);

    return ctx.getImageData(0, 0, width, height);
}

/**
 * Crop image to specified rectangle
 */
export function cropImage(
    imageData: ImageData,
    x: number,
    y: number,
    width: number,
    height: number
): ImageData {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    canvas.width = width;
    canvas.height = height;

    // Source canvas
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = imageData.width;
    sourceCanvas.height = imageData.height;
    sourceCanvas.getContext('2d')!.putImageData(imageData, 0, 0);

    // Draw cropped region
    ctx.drawImage(sourceCanvas, x, y, width, height, 0, 0, width, height);

    return ctx.getImageData(0, 0, width, height);
}

/**
 * Rotate image by degrees
 */
export function rotateImage(imageData: ImageData, degrees: number): ImageData {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const radians = (degrees * Math.PI) / 180;
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));

    // Calculate new dimensions
    const newWidth = imageData.width * cos + imageData.height * sin;
    const newHeight = imageData.width * sin + imageData.height * cos;

    canvas.width = newWidth;
    canvas.height = newHeight;

    // Source canvas
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = imageData.width;
    sourceCanvas.height = imageData.height;
    sourceCanvas.getContext('2d')!.putImageData(imageData, 0, 0);

    // Rotate and draw
    ctx.translate(newWidth / 2, newHeight / 2);
    ctx.rotate(radians);
    ctx.drawImage(sourceCanvas, -imageData.width / 2, -imageData.height / 2);

    return ctx.getImageData(0, 0, newWidth, newHeight);
}

/**
 * Flip image horizontally or vertically
 */
export function flipImage(imageData: ImageData, direction: 'horizontal' | 'vertical'): ImageData {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    canvas.width = imageData.width;
    canvas.height = imageData.height;

    // Source canvas
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = imageData.width;
    sourceCanvas.height = imageData.height;
    sourceCanvas.getContext('2d')!.putImageData(imageData, 0, 0);

    // Flip
    if (direction === 'horizontal') {
        ctx.scale(-1, 1);
        ctx.drawImage(sourceCanvas, -imageData.width, 0);
    } else {
        ctx.scale(1, -1);
        ctx.drawImage(sourceCanvas, 0, -imageData.height);
    }

    return ctx.getImageData(0, 0, imageData.width, imageData.height);
}

/**
 * Adjust brightness/contrast
 */
export function adjustBrightnessContrast(
    imageData: ImageData,
    brightness: number = 0,  // -100 to 100
    contrast: number = 0      // -100 to 100
): ImageData {
    const data = new Uint8ClampedArray(imageData.data);

    // Normalize values
    const b = brightness / 100;
    const c = (contrast + 100) / 100;

    for (let i = 0; i < data.length; i += 4) {
        // Apply brightness
        let r = data[i] + b * 255;
        let g = data[i + 1] + b * 255;
        let blu = data[i + 2] + b * 255;

        // Apply contrast
        r = ((r / 255 - 0.5) * c + 0.5) * 255;
        g = ((g / 255 - 0.5) * c + 0.5) * 255;
        blu = ((blu / 255 - 0.5) * c + 0.5) * 255;

        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, blu));
    }

    return new ImageData(data, imageData.width, imageData.height);
}

/**
 * Apply filters
 */
export function applyFilter(
    imageData: ImageData,
    filter: 'grayscale' | 'sepia' | 'invert' | 'blur' | 'sharpen'
): ImageData {
    const data = new Uint8ClampedArray(imageData.data);

    switch (filter) {
        case 'grayscale':
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = data[i + 1] = data[i + 2] = avg;
            }
            break;

        case 'sepia':
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
                data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
                data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
            }
            break;

        case 'invert':
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];
                data[i + 1] = 255 - data[i + 1];
                data[i + 2] = 255 - data[i + 2];
            }
            break;

        case 'blur':
            // Simple box blur
            return applyConvolution(imageData, [
                1 / 9, 1 / 9, 1 / 9,
                1 / 9, 1 / 9, 1 / 9,
                1 / 9, 1 / 9, 1 / 9
            ]);

        case 'sharpen':
            return applyConvolution(imageData, [
                0, -1, 0,
                -1, 5, -1,
                0, -1, 0
            ]);
    }

    return new ImageData(data, imageData.width, imageData.height);
}

/**
 * Apply convolution matrix
 */
function applyConvolution(imageData: ImageData, kernel: number[]): ImageData {
    const output = new Uint8ClampedArray(imageData.data.length);
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;

            for (let c = 0; c < 3; c++) {
                let sum = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const kidx = ((y + ky) * width + (x + kx)) * 4 + c;
                        const kernelIdx = (ky + 1) * 3 + (kx + 1);
                        sum += data[kidx] * kernel[kernelIdx];
                    }
                }
                output[idx + c] = Math.max(0, Math.min(255, sum));
            }
            output[idx + 3] = data[idx + 3]; // Alpha
        }
    }

    return new ImageData(output, width, height);
}

/**
 * Composite layers using blend modes
 */
export function compositeLayers(layers: ImageLayer[], width: number, height: number): ImageData {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    canvas.width = width;
    canvas.height = height;

    // Map our blend modes to valid GlobalCompositeOperation values
    const blendModeMap: Record<ImageLayer['blendMode'], GlobalCompositeOperation> = {
        'normal': 'source-over',
        'multiply': 'multiply',
        'screen': 'screen',
        'overlay': 'overlay',
        'darken': 'darken',
        'lighten': 'lighten'
    };

    for (const layer of layers) {
        if (!layer.visible || !layer.imageData) continue;

        // Create temp canvas for layer
        const layerCanvas = document.createElement('canvas');
        layerCanvas.width = width;
        layerCanvas.height = height;
        const layerCtx = layerCanvas.getContext('2d')!;
        layerCtx.putImageData(layer.imageData, 0, 0);

        // Apply blend mode and opacity
        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = blendModeMap[layer.blendMode];
        ctx.drawImage(layerCanvas, 0, 0);

        // Reset
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }

    return ctx.getImageData(0, 0, width, height);
}

/**
 * Remove background using AI
 */
export async function removeBackground(imageData: ImageData): Promise<ImageData> {
    try {
        // Try AI-powered background removal
        const { removeBackgroundAI } = await import('../ai/imageAI');
        return await removeBackgroundAI(imageData);
    } catch (error) {
        console.warn('[IMAGE_PROCESSING] AI background removal failed, using fallback:', error);

        // Fallback: Simple color-based removal
        const data = new Uint8ClampedArray(imageData.data);

        // Find dominant background color (from corners)
        const corners = [
            [0, 0],
            [imageData.width - 1, 0],
            [0, imageData.height - 1],
            [imageData.width - 1, imageData.height - 1]
        ];

        let bgR = 0, bgG = 0, bgB = 0;
        for (const [x, y] of corners) {
            const idx = (y * imageData.width + x) * 4;
            bgR += data[idx];
            bgG += data[idx + 1];
            bgB += data[idx + 2];
        }
        bgR /= 4;
        bgG /= 4;
        bgB /= 4;

        // Remove pixels similar to background color
        const threshold = 30;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);

            if (diff < threshold) {
                data[i + 3] = 0; // Make transparent
            }
        }

        return new ImageData(data, imageData.width, imageData.height);
    }
}

/**
 * Export image to various formats
 */
export async function exportImage(
    imageData: ImageData,
    format: 'png' | 'jpg' | 'webp' = 'png',
    quality: number = 0.92
): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    canvas.width = imageData.width;
    canvas.height = imageData.height;
    ctx.putImageData(imageData, 0, 0);

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Failed to export image'));
            },
            `image/${format}`,
            quality
        );
    });
}

/**
 * Load image from URL or File
 */
export async function loadImage(source: string | File): Promise<ImageData> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            resolve(ctx.getImageData(0, 0, img.width, img.height));

            // Clean up blob URL if created
            if (typeof source !== 'string' || source.startsWith('blob:')) {
                URL.revokeObjectURL(img.src);
            }
        };

        img.onerror = () => reject(new Error('Failed to load image'));

        if (typeof source === 'string') {
            img.src = source;
        } else {
            img.src = URL.createObjectURL(source);
        }
    });
}

/**
 * Upscale image using AI (2x or 4x)
 */
export async function upscaleImage(imageData: ImageData, factor: 2 | 4 = 2): Promise<ImageData> {
    try {
        const { upscaleImageAI } = await import('../ai/imageAI');
        return await upscaleImageAI(imageData, factor);
    } catch (error) {
        console.error('[IMAGE_PROCESSING] AI upscale failed:', error);
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width * factor;
        canvas.height = imageData.height * factor;
        const ctx = canvas.getContext('2d')!;
        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = imageData.width;
        sourceCanvas.height = imageData.height;
        sourceCanvas.getContext('2d')!.putImageData(imageData, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
}

/**
 * Auto-enhance image using AI analysis
 */
export async function enhanceImage(imageData: ImageData): Promise<ImageData> {
    try {
        const { autoEnhanceImage } = await import('../ai/imageAI');
        return await autoEnhanceImage(imageData);
    } catch (error) {
        console.error('[IMAGE_PROCESSING] AI enhance failed:', error);
        return adjustBrightnessContrast(imageData, 10, 20);
    }
}

/**
 * Generate tags for image using AI
 */
export async function generateImageTags(imageData: ImageData): Promise<string[]> {
    try {
        const { suggestImageTags } = await import('../ai/imageAI');
        return await suggestImageTags(imageData);
    } catch (error) {
        console.error('[IMAGE_PROCESSING] AI tag generation failed:', error);
        return [];
    }
}

