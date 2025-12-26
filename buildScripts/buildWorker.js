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
const WORKER_OUTPUT = 'dist/worker.js';

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
// Auto-generated build file

// Main worker entry point
export default {
  async fetch(request, env, ctx) {
    try {
      // Parse the request
      const url = new URL(request.url);
      
      // CORS headers
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };
      
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }
      
      // Route handling
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Default response
      return new Response(JSON.stringify({
        message: 'Antigravity Engine Worker',
        version: '4.2',
        endpoints: ['/health', '/api/*']
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  },
  
  // Scheduled tasks
  async scheduled(event, env, ctx) {
    console.log('Scheduled task triggered:', event.cron);
    
    switch (event.cron) {
      case '0 */6 * * *': // Every 6 hours
        console.log('Running periodic cleanup...');
        break;
        
      case '0 0 * * *': // Daily
        console.log('Running daily analytics...');
        break;
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
