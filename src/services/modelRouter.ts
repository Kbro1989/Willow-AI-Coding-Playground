/**
 * Unified Model Router
 * Routes requests to Gemini (paid) first, falls back to Cloudflare (free)
 */

import geminiProvider, { GeminiTextRequest, GeminiImageRequest, GeminiCodeRequest } from './geminiProvider';
import cloudflareProvider from './cloudflareProvider';
import aiUsageService from './gameData/aiUsageService';

export type ModelType = 'text' | 'function_calling' | 'image' | 'code' | 'audio' | 'video' | 'reasoning' | 'vision';

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
  tier?: 'standard' | 'premium'; // default: 'standard' (Cloudflare)
}

export interface ModelResponse {
  content?: string;
  code?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  functionCalls?: any[];
  model: string;
  provider: 'gemini' | 'cloudflare' | 'local' | 'unknown';
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

export async function route(request: ModelRequest): Promise<ModelResponse | ReadableStream> {
  // Check session quota
  if (sessionService.isOverQuota()) {
    throw new Error('[NEXUS_QUOTA] Session hard cost limit reached. Please reset session or increase quotas.');
  }

  const startTime = Date.now();
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

  if (tier === 'premium' && geminiProvider.isAvailable()) {
    pipeline.push({ provider: 'gemini', executor: routeToGemini });
  } else {
    pipeline.push({ provider: 'cloudflare', executor: routeToCloudflare });
    if (geminiProvider.isAvailable()) {
      pipeline.push({ provider: 'gemini', executor: routeToGemini });
    }
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
        functionDeclarations: request.functionDeclarations
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

    // Video/Audio handled in geminiService.ts usually, but if added here:
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
  stream: boolean = false
): Promise<ModelResponse | ReadableStream> {
  return route({
    type: 'text',
    prompt,
    history,
    systemPrompt,
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
  systemPrompt?: string
): Promise<ModelResponse | ReadableStream> {
  return route({
    type: 'function_calling',
    prompt,
    history,
    systemPrompt,
    functionDeclarations
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

export const modelRouter = {
  route,
  chat,
  chatWithFunctions,
  generateImage,
  completeCode,
  processAudio,
  generateVideo
};

export default modelRouter;
