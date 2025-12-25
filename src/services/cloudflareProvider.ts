/**
 * Cloudflare Workers AI Provider
 * PRIMARY BUFFER for all basic AI tasks
 * Supports all free-tier Workers AI models from developers.cloudflare.com/workers-ai/models
 */

const WORKER_URL = 'https://ai-game-studio.kristain33rs.workers.dev';

export interface CloudflareTextRequest {
  prompt: string;
  history?: Array<{ role: 'user' | 'model'; content: string }>;
  systemPrompt?: string;
  functionDeclarations?: any[];
}

export interface CloudflareTextResponse {
  content: string;
  functionCalls?: any[];
  model: string;
  tokensUsed?: number;
}

export interface CloudflareImageRequest {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16';
}

export interface CloudflareCodeRequest {
  prompt: string;
  language?: string;
  context?: string;
}

class CloudflareProvider {
  private workerUrl: string;

  constructor(workerUrl: string = WORKER_URL) {
    this.workerUrl = workerUrl;
  }

  /**
   * Cloudflare is always available (generous free tier)
   */
  isAvailable(): boolean {
    return true;
  }

  /**
   * Chat using Llama 3.1 70B (PRIMARY for general conversation)
   * Model: @cf/meta/llama-3.1-70b-instruct
   */
  async chatWithLlama(
    prompt: string,
    history: Array<{ role: 'user' | 'model'; content: string }> = [],
    systemPrompt?: string
  ): Promise<CloudflareTextResponse> {
    try {
      const response = await fetch(`${this.workerUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          history,
          systemPrompt,
          model: '@cf/meta/llama-3.1-70b-instruct'
        })
      });

      if (!response.ok) {
        throw new Error(`Cloudflare API error: ${response.status}`);
      }

      const data = await response.json() as any;

      return {
        content: data.response || data.text,
        model: '@cf/meta/llama-3.1-70b-instruct',
        tokensUsed: data.tokensUsed || data.usage?.total_tokens
      };
    } catch (error) {
      console.error('[CF/LLAMA] Chat error:', error);
      throw error;
    }
  }

  /**
   * Code generation using Qwen 2.5 Coder (PRIMARY for code tasks)
   * Model: @cf/qwen/qwen2.5-coder-32b-instruct
   */
  async codeWithQwen(
    prompt: string,
    language: string = 'typescript'
  ): Promise<{ code: string; model: string }> {
    try {
      const response = await fetch(`${this.workerUrl}/api/code-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          language,
          model: '@cf/qwen/qwen2.5-coder-32b-instruct'
        })
      });

      if (!response.ok) {
        throw new Error(`Cloudflare API error: ${response.status}`);
      }

      const data = await response.json() as any;

      return {
        code: data.completion || data.code || data.response,
        model: '@cf/qwen/qwen2.5-coder-32b-instruct'
      };
    } catch (error) {
      console.error('[CF/QWEN] Code generation error:', error);
      throw error;
    }
  }

  /**
   * Reasoning using QwQ 32B (PRIMARY for step-by-step logic)
   * Model: @cf/qwq/qwq-32b-preview
   */
  async reasonWithQwQ(problem: string): Promise<{ solution: string; model: string }> {
    try {
      const response = await fetch(`${this.workerUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Think step-by-step and solve this problem:\n\n${problem}`,
          model: '@cf/qwq/qwq-32b-preview',
          systemPrompt: 'You are a reasoning AI. Break down complex problems into clear logical steps.'
        })
      });

      if (!response.ok) {
        throw new Error(`Cloudflare API error: ${response.status}`);
      }

      const data = await response.json() as any;

      return {
        solution: data.response || data.text,
        model: '@cf/qwq/qwq-32b-preview'
      };
    } catch (error) {
      console.error('[CF/QWQ] Reasoning error:', error);
      throw error;
    }
  }

  /**
   * Reasoning using DeepSeek R1 distilled (ALTERNATIVE reasoning model)
   * Model: @cf/deepseek-ai/deepseek-r1-distill-qwen-32b
   */
  async reasonWithDeepSeek(problem: string): Promise<{ solution: string; model: string }> {
    try {
      const response = await fetch(`${this.workerUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: problem,
          model: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
          systemPrompt: 'You are DeepSeek R1, a thinking model. Show your reasoning process.'
        })
      });

      if (!response.ok) {
        throw new Error(`Cloudflare API error: ${response.status}`);
      }

      const data = await response.json() as any;

      return {
        solution: data.response || data.text,
        model: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b'
      };
    } catch (error) {
      console.error('[CF/DEEPSEEK] Reasoning error:', error);
      throw error;
    }
  }

  /**
   * Image generation using Stable Diffusion XL (PRIMARY for textures/assets)
   * Model: @cf/stabilityai/stable-diffusion-xl-base-1.0
   */
  async imageWithSDXL(
    prompt: string,
    negativePrompt?: string
  ): Promise<{ imageUrl: string; model: string }> {
    try {
      const response = await fetch(`${this.workerUrl}/api/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          negativePrompt,
          model: '@cf/stabilityai/stable-diffusion-xl-base-1.0'
        })
      });

      if (!response.ok) {
        throw new Error(`Cloudflare API error: ${response.status}`);
      }

      const data = await response.json() as any;

      return {
        imageUrl: data.imageUrl || data.url || data.image,
        model: '@cf/stabilityai/stable-diffusion-xl-base-1.0'
      };
    } catch (error) {
      console.error('[CF/SDXL] Image generation error:', error);
      throw error;
    }
  }

  /**
   * Fast image generation using Flux Schnell (FAST alternative)
   * Model: @cf/black-forest-labs/flux-1-schnell
   */
  async imageWithFlux(prompt: string): Promise<{ imageUrl: string; model: string }> {
    try {
      const response = await fetch(`${this.workerUrl}/api/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: '@cf/black-forest-labs/flux-1-schnell'
        })
      });

      if (!response.ok) {
        throw new Error(`Cloudflare API error: ${response.status}`);
      }

      const data = await response.json() as any;

      return {
        imageUrl: data.imageUrl || data.url || data.image,
        model: '@cf/black-forest-labs/flux-1-schnell'
      };
    } catch (error) {
      console.error('[CF/FLUX] Image generation error:', error);
      throw error;
    }
  }

  /**
   * Translation using M2M100 (for multilingual support)
   * Model: @cf/meta/m2m100-1.2b
   */
  async translate(
    text: string,
    sourceLang: string = 'en',
    targetLang: string = 'es'
  ): Promise<{ translation: string; model: string }> {
    try {
      const response = await fetch(`${this.workerUrl}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sourceLang,
          targetLang,
          model: '@cf/meta/m2m100-1.2b'
        })
      });

      if (!response.ok) {
        throw new Error(`Cloudflare API error: ${response.status}`);
      }

      const data = await response.json() as any;

      return {
        translation: data.translation || data.text,
        model: '@cf/meta/m2m100-1.2b'
      };
    } catch (error) {
      console.error('[CF/M2M100] Translation error:', error);
      throw error;
    }
  }

  /**
   * Speech-to-Text using Whisper
   * Model: @cf/openai/whisper
   */
  async transcribe(audioBase64: string): Promise<{ text: string; model: string }> {
    try {
      // Convert base64 to binary for the worker (or send as json if worker handles it)
      // Standard worker expectation is often binary body for audio
      // But for our JSON api wrapper:
      const response = await fetch(`${this.workerUrl}/api/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: audioBase64,
          model: '@cf/openai/whisper'
        })
      });

      if (!response.ok) {
        throw new Error(`Cloudflare API error: ${response.status}`);
      }

      const data = await response.json() as any;

      return {
        text: data.text || data.result?.text,
        model: '@cf/openai/whisper'
      };
    } catch (error) {
      console.error('[CF/WHISPER] Transcription error:', error);
      throw error;
    }
  }

  /**
   * Text-to-Speech using MeloTTS
   * Model: @cf/myshell-ai/melotts
   */
  async synthesizeAudio(text: string): Promise<{ audioBase64: string; model: string }> {
    try {
      // Warning: This model assumes English ('en') by default
      const response = await fetch(`${this.workerUrl}/api/text-to-speech`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          model: '@cf/myshell-ai/melotts-english' // Specific endpoint for English
        })
      });

      if (!response.ok) {
        throw new Error(`Cloudflare API error: ${response.status}`);
      }

      const data = await response.json() as any;

      return {
        audioBase64: data.audio || data.result,
        model: '@cf/myshell-ai/melotts'
      };
    } catch (error) {
      console.error('[CF/MELOTTS] TTS error:', error);
      throw error;
    }
  }

  /**
   * Text embeddings using BGE (for semantic search)
   * Model: @cf/baai/bge-large-en-v1.5
   */
  async embed(text: string): Promise<{ embedding: number[]; model: string }> {
    try {
      const response = await fetch(`${this.workerUrl}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          model: '@cf/baai/bge-large-en-v1.5'
        })
      });

      if (!response.ok) {
        throw new Error(`Cloudflare API error: ${response.status}`);
      }

      const data = await response.json() as any;

      return {
        embedding: data.embedding || data.data,
        model: '@cf/baai/bge-large-en-v1.5'
      };
    } catch (error) {
      console.error('[CF/BGE] Embedding error:', error);
      throw error;
    }
  }

  // Legacy methods for compatibility
  async textChat(request: CloudflareTextRequest): Promise<CloudflareTextResponse> {
    return this.chatWithLlama(request.prompt, request.history, request.systemPrompt);
  }

  async generateImage(request: CloudflareImageRequest): Promise<{ imageUrl: string; model: string }> {
    return this.imageWithSDXL(request.prompt, request.negativePrompt);
  }

  async codeCompletion(request: CloudflareCodeRequest): Promise<{ code: string; model: string }> {
    return this.codeWithQwen(request.prompt, request.language);
  }
  /**
   * Generate video from text or image using Stable Video Diffusion
   * (If text is provided, generates image first)
   */
  async generateVideo(prompt: string, imageBase64?: string): Promise<{ videoUrl: string; model: string }> {
    try {
      let sourceImage = imageBase64;

      // Step 1: Text-to-Image (if no image provided)
      if (!sourceImage) {
        console.log('[CF/VIDEO] Generating base image for video...');
        const imgResult = await this.imageWithSDXL(prompt, "blurry, nsfw, text, bad quality");
        sourceImage = imgResult.imageUrl;
      }

      // Step 2: Image-to-Video
      console.log('[CF/VIDEO] Synthesizing video from base image...');
      // Ensure no prefix for the API call if it expects raw base64
      const rawBase64 = sourceImage?.includes('base64,') ? sourceImage.split('base64,')[1] : sourceImage;

      // Cloudflare Workers AI often supports a generic header-passed model runner or specific endpoints.
      // We will assume the worker has a generic '/api/run-model' or we use the specific known endpoint pattern if available.
      // Currently, we'll try the generic pattern seen in other integrations or a direct specific path if standard.
      const response = await fetch(`${this.workerUrl}/api/run-model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: rawBase64,
          num_steps: 30,
          model: '@cf/stabilityai/stable-video-diffusion-img2vid-xt'
        })
      });

      if (!response.ok) {
        // Fallback: If run-model doesn't exist, try a specific named endpoint that might exist on their worker
        console.warn('[CF/VIDEO] Generic run-model failed, trying specific video endpoint...');
        const fallbackResponse = await fetch(`${this.workerUrl}/api/video-generation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: rawBase64 })
        });

        if (!fallbackResponse.ok) throw new Error(`Cloudflare API error: ${response.status}`);

        const fallbackData = await fallbackResponse.json() as any;
        return {
          videoUrl: `data:video/mp4;base64,${fallbackData.result?.video || fallbackData.video}`,
          model: '@cf/stabilityai/stable-video-diffusion-img2vid-xt'
        };
      }

      const data = await response.json() as any;

      return {
        videoUrl: `data:video/mp4;base64,${data.result?.video || data.video || data.result}`,
        model: '@cf/stabilityai/stable-video-diffusion-img2vid-xt'
      };

    } catch (error) {
      console.error('[CF/VIDEO] Video generation error:', error);
      throw error;
    }
  }

}

export const cloudflareProvider = new CloudflareProvider();
export default cloudflareProvider;
