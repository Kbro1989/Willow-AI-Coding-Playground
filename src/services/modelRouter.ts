/**
 * Unified Model Router
 * Routes requests to Gemini (paid) first, falls back to Cloudflare (free)
 */

import geminiProvider, { GeminiTextRequest, GeminiImageRequest, GeminiCodeRequest } from './geminiProvider';
import cloudflareProvider from './cloudflareProvider';
import aiUsageService from './gameData/aiUsageService';

export type ModelType = 'text' | 'function_calling' | 'image' | 'code' | 'audio' | 'video' | 'reasoning';

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
  functionCalls?: any[];
  model: string;
  provider: 'gemini' | 'cloudflare';
  latency: number;
  tokensUsed?: number;
}

/**
 * Route model request to best available provider
 * Strategy: "Cloudflare First" (Cost Optimization)
 */


export async function route(request: ModelRequest): Promise<ModelResponse> {
  const startTime = Date.now();
  const tier = request.tier || 'standard';
  let response: ModelResponse | undefined;

  try {
    // capabilities restricted to Gemini (Premium)
    const isGeminiExclusive = false;

    // 1. Premium Route (Explicit or Exclusive)
    if (tier === 'premium' || isGeminiExclusive) {
      // ... (existing logic)
      if (geminiProvider.isAvailable()) {
        console.log(`[ROUTER] Routing to Gemini (Premium/Exclusive) for ${request.type}...`);
        const result = await routeToGemini(request);
        response = { ...result, provider: 'gemini', latency: Date.now() - startTime };
      } else if (isGeminiExclusive) {
        throw new Error(`${request.type} requires Gemini API key`);
      }
    }

    if (!response) {
      // 2. Standard Route (Cloudflare)
      console.log(`[ROUTER] Routing to Cloudflare (Standard) for ${request.type}...`);
      try {
        const result = await routeToCloudflare(request);
        response = { ...result, provider: 'cloudflare', latency: Date.now() - startTime };
      } catch (error) {
        console.error('[ROUTER] Cloudflare failed:', error);
        // 3. Last Resort: Try Gemini if we haven't already
        if (tier !== 'premium' && geminiProvider.isAvailable()) {
          console.warn('[ROUTER] Cloudflare failed, falling back to Gemini (Rescue)...');
          const result = await routeToGemini(request);
          response = { ...result, provider: 'gemini', latency: Date.now() - startTime };
        } else {
          throw error;
        }
      }
    }

    // Log usage to InstantDB
    if (response) {
      const cost = aiUsageService.calculateCost(
        response.provider,
        response.model,
        request.prompt.length / 4, // Approx input tokens
        response.tokensUsed || (response.content?.length || 0) / 4 // Approx output tokens
      );

      // Fire and forget logging
      aiUsageService.logAIUsage({
        model: response.model,
        provider: response.provider,
        taskType: request.type as any,
        inputTokens: Math.ceil(request.prompt.length / 4),
        outputTokens: response.tokensUsed || Math.ceil((response.content?.length || 0) / 4),
        cost,
        duration: response.latency,
        success: true
      }).catch(err => console.error('[ROUTER] Failed to log usage:', err));
    }

    return response!;

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
  }
}

/**
 * Route to Gemini provider
 */
async function routeToGemini(request: ModelRequest): Promise<Omit<ModelResponse, 'provider' | 'latency'>> {
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
async function routeToCloudflare(request: ModelRequest): Promise<Omit<ModelResponse, 'provider' | 'latency'>> {
  switch (request.type) {
    case 'text':
    case 'function_calling': {
      const response = await cloudflareProvider.textChat({
        prompt: request.prompt,
        history: request.history,
        systemPrompt: request.systemPrompt,
        functionDeclarations: request.functionDeclarations
      });

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
      });

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
      });

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
        // Return base64 audio in content? Or a new field? 
        // ModelResponse has imageUrl/code/content. Let's force it into 'content' as data URI or something.
        // Or add audioUrl to ModelResponse?
        // For now, standardizing on content as base64 or creating a hack.
        // Ideally we update ModelResponse. Let's leverage 'imageUrl' as 'videoUrl/audioUrl' generic? 
        // No, let's put it in content with a prefix or just raw base64.
        return {
          content: response.audioBase64,
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
        imageUrl: response.videoUrl, // Storing in imageUrl for compatibility or generic 'content'
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
  systemPrompt?: string
): Promise<ModelResponse> {
  return route({
    type: 'text',
    prompt,
    history,
    systemPrompt
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
): Promise<ModelResponse> {
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
): Promise<ModelResponse> {
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
): Promise<ModelResponse> {
  return route({
    type: 'code',
    prompt,
    language,
    context
  });
}

export const modelRouter = {
  route,
  chat,
  chatWithFunctions,
  generateImage,
  completeCode
};

export default modelRouter;
