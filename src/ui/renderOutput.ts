/**
 * renderOutput.ts - The visual dispatcher for AI results
 * Connects backend processors to specialized UI viewers.
 */

export type OutputType = 'code' | 'media' | '3d' | 'text';

interface RenderTarget {
    type: OutputType;
    content: any;
    metadata?: any;
}

/**
 * Dispatches output to the appropriate UI component and triggers processing
 */
export const dispatchOutput = async (target: RenderTarget) => {
    console.log(`[UI_DISPATCHER] Rendering ${target.type} output...`);

    switch (target.type) {
        case 'code':
            // Logic to send to CodeLibrary
            console.log('[UI_DISPATCHER] Updating Code Library with new snippet');
            break;
        case 'media':
            // Logic to send to MediaLibrary
            console.log('[UI_DISPATCHER] Injecting asset into Media Library');
            break;
        case '3d':
            // Logic to send to ModelStudio
            console.log('[UI_DISPATCHER] Hot-reloading 3D viewport');
            break;
        default:
            console.log('[UI_DISPATCHER] Default text rendering');
    }

    return target;
};

/**
 * Helper to determine output type from data
 */
export const determineOutputType = (data: any): OutputType => {
    if (typeof data === 'string') {
        if (data.includes('import') || data.includes('func ')) return 'code';
        if (data.startsWith('data:image') || data.startsWith('http')) return 'media';
    }
    if (data?.isModel || data?.vertices) return '3d';
    return 'text';
};
