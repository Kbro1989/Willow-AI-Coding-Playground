import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Build Cloudflare Worker script for Antigravity Engine
 * This creates a bundled worker file for deployment
 */

const BUILD_DIR = 'dist';
const WORKER_OUTPUT = 'dist/_worker.js';

async function buildWorker() {
  console.log('🔨 Building Cloudflare Worker for Antigravity Engine...');

  try {
    // Ensure dist directory exists
    if (!fs.existsSync(BUILD_DIR)) {
      fs.mkdirSync(BUILD_DIR, { recursive: true });
    }

    // Create worker entry point
    console.log('📝 Generating worker file...');
    const workerContent = generateWorkerContent();
    fs.writeFileSync(WORKER_OUTPUT, workerContent);

    console.log('✅ Worker built successfully');
    console.log(`📁 Output: ${WORKER_OUTPUT}`);
    console.log('💡 Note: Run "npm run build" first to compile TypeScript');

  } catch (error) {
    console.error('❌ Worker build failed:', error);
    process.exit(1);
  }
}

function generateWorkerContent() {
  return `// Antigravity Engine Cloudflare Worker
// Auto-generated build file with Integrated AI Orchestration

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // API Helper: AIService Runner
      const runAI = async (model, inputs) => {
        if (!env.AI) {
           // Fallback if AI binding is missing
           throw new Error("Cloudflare AI binding not found. Please bind 'AI' to your Pages project.");
        }
        return await env.AI.run(model, inputs);
      };

      // --- Health Check ---
      if (url.pathname === '/api/health' || url.pathname === '/health') {
        return new Response(JSON.stringify({ 
          status: 'online', 
          version: '5.0.0',
          models: {
            text: ['llama-3.3-70b-fast', 'deepseek-r1-qwen-32b'],
            vision: ['detr-resnet-50'],
            audio: ['whisper', 'melotts'],
            image: ['flux-1-schnell', 'stable-diffusion-xl'],
            tasks: ['m2m100-1.2b', 'bart-large-cnn', 'distilbert-sst-2']
          },
          timestamp: Date.now() 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // --- Chat / Orchestration / Tooling ---
      if (url.pathname === '/api/chat') {
        const body = await request.json();
        const model = body.model === 'DEEPSEEK_R1' 
          ? '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b' 
          : '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
        
        const stream = body.stream !== false;

        // Tooling / Structured Output Simulation
        let systemPrompt = body.systemPrompt || 'You are the Antigravity Engine Assistant.';
        if (body.responseFormat === 'json') {
          systemPrompt += '\\n\\nIMPORTANT: You must respond ONLY with a valid JSON object. Do not include any other text, markdown blocks, or commentary.';
        }
        
        const result = await env.AI.run(model, {
          messages: [
            { role: 'system', content: systemPrompt },
            ...(body.history || []),
            { role: 'user', content: body.message }
          ],
          stream: stream,
          max_tokens: 2048
        });

        if (stream) {
          return new Response(result, {
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive'
            }
          });
        }

        return new Response(JSON.stringify({ 
          response: result.response || result.text,
          model: model,
          tokensUsed: result.usage?.total_tokens || 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // --- Summarization ---
      if (url.pathname === '/api/summarize') {
        const body = await request.json();
        const result = await env.AI.run('@cf/facebook/bart-large-cnn', {
          text: body.text,
          max_length: body.maxLength || 1024
        });
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // --- Translation ---
      if (url.pathname === '/api/translate') {
        const body = await request.json();
        const result = await env.AI.run('@cf/meta/m2m100-1.2b', {
          text: body.text,
          source_lang: body.sourceLang,
          target_lang: body.targetLang
        });
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // --- Image Analysis (Object Detection) ---
      if (url.pathname === '/api/analyze-image') {
        const body = await request.json();
        const imageData = body.image.startsWith('data:') 
          ? Uint8Array.from(atob(body.image.split(',')[1]), c => c.charCodeAt(0))
          : await fetch(body.image).then(r => r.arrayBuffer());

        const result = await env.AI.run('@cf/google/detr-resnet-50', {
          image: [...new Uint8Array(imageData)]
        });
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // --- Text Classification (Sentiment) ---
      if (url.pathname === '/api/classify-text') {
        const body = await request.json();
        const result = await env.AI.run('@cf/huggingface/distilbert-base-uncased-finetuned-sst-2-english', {
          text: body.text
        });
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // --- Image Generation ---
      if (url.pathname === '/api/generate' || url.pathname === '/api/generate-image') {
        const body = await request.json();
        const model = body.model === 'FLUX' 
          ? '@cf/black-forest-labs/flux-1-schnell' 
          : '@cf/stabilityai/stable-diffusion-xl-base-1.0';
        
        const response = await env.AI.run(model, {
          prompt: body.prompt,
          num_steps: body.model === 'FLUX' ? 4 : 30
        });

        // Match text-to-image-template: return raw binary
        return new Response(response, {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'image/png' 
          }
        });
      }

      // --- Speech (TTS) ---
      if (url.pathname === '/api/speech' || url.pathname === '/api/text-to-speech') {
        const body = await request.json();
        const result = await runAI('@cf/myshell-ai/melotts-english', {
          text: body.text
        });

        return new Response(result, {
          headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg' }
        });
      }

      // --- Transcribe (STT) ---
      if (url.pathname === '/api/transcribe') {
        const body = await request.json();
        // Whisper expects raw binary. Convert base64 if provided.
        let audioData;
        if (typeof body.audio === 'string') {
          const base64 = body.audio.includes('base64,') ? body.audio.split('base64,')[1] : body.audio;
          const binaryString = atob(base64);
          audioData = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            audioData[i] = binaryString.charCodeAt(i);
          }
        } else {
          audioData = body.audio;
        }

        const result = await runAI('@cf/openai/whisper', {
          audio: Array.from(audioData)
        });

        return new Response(JSON.stringify({ text: result.text }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // --- Video Generation ---
      if (url.pathname === '/api/video') {
         const body = await request.json();
         let imageBase64 = body.image;

         // If only prompt is provided, generate a base image first
         if (!imageBase64 && body.prompt) {
            const sdResult = await runAI('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
              prompt: body.prompt,
              num_steps: 20
            });
            // Convert binary image to base64 for SVD
            const arrayBuffer = await sdResult.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < uint8Array.byteLength; i++) {
                binary += String.fromCharCode(uint8Array[i]);
            }
            imageBase64 = btoa(binary);
         }

         if (!imageBase64) {
            throw new Error("Video generation requires either an 'image' (base64) or a 'prompt' to generate one.");
         }

         const result = await runAI('@cf/stabilityai/stable-video-diffusion-img2vid-xt', {
           image: imageBase64,
           num_steps: 25
         });
         return new Response(result, {
           headers: { ...corsHeaders, 'Content-Type': 'video/mp4' }
         });
      }

      // --- Registry / Logs ---
      if (url.pathname === '/api/logs') {
        if (request.method === 'POST') {
          const log = await request.json();
          const logId = 'log:' + Date.now() + ':' + Math.random().toString(36).slice(2, 8);
          
          if (env.SESSION_KV) {
            await env.SESSION_KV.put(logId, JSON.stringify(log), { expirationTtl: 86400 }); // 24h retention
          }
          
          return new Response(JSON.stringify({ success: true, id: logId }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // GET: Fetch recent logs from KV
        if (env.SESSION_KV) {
          const list = await env.SESSION_KV.list({ prefix: 'log:', limit: 100 });
          const logs = await Promise.all(
            list.keys.map(k => env.SESSION_KV.get(k.name, 'json'))
          );
          return new Response(JSON.stringify(logs.filter(Boolean)), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Default
      return new Response(JSON.stringify({ error: 'Endpoint not found', endpoint: url.pathname }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Worker Execution Error', 
        message: error.message,
        stack: error.stack
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
`;
}

// Run the build process
buildWorker().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
});
