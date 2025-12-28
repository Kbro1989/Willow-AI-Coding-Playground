import geminiProvider, { GeminiTextRequest, GeminiImageRequest, GeminiCodeRequest } from './geminiProvider';
import cloudflareProvider from './cloudflareProvider';
import aiUsageService from './gameData/aiUsageService';
import { ModelKey } from '../types';

export type ModelType = 'text' | 'function_calling' | 'image' | 'code' | 'audio' | 'video' | 'reasoning' | 'vision' | '3d';

export interface ModelRequest {
  type: ModelType;
  prompt: string;
  history?: Array<{ role: 'user' | 'model'; content: string }>;
  systemPrompt?: string;
  functionDeclarations?: any[];
  negativePrompt?: string;
  language?: string;
  context?: string;
  options?: any;
  tier?: 'standard' | 'premium';
  grounding?: boolean;
  bundle?: boolean;
  subRequests?: ModelRequest[];
  domain?: '3D' | 'MEDIA' | 'AI' | 'SYSTEM';
  source?: 'RSMV' | 'NIF' | 'GLTF' | 'REMOTE';
}

export interface ModelResponse {
  content?: string;
  code?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  modelUrl?: string;
  functionCalls?: any[];
  model: string;
  provider: 'gemini' | 'cloudflare' | 'local' | 'local-rsmv' | 'unknown';
  latency: number;
  tokensUsed?: number;
  cost?: number;
}

type ProviderExecutor = (request: ModelRequest, signal?: AbortSignal) => Promise<Omit<ModelResponse, 'provider' | 'latency' | 'cost'> | ReadableStream>;

interface PipelineStep {
  provider: 'gemini' | 'cloudflare' | 'local';
  executor: ProviderExecutor;
}

/**
 * Route model request to best available provider
 * Strategy: "Cloudflare First" (Cost Optimization)
 */

import { nexusBus } from './nexusCommandBus';
import sessionService from './sessionService';
import { orchestrateRSMV } from './rsmv/rsmvCompiler';

export async function route(request: ModelRequest): Promise<ModelResponse | ReadableStream> {
  const startTime = Date.now();

  // 1. Handle Bundled Requests (Multi-modal)
  if (request.bundle && request.subRequests) {
    console.log(`[MODEL] Processing bundled request with ${request.subRequests.length} steps...`);
    const results = await Promise.all(request.subRequests.map(sr => route({ ...sr, options: { ...sr.options, ...request.options } })));
    // Merge results into a single response
    return {
      content: results.map(r => (r as ModelResponse).content).filter(Boolean).join('\n---\n'),
      imageUrl: (results.find(r => (r as ModelResponse).imageUrl) as ModelResponse)?.imageUrl,
      videoUrl: (results.find(r => (r as ModelResponse).videoUrl) as ModelResponse)?.videoUrl,
      code: (results.find(r => (r as ModelResponse).code) as ModelResponse)?.code,
      model: 'composite-bundle',
      provider: 'unknown',
      latency: Date.now() - startTime
    };
  }

  // 1.5 RSMV Professional Integration Branch
  if (request.domain === '3D' && request.source === 'RSMV') {
    return orchestrateRSMV(request);
  }

  const signal = request.options?.signal;
  // Check session quota
  if (sessionService.isOverQuota()) {
    throw new Error('[NEXUS_QUOTA] Session hard cost limit reached. Please reset session or increase quotas.');
  }

  const tier = request.tier || 'standard';
  const stream = request.options?.stream === true;

  const abortController = new AbortController();
  const taskId = `ai-${Math.random().toString(36).slice(2, 9)}`;
  const job = nexusBus.registerJob({
    id: taskId,
    type: 'ai',
    description: `AI ${request.type}: ${request.prompt.substring(0, 30)}...`,
    abortController
  });

  // Define Pipeline based on Request Type & Tier
  const pipeline: PipelineStep[] = [];

  // "Cloudflare First" Doctrine
  // We prioritize Cloudflare for cost and latency, falling back to Gemini for high-reasoning or unsupported specialized types.
  pipeline.push({ provider: 'cloudflare', executor: routeToCloudflare });

  if (geminiProvider.isAvailable()) {
    pipeline.push({ provider: 'gemini', executor: routeToGemini });
  }

  let finalResponse: ModelResponse | ReadableStream | undefined;
  let lastError: any;

  try {
    // Execute Pipeline with Fallbacks
    for (const step of pipeline) {
      try {
        console.log(`[ROUTER] Attempting ${step.provider} for ${request.type}...`);
        const result = await step.executor(request, abortController.signal);

        if (result instanceof ReadableStream) {
          return result;
        }

        const latency = Date.now() - startTime;
        const tokens = result.tokensUsed || (result.content?.length || 0) / 4;
        const cost = aiUsageService.calculateCost(step.provider, result.model, request.prompt.length / 4, tokens);

        finalResponse = {
          ...result,
          provider: step.provider,
          latency,
          cost
        };
        break; // Success!
      } catch (error) {
        console.warn(`[ROUTER] Step ${step.provider} failed:`, error);
        lastError = error;
        continue; // Try next fallback
      }
    }

    if (!finalResponse) {
      throw lastError || new Error(`All providers failed for ${request.type}`);
    }

    // Log success to InstantDB
    if (!(finalResponse instanceof ReadableStream)) {
      const resp = finalResponse as ModelResponse;

      // Update Session Metrics
      sessionService.updateMetrics(
        (resp.tokensUsed || (resp.content?.length || 0) / 4),
        resp.cost || 0
      );

      aiUsageService.logAIUsage({
        model: resp.model,
        provider: resp.provider,
        taskType: request.type as any,
        inputTokens: Math.ceil(request.prompt.length / 4),
        outputTokens: resp.tokensUsed || Math.ceil((resp.content?.length || 0) / 4),
        cost: resp.cost,
        duration: resp.latency,
        success: true
      }).catch(err => console.error('[ROUTER] Failed to log usage:', err));
    }

    return finalResponse;

  } catch (error) {
    // Log failure
    aiUsageService.logAIUsage({
      model: 'unknown',
      provider: 'unknown',
      taskType: request.type as any,
      inputTokens: Math.ceil(request.prompt.length / 4),
      outputTokens: 0,
      success: false
    }).catch(e => console.error('[ROUTER] Failed to log error usage:', e));

    throw error;
  } finally {
    nexusBus.completeJob(taskId);
  }
}

/**
 * Route to Gemini provider
 */
async function routeToGemini(request: ModelRequest, signal?: AbortSignal): Promise<Omit<ModelResponse, 'provider' | 'latency'>> {
  switch (request.type) {
    case 'text':
    case 'reasoning': // Gemini uses same chat for reasoning
    case 'function_calling': {
      const geminiRequest: GeminiTextRequest = {
        prompt: request.prompt,
        history: request.history,
        systemPrompt: request.systemPrompt,
        functionDeclarations: request.functionDeclarations,
        model: ModelKey.COMMANDER
      };

      const response = await geminiProvider.textChat(geminiRequest);

      return {
        content: response.content,
        functionCalls: response.functionCalls,
        model: response.model,
        tokensUsed: response.tokensUsed
      };
    }

    case 'image': {
      const geminiRequest: GeminiImageRequest = {
        prompt: request.prompt,
        negativePrompt: request.negativePrompt,
        aspectRatio: request.options?.aspectRatio
      };

      const response = await geminiProvider.generateImage(geminiRequest);

      return {
        imageUrl: response.imageUrl,
        model: response.model
      };
    }

    case 'code': {
      const geminiRequest: GeminiCodeRequest = {
        prompt: request.prompt,
        language: request.language,
        context: request.context
      };

      const response = await geminiProvider.codeCompletion(geminiRequest);

      return {
        code: response.code,
        model: response.model
      };
    }

    case 'video': {
      const response = await geminiProvider.generateVideo(request.prompt);
      return {
        videoUrl: response.videoUrl,
        model: response.model
      };
    }

    case 'audio': {
      const response = await geminiProvider.generateAudio(request.prompt);
      return {
        audioUrl: response.audioUrl,
        model: response.model
      };
    }

    default:
      throw new Error(`Unsupported model type for Gemini Router: ${request.type}`);
  }
}

/**
 * Route to Cloudflare provider
 */
async function routeToCloudflare(request: ModelRequest, signal?: AbortSignal): Promise<Omit<ModelResponse, 'provider' | 'latency'> | ReadableStream> {
  switch (request.type) {
    case 'text':
    case 'function_calling': {
      const response = await cloudflareProvider.textChat({
        prompt: request.prompt,
        history: request.history,
        systemPrompt: request.systemPrompt,
        functionDeclarations: request.functionDeclarations
      }, request.options?.stream, signal);

      if (response instanceof ReadableStream) {
        return response;
      }

      return {
        content: response.content,
        functionCalls: response.functionCalls,
        model: response.model,
        tokensUsed: response.tokensUsed
      };
    }

    case 'image': {
      const response = await cloudflareProvider.generateImage({
        prompt: request.prompt,
        negativePrompt: request.negativePrompt,
        aspectRatio: request.options?.aspectRatio
      }, signal);

      return {
        imageUrl: response.imageUrl,
        model: response.model
      };
    }

    case 'code': {
      const response = await cloudflareProvider.codeCompletion({
        prompt: request.prompt,
        language: request.language,
        context: request.context
      }, signal);

      return {
        code: response.code,
        model: response.model
      };
    }

    case 'reasoning': {
      // Use DeepSeek R1 (Distill) for cost-effective reasoning
      const response = await cloudflareProvider.reasonWithDeepSeek(request.prompt);

      return {
        content: response.solution,
        model: response.model
      };
    }

    case 'audio': {
      // HACK: We need to know if it's TTS (text -> audio) or STT (audio -> text)
      // For now, we assume 'prompt' is text for TTS if options.audioMode === 'tts'
      // Or 'prompt' is base64 audio for STT if options.audioMode === 'stt'

      if (request.options?.audioMode === 'tts') {
        const response = await cloudflareProvider.synthesizeAudio(request.prompt);
        return {
          audioUrl: `data:audio/mpeg;base64,${response.audioBase64}`,
          model: response.model
        };
      } else {
        // Assume STT
        const response = await cloudflareProvider.transcribe(request.prompt);
        return {
          content: response.text,
          model: response.model
        };
      }
    }

    case 'video': {
      const response = await cloudflareProvider.generateVideo(request.prompt);
      return {
        videoUrl: response.videoUrl,
        model: response.model
      };
    }

    case 'vision': {
      // Prompt here is expected to be a Blob or data URI
      const response = await cloudflareProvider.analyzeImage(request.prompt as any);
      return {
        content: JSON.stringify(response),
        model: 'detr-resnet-50'
      };
    }

    case '3d': {
      const response = await cloudflareProvider.generate3D(request.prompt);
      return {
        modelUrl: response.modelUrl,
        model: response.model
      };
    }

    default:
      throw new Error(`Unsupported model type: ${request.type}`);
  }
}

/**
 * Convenience function for text chat
 */
export async function chat(
  prompt: string,
  history?: Array<{ role: 'user' | 'model'; content: string }>,
  systemPrompt?: string,
  stream: boolean = false,
  grounding: boolean = false
): Promise<ModelResponse | ReadableStream> {
  return route({
    type: 'text',
    prompt,
    history,
    systemPrompt,
    grounding,
    options: { stream }
  });
}

/**
 * Convenience function for function calling
 */
export async function chatWithFunctions(
  prompt: string,
  functionDeclarations: any[],
  history?: Array<{ role: 'user' | 'model'; content: string }>,
  systemPrompt?: string,
  stream: boolean = false,
  grounding: boolean = false
): Promise<ModelResponse | ReadableStream> {
  return route({
    type: 'function_calling',
    prompt,
    history,
    systemPrompt,
    functionDeclarations,
    grounding
  });
}

/**
 * Convenience function for image generation
 */
export async function generateImage(
  prompt: string,
  negativePrompt?: string
): Promise<ModelResponse | ReadableStream> {
  return route({
    type: 'image',
    prompt,
    negativePrompt
  });
}

/**
 * Convenience function for code completion
 */
export async function completeCode(
  prompt: string,
  language?: string,
  context?: string
): Promise<ModelResponse | ReadableStream> {
  return route({
    type: 'code',
    prompt,
    language,
    context
  });
}

/**
 * Convenience function for audio (STT/TTS)
 */
export async function processAudio(
  prompt: string,
  mode: 'stt' | 'tts'
): Promise<ModelResponse | ReadableStream> {
  return route({
    type: 'audio',
    prompt,
    options: { audioMode: mode }
  });
}

/**
 * Convenience function for movie generation
 */
export async function generateVideo(
  prompt: string
): Promise<ModelResponse | ReadableStream> {
  return route({
    type: 'video',
    prompt
  });
}

/**
 * orchestrateMedia performs a 3-step Txt->Txt->Media chain for high precision.
 * Step 1: Architectural Planning (Llama 3.3)
 * Step 2: Technical Refinement (Qwen 2.5)
 * Step 3: Media Generation
 */
export async function orchestrateMedia(
  type: 'image' | 'video' | 'audio' | '3d',
  prompt: string,
  context?: string
): Promise<ModelResponse> {
  const startTime = Date.now();
  console.log(`[ORCHESTRATOR] Starting ${type} orchestration for: ${prompt}`);

  // Step 1: Planning
  const planningResp = await route({
    type: 'text',
    prompt: `Act as a Technical Director. Plan the production of a ${type} asset for: "${prompt}". 
    Context: ${context || 'General Game Development'}. 
    Provide a detailed structural breakdown.`,
    options: { model: ModelKey.CLOUDFLARE_CHAT } // Forced Cloudflare First
  }) as ModelResponse;

  // Step 2: Refinement / Prompt Engineering
  const refinementResp = await route({
    type: 'text',
    prompt: `Refine the following production plan into a highly optimized technical prompt for a ${type} generation model:
    PLAN: ${planningResp.content}
    Output ONLY THE FINAL TECHNICAL PROMPT.`,
    options: { model: ModelKey.CLOUDFLARE_CODE } // Precise Qwen coder for prompt engineering
  }) as ModelResponse;

  // Step 3: Final Media Generation
  const finalMedia = await route({
    type,
    prompt: refinementResp.content || prompt,
    tier: 'premium',
    options: type === 'audio' ? { audioMode: 'tts' } : {}
  }) as ModelResponse;

  return {
    ...finalMedia,
    content: `[ORCHESTRATION_LOG]\nStep 1 (Plan): ${planningResp.content?.substring(0, 100)}...\nStep 2 (Prompt): ${refinementResp.content?.substring(0, 100)}...\n\nFinal Response attached.`,
    latency: Date.now() - startTime
  };
}

/**
 * Convenience function for 3D generation
 */
export async function generate3D(
  prompt: string
): Promise<ModelResponse | ReadableStream> {
  return route({
    type: '3d',
    prompt
  });
}

/**
 * Aliases for Chat.tsx compatibility
 */
export const generateCinematic = generateVideo;

export const synthesizeSpeech = async (text: string): Promise<ModelResponse | ReadableStream> => {
  return processAudio(text, 'tts');
};

export const modelRouter = {
  route,
  chat,
  chatWithFunctions,
  generateImage,
  completeCode,
  processAudio,
  generateVideo,
  generate3D,
  generateCinematic,
  synthesizeSpeech,
  orchestrateMedia
};

export default modelRouter;
