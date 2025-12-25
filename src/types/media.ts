/**
 * Media System Type Definitions
 * Comprehensive types for media asset management and processing
 */

export type MediaType = 'image' | 'audio' | 'video' | 'model' | 'code' | 'texture' | 'material' | 'animation' | 'sketch';
export type MediaStatus = 'raw' | 'processing' | 'optimized' | 'failed' | 'archived';
export type ExportFormat = 'png' | 'jpg' | 'webp' | 'svg' | 'mp3' | 'wav' | 'ogg' | 'mp4' | 'webm' | 'gif' | 'glb' | 'gltf' | 'obj' | 'fbx';

/**
 * Core media asset interface
 */
export interface MediaAsset {
    id: string;
    name: string;
    type: MediaType;
    status: MediaStatus;

    // File information
    url?: string;
    localPath?: string;
    fileSize?: number;
    mimeType?: string;

    // Timestamps
    createdAt: number;
    updatedAt: number;

    // Metadata
    metadata: MediaMetadata;

    // Relationships
    parentId?: string; // For versions/derivatives
    tags: string[];
    collectionIds: string[];

    // AI information
    aiGenerated?: boolean;
    aiModel?: string;
    aiPrompt?: string;
    aiParameters?: Record<string, any>;

    // Usage tracking
    usageCount?: number;
    lastUsed?: number;
}

/**
 * Type-specific metadata
 */
export interface MediaMetadata {
    // Image-specific
    width?: number;
    height?: number;
    aspectRatio?: string;
    colorSpace?: string;
    hasAlpha?: boolean;

    // Audio-specific
    duration?: number;
    sampleRate?: number;
    channels?: number;
    bitrate?: number;

    // Video-specific
    frameRate?: number;
    codec?: string;

    // 3D Model-specific
    polyCount?: number;
    vertexCount?: number;
    hasSkeleton?: boolean;
    hasAnimations?: boolean;
    boundingBox?: {
        min: [number, number, number];
        max: [number, number, number];
    };

    // Code-specific
    language?: string;
    lineCount?: number;

    // Common
    description?: string;
    author?: string;
    license?: string;
    attribution?: string;

    // Custom metadata
    custom?: Record<string, any>;
}

/**
 * Query interface for searching media assets
 */
export interface MediaQuery {
    type?: MediaType | MediaType[];
    tags?: string[];
    search?: string; // Search in name and description
    status?: MediaStatus | MediaStatus[];
    aiGenerated?: boolean;
    createdAfter?: number;
    createdBefore?: number;
    sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'usageCount' | 'fileSize';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
}

/**
 * Media operation types
 */
export type MediaOperation =
    | { type: 'resize'; width: number; height: number; maintainAspect?: boolean }
    | { type: 'crop'; x: number; y: number; width: number; height: number }
    | { type: 'rotate'; degrees: number }
    | { type: 'flip'; direction: 'horizontal' | 'vertical' }
    | { type: 'compress'; quality: number }
    | { type: 'convert'; format: ExportFormat }
    | { type: 'optimize'; target: 'web' | 'mobile' | 'desktop' }
    | { type: 'ai_enhance'; model: string; parameters?: Record<string, any> }
    | { type: 'ai_inpaint'; mask: string; prompt: string }
    | { type: 'ai_upscale'; factor: number }
    | { type: 'ai_remove_background' }
    | { type: 'ai_style_transfer'; styleReference: string };

/**
 * Batch operation request
 */
export interface BatchOperation {
    assetIds: string[];
    operation: MediaOperation;
    onProgress?: (completed: number, total: number) => void;
    onComplete?: (results: MediaAsset[]) => void;
    onError?: (error: Error) => void;
}

/**
 * Collection for organizing media
 */
export interface MediaCollection {
    id: string;
    name: string;
    description?: string;
    assetIds: string[];
    createdAt: number;
    updatedAt: number;
    thumbnail?: string;
    tags: string[];
}

/**
 * Export configuration
 */
export interface ExportConfig {
    format: ExportFormat;
    quality?: number; // 0-100 for lossy formats
    optimize?: boolean;
    includeMetadata?: boolean;
    destination?: 'local' | 'cloud' | 'clipboard';
    filename?: string;
}

/**
 * Import result
 */
export interface ImportResult {
    success: boolean;
    asset?: MediaAsset;
    error?: string;
}

/**
 * AI recommendation
 */
export interface AIRecommendation {
    assetId: string;
    reason: string;
    confidence: number; // 0-1
    context?: string;
}

/**
 * Media context for AI agents
 */
export interface MediaContext {
    totalAssets: number;
    assetsByType: Record<MediaType, number>;
    recentAssets: MediaAsset[];
    suggestedAssets: AIRecommendation[];
    missingAssets?: string[]; // Referenced but not found
}

/**
 * Annotation data
 */
export interface Annotation {
    id: string;
    assetId: string;
    type: 'sketch' | 'markup' | 'highlight';
    strokes: AnnotationStroke[];
    createdAt: number;
    author?: string;
}

export interface AnnotationStroke {
    points: Array<{ x: number; y: number }>;
    color: string;
    width: number;
    opacity: number;
    tool: 'pen' | 'highlighter' | 'eraser';
}

/**
 * Version history
 */
export interface MediaVersion {
    id: string;
    assetId: string;
    version: number;
    url: string;
    createdAt: number;
    operation?: MediaOperation;
    description?: string;
}
