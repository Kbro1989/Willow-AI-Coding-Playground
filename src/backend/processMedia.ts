export interface MediaMetadata {
    format: string;
    width?: number;
    height?: number;
    duration?: number;
    size: number;
}

/**
 * Detects format based on MIME type or extension
 */
export const detectFormat = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'webp': 'image/webp',
        'mp4': 'video/mp4',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'webm': 'video/webm'
    };
    return map[ext || ''] || 'application/octet-stream';
};

/**
 * Extracts metadata from a media blob/file
 */
export const extractMetadata = async (file: File): Promise<MediaMetadata> => {
    return {
        format: detectFormat(file.name),
        size: file.size
    };
};

/**
 * Optimizes media size (Simulated for now)
 */
export const optimizeSize = async (data: Blob): Promise<Blob> => {
    console.log('[BACKEND_MEDIA] Running optimization pass on:', data.size, 'bytes');
    return data; // In production this would use sharp or ffmpeg-wasm
};
