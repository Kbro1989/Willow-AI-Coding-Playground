import geminiProvider, { GeminiTextRequest, GeminiImageRequest, GeminiCodeRequest } from './geminiProvider';
import cloudflareProvider from './cloudflareProvider';
import { hardBlockEnforcer } from './hardBlockEnforcer';
import { contextService } from './ai/contextService';
import aiUsageService from './gameData/aiUsageService';
import { ModelKey } from '../types';
import { validatePrompt } from '../backend/validateInput';
import { logAIAccess, logSecurityEvent } from './loggingService';
import aimlapiService from './aimlapiService';

export type ModelType = 'text' | 'function_calling' | 'image' | 'code' | 'audio' | 'video' | 'reasoning' | 'vision' | '3d' | 'image-to-3d';

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

  // 0. Security Validation
  const validation = validatePrompt(request.prompt);
  if (!validation.isValid) {
    logSecurityEvent('BLOCKED_AI_PROMPT', { prompt: request.prompt, error: validation.error });
    throw new Error(`[SECURITY] ${validation.error}`);
  }

  // Update prompt if sanitized (soft block)
  if (validation.sanitized && validation.sanitized !== request.prompt) {
    request.prompt = validation.sanitized;
  }

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

  // --- ZERO-COST STRATEGY GUARDRAIL (Integrated into Pipeline) ---
  // Checks are performed during pipeline construction below.

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
  if (hardBlockEnforcer.canUseProvider('cloudflare')) {
    pipeline.push({ provider: 'cloudflare', executor: routeToCloudflare });
  } else {
    console.warn('🚨 Cloudflare blocked by Zero-Cost Enforcer. Skipping to fallback.');
  }

  if (geminiProvider.isAvailable() && hardBlockEnforcer.canUseProvider('gemini')) {
    pipeline.push({ provider: 'gemini', executor: routeToGemini });
  }

  if (pipeline.length === 0) {
    throw new Error('❌ HARD BLOCK: All Daily Free Quotas Exhausted. Wait for 00:00 UTC reset.');
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
        console.warn(`[ROUTER] Step ${step.provider} failed (Reflex Triggered):`, error);

        // Dispatch "Pain" Signal to the Nervous System
        nexusBus.dispatchEvent('REFLEX_PAIN', {
          provider: step.provider,
          error: error instanceof Error ? error.message : 'Unknown Error',
          severity: 'reflex'
        });

        lastError = error;
        continue; // Reflexively switch to next limb (fallback)
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

      // Track Hard Block Usage
      hardBlockEnforcer.trackUsage(resp.provider as any, resp.cost);
    }

    // 4. Log Success
    if (!(finalResponse instanceof ReadableStream)) {
      logAIAccess(finalResponse.model, request.prompt, true);
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

    logAIAccess('error', request.prompt, false);
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
        systemPrompt: request.systemPrompt || "You are a cost-optimized fallback intelligence. Be concise.",
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
      }, request.options?.stream, signal, request.options?.maxTokens || 4096);

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
      }, signal, request.options?.maxTokens || 4096);

      return {
        code: response.code,
        model: response.model
      };
    }

    case 'reasoning': {
      // Use DeepSeek R1 (Distill) for cost-effective reasoning
      const response = await cloudflareProvider.reasonWithDeepSeek(request.prompt, request.options?.maxTokens || 4096);

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

    case 'image-to-3d': {
      // Check if AIML API key exists
      const apiKey = localStorage.getItem('TEMP_AIMLAPI_KEY');
      if (!apiKey) {
        throw new Error('AIML API key required for image-to-3D generation. Please add it in Settings > API Keys.');
      }

      console.log('[ROUTER] Using AIML API for image-to-3D conversion');
      const result = await aimlapiService.imageToModel(request.prompt, apiKey);
      return {
        modelUrl: result.url,
        model: 'triposr',
        content: `Generated 3D model: ${result.fileName} (${Math.round(result.blob.size / 1024)}KB)`,
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
 * Convert 2D image to 3D model using TripoSR (AIML API)
 */
export async function generateModelFromImage(
  imageUrl: string
): Promise<ModelResponse | ReadableStream> {
  return route({
    type: 'image-to-3d',
    prompt: imageUrl  // imageUrl passed as prompt
  });
}

/**
 * Aliases for Chat.tsx compatibility
 */
export const generateCinematic = generateVideo;

export const synthesizeSpeech = async (text: string): Promise<ModelResponse | ReadableStream> => {
  return processAudio(text, 'tts');
};

/**
 * Specialized Pipeline: 2D Game Asset -> 3D World Object
 * Biological Analogy: Evolution (2D -> 3D)
 */
export async function generateGameAsset(
  prompt: string,
  mode: '2d' | '3d' | '2d_to_3d'
): Promise<ModelResponse> {
  const startTime = Date.now();
  console.log(`[EVOLUTION] Starting Game Asset Gen (${mode}): "${prompt}"`);

  // Step 1: Generate Base 2D Texture/Sprite (Always Cloudflare Flux for cost)
  const textureData = await route({
    type: 'image',
    prompt: mode === '2d' ? prompt : `Flat texture map, symmetrical, game ready, ${prompt}`,
    tier: 'standard' // Force free tier
  }) as ModelResponse;

  if (mode === '2d') return textureData;

  // Step 2: Evolve to 3D (If requested)
  if (mode === '3d' || mode === '2d_to_3d') {
    // Logic: Use the 2D image as a controlnet/input for 3D gen if supported, 
    // or use the refined prompt. For now, we chain the prompt.
    const modelData = await route({
      type: '3d',
      prompt: `3D model of ${prompt}, matching style of generated texture`,
      tier: 'standard'
    }) as ModelResponse;

    return {
      ...modelData,
      imageUrl: textureData.imageUrl, // Keep 2D ref
      content: `[EVOLUTION COMPLETE] 2D Texture -> 3D Model`,
      latency: Date.now() - startTime
    };
  }

  return textureData;
}

export const modelRouter = {
  route,
  chat,
  chatWithFunctions,
  generateImage,
  completeCode,
  processAudio,
  generateVideo,
  generate3D,
  generateModelFromImage,
  generateCinematic,
  synthesizeSpeech,
  orchestrateMedia,
  generateGameAsset
};

export default modelRouter;
