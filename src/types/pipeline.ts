
export type NodeType =
    | 'input_media' | 'input_text'
    | 'process_ai_image' | 'process_ai_video' | 'process_ai_audio' | 'process_code'
    | 'transform_upscale' | 'transform_remove_bg'
    | 'output_save' | 'output_download';

export interface PipelineNodeData {
    label: string;
    description?: string;
    // Node specific config
    model?: string;
    prompt?: string;
    url?: string;
    aspectRatio?: string;
    format?: string;
}

export interface PipelineNode {
    id: string;
    type: NodeType;
    position: { x: number; y: number };
    data: PipelineNodeData;
}

export interface PipelineEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
}

export interface PipelineWorkflow {
    id: string;
    name: string;
    nodes: PipelineNode[];
    edges: PipelineEdge[];
    createdAt: number;
    updatedAt: number;
}
