/**
 * N8N Workflow Execution Engine
 * Executes workflow graphs with dependency resolution
 */

import { NodeType, getNodeDefinition } from './nodeDefinitions';
import { modelRouter, ModelResponse } from '../../services/modelRouter';
import { createFile, executeCommand } from '../../services/bridgeService';
import { orchestrate } from '../../services/agents/orchestratorAgent';
import { nexusBus } from '../../services/nexusCommandBus';
import { logTask } from '../../services/loggingService';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  parameters: Record<string, any>;
}

export interface WorkflowConnection {
  id: string;
  sourceNode: string;
  sourceOutput: string;
  targetNode: string;
  targetInput: string;
}

export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
}

export interface ExecutionContext {
  variables: Map<string, any>;
  nodeOutputs: Map<string, any>;
}

export class WorkflowEngine {
  private context: ExecutionContext;

  constructor() {
    this.context = {
      variables: new Map(),
      nodeOutputs: new Map()
    };
  }

  /**
   * Execute entire workflow
   */
  async execute(workflow: Workflow): Promise<{ success: boolean; outputs: Record<string, any>; error?: string }> {
    const startTime = Date.now();
    console.log(`[WORKFLOW] Executing: ${workflow.name}`);

    const abortController = new AbortController();
    const jobId = `wf-${workflow.id}-${Math.random().toString(36).slice(2, 7)}`;

    nexusBus.registerJob({
      id: jobId,
      type: 'workflow',
      description: `Workflow: ${workflow.name}`,
      abortController
    });

    try {
      // Reset context
      this.context.variables.clear();
      this.context.nodeOutputs.clear();

      await logTask({ taskId: jobId, step: 'START', status: 'pending', timestamp: Date.now() });

      // Build execution order (topological sort)
      const executionOrder = this.topologicalSort(workflow);

      // Execute nodes in order
      for (const nodeId of executionOrder) {
        if (abortController.signal.aborted) throw new Error('Workflow aborted by user');

        const node = workflow.nodes.find(n => n.id === nodeId);
        if (!node) continue;

        console.log(`[WORKFLOW] Executing node: ${node.id} (${node.type})`);
        await logTask({ taskId: jobId, step: `NODE_${node.id}`, status: 'pending', metadata: { type: node.type }, timestamp: Date.now() });

        // Get inputs for this node
        const inputs = this.getNodeInputs(node, workflow);

        // Execute node
        const output = await this.executeNode(node, inputs, abortController.signal);

        // Store output
        this.context.nodeOutputs.set(node.id, output);
        await logTask({ taskId: jobId, step: `NODE_${node.id}`, status: 'success', timestamp: Date.now() });
      }

      await logTask({ taskId: jobId, step: 'COMPLETE', status: 'success', duration: Date.now() - startTime, timestamp: Date.now() });

      return {
        success: true,
        outputs: Object.fromEntries(this.context.nodeOutputs)
      };
    } catch (error) {
      console.error('[WORKFLOW] Execution failed:', error);
      await logTask({ taskId: jobId, step: 'ERROR', status: 'failure', metadata: { error: String(error) }, timestamp: Date.now() });
      return {
        success: false,
        outputs: {},
        error: String(error)
      };
    } finally {
      nexusBus.completeJob(jobId);
    }
  }

  /**
   * Get inputs for a node from connected nodes
   */
  private getNodeInputs(node: WorkflowNode, workflow: Workflow): Record<string, any> {
    const inputs: Record<string, any> = {};

    // Find connections targeting this node
    const incomingConnections = workflow.connections.filter(c => c.targetNode === node.id);

    for (const conn of incomingConnections) {
      const sourceOutput = this.context.nodeOutputs.get(conn.sourceNode);
      if (sourceOutput !== undefined) {
        inputs[conn.targetInput] = sourceOutput[conn.sourceOutput] || sourceOutput;
      }
    }

    return inputs;
  }

  /**
   * Execute a single node
   */
  private async executeNode(node: WorkflowNode, inputs: Record<string, any>, signal?: AbortSignal): Promise<any> {
    const def = getNodeDefinition(node.type);

    switch (node.type) {
      case 'input':
      case 'prompt':
        return { data: node.parameters.value || node.parameters.text };

      case 'ai_text':
        const textResponse = await modelRouter.route({
          type: 'text',
          prompt: inputs.prompt || node.parameters.prompt || '',
          systemPrompt: 'You are a helpful AI assistant.',
          options: { signal }
        });
        if (textResponse instanceof ReadableStream) throw new Error('Streaming not supported in workflows');
        return { text: textResponse.content };

      case 'ai_image':
        const imageResponse = await modelRouter.route({
          type: 'image',
          prompt: inputs.prompt || node.parameters.prompt || '',
          options: { signal }
        });
        if (imageResponse instanceof ReadableStream) throw new Error('Streaming not supported in workflows');
        return { imageUrl: imageResponse.imageUrl };

      case 'ai_code':
        const codeResponse = await modelRouter.route({
          type: 'code',
          prompt: inputs.prompt || node.parameters.prompt || '',
          language: node.parameters.language || 'typescript',
          options: { signal }
        });
        if (codeResponse instanceof ReadableStream) throw new Error('Streaming not supported in workflows');
        return { code: codeResponse.code };

      case 'ai_reasoning':
        const reasoningResponse = await modelRouter.chat(
          `Think step-by-step:\n\n${inputs.problem || ''}`,
          [],
          'You are a reasoning AI. Break down complex problems.'
        );
        if (reasoningResponse instanceof ReadableStream) throw new Error('Streaming not supported in workflows');
        return { solution: reasoningResponse.content };

      case 'ai_video':
        const videoResponse = await modelRouter.generateVideo(
          inputs.prompt || node.parameters.prompt || ''
        );
        if (videoResponse instanceof ReadableStream) throw new Error('Streaming not supported in workflows');
        return { videoUrl: videoResponse.videoUrl || videoResponse.imageUrl };

      case 'ai_audio':
        const audioMode = node.parameters.mode || 'tts';
        const audioResponse = await modelRouter.processAudio(
          inputs.input || node.parameters.input || '',
          audioMode
        );
        if (audioResponse instanceof ReadableStream) throw new Error('Streaming not supported in workflows');
        return { output: audioResponse.audioUrl || audioResponse.content };

      case 'ai_logic_refactor':
        const { behaviorSynthesis } = await import('../../services/behaviorSynthesisService');
        const refactorResult = await behaviorSynthesis.refactorTree(
          inputs.tree || [],
          inputs.goal || node.parameters.goal || 'Refactor for better performance'
        );
        return { result: refactorResult };

      case 'file_writer':
        const writeResult = await createFile(
          inputs.path || node.parameters.path || '',
          inputs.content || node.parameters.content || ''
        );
        return { success: writeResult.success };

      case 'transform':
        try {
          const transformFn = new Function('data', node.parameters.code || 'return data;');
          return { result: transformFn(inputs.data) };
        } catch (e) {
          return { result: inputs.data };
        }

      case 'filter':
        try {
          const filterFn = new Function('data', node.parameters.condition || 'return true;');
          const passes = filterFn(inputs.data);
          return passes ? { true: inputs.data } : { false: inputs.data };
        } catch (e) {
          return { false: inputs.data };
        }

      case 'variable':
        if (node.parameters.operation === 'set') {
          this.context.variables.set(node.parameters.name, inputs.value);
          return { value: inputs.value };
        } else {
          return { value: this.context.variables.get(node.parameters.name) };
        }

      case 'merge':
        return {
          merged: {
            ...inputs.input1,
            ...inputs.input2
          }
        };

      case 'http':
        try {
          const response = await fetch(node.parameters.url, {
            method: node.parameters.method || 'GET',
            headers: { 'Content-Type': 'application/json' },
            body: node.parameters.method !== 'GET' ? JSON.stringify(inputs.body || {}) : undefined
          });
          const data = await response.json();
          return { response: data };
        } catch (e) {
          return { response: { error: String(e) } };
        }

      case 'discord':
        try {
          await fetch(node.parameters.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: inputs.message })
          });
          return { success: true };
        } catch (e) {
          return { success: false, error: String(e) };
        }

      case 'git_commit':
        const commitMsg = node.parameters.message || 'Auto-commit from Neural Engine';
        // Stage all changes
        const stageRes = await executeCommand('git add .');
        if (!stageRes.success) throw new Error(`Git add failed: ${stageRes.error}`);

        // Commit
        const commitRes = await executeCommand(`git commit -m "${commitMsg}"`);
        if (!commitRes.success) {
          // Check if it's just "nothing to commit"
          if (commitRes.error?.includes('nothing to commit')) return { commitHash: 'no-changes' };
          throw new Error(`Git commit failed: ${commitRes.error}`);
        }
        return { commitHash: 'latest' };

      case 'deploy':
        const target = node.parameters.target || 'pages';
        const cmd = target === 'pages' ? 'npx wrangler pages deploy .' : 'npx wrangler deploy';
        const deployRes = await executeCommand(cmd);
        if (!deployRes.success) throw new Error(`Deploy failed: ${deployRes.error}`);
        return { url: 'https://willow-ai-game-dev.pages.dev' }; // TODO: Parse output for real URL

      case 'cloudflare':
        const action = node.parameters.action || 'deploy_worker';
        let cfCmd = '';
        if (action === 'deploy_worker') cfCmd = 'npx wrangler deploy';
        if (action === 'deploy_pages') cfCmd = 'npx wrangler pages deploy .';
        if (action === 'update_kv') cfCmd = 'npx wrangler kv:key put ...'; // Simplification

        const cfRes = await executeCommand(cfCmd);
        return { result: cfRes.success ? cfRes.output : cfRes.error };

      case 'loop':
        // Minimal loop implementation: Pass-through (Parallel exec not supported yet)
        return { item: inputs.items ? inputs.items[0] : null };

      default:
        console.warn(`[WORKFLOW] Unhandled node type: ${node.type}`);
        return {};
    }
  }

  /**
   * Topological sort to determine execution order
   */
  private topologicalSort(workflow: Workflow): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      // Visit dependencies first
      const dependencies = workflow.connections
        .filter(c => c.targetNode === nodeId)
        .map(c => c.sourceNode);

      for (const depId of dependencies) {
        visit(depId);
      }

      result.push(nodeId);
    };

    // Start with nodes that have no inputs (input nodes)
    const inputNodes = workflow.nodes.filter(node => {
      const hasIncoming = workflow.connections.some(c => c.targetNode === node.id);
      return !hasIncoming;
    });

    for (const node of inputNodes) {
      visit(node.id);
    }

    // Visit any remaining unvisited nodes
    for (const node of workflow.nodes) {
      if (!visited.has(node.id)) {
        visit(node.id);
      }
    }

    return result;
  }
}

/**
 * Pre-built workflow templates
 */
export const WORKFLOW_TEMPLATES: Record<string, Workflow> = {
  'asset-gen': {
    id: 'asset-gen',
    name: 'Asset Generation Pipeline',
    nodes: [
      {
        id: 'prompt-1',
        type: 'prompt',
        position: { x: 100, y: 100 },
        parameters: { text: 'Create a sci-fi robot character' }
      },
      {
        id: 'ai-image-1',
        type: 'ai_image',
        position: { x: 300, y: 100 },
        parameters: { model: 'imagen', size: '1024x1024' }
      },
      {
        id: 'file-writer-1',
        type: 'file_writer',
        position: { x: 500, y: 100 },
        parameters: { path: 'assets/robot.png' }
      }
    ],
    connections: [
      {
        id: 'conn-1',
        sourceNode: 'prompt-1',
        sourceOutput: 'data',
        targetNode: 'ai-image-1',
        targetInput: 'prompt'
      },
      {
        id: 'conn-2',
        sourceNode: 'ai-image-1',
        sourceOutput: 'imageUrl',
        targetNode: 'file-writer-1',
        targetInput: 'content'
      }
    ]
  },

  'code-gen': {
    id: 'code-gen',
    name: 'Code Generation Pipeline',
    nodes: [
      {
        id: 'prompt-1',
        type: 'prompt',
        position: { x: 100, y: 100 },
        parameters: { text: 'Create a React counter component' }
      },
      {
        id: 'ai-code-1',
        type: 'ai_code',
        position: { x: 300, y: 100 },
        parameters: { language: 'typescript' }
      },
      {
        id: 'file-writer-1',
        type: 'file_writer',
        position: { x: 500, y: 100 },
        parameters: { path: 'src/Counter.tsx' }
      }
    ],
    connections: [
      {
        id: 'conn-1',
        sourceNode: 'prompt-1',
        sourceOutput: 'data',
        targetNode: 'ai-code-1',
        targetInput: 'prompt'
      },
      {
        id: 'conn-2',
        sourceNode: 'ai-code-1',
        sourceOutput: 'code',
        targetNode: 'file-writer-1',
        targetInput: 'content'
      }
    ]
  }
};

export const workflowEngine = new WorkflowEngine();
export default workflowEngine;
