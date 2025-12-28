import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        server: {
            port: 3000,
            host: '0.0.0.0',
        },
        plugins: [react()],
        envPrefix: ['VITE_', 'REACT_APP_'],
        define: {
            // Creates a global process.env object to prevent AI library crashes
            'process.env': {
                // ...env, // Do not expose all env vars
                NODE_ENV: JSON.stringify(mode),
            },
            // Support both REACT_APP_ (docs) and VITE_ (Vite standard) prefixes
            'process.env.GEMINI_API_KEY': JSON.stringify(env.REACT_APP_GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ''),
            'process.env.REACT_APP_GEMINI_API_KEY': JSON.stringify(env.REACT_APP_GEMINI_API_KEY || ''),
            'process.env.REACT_APP_CLOUDFLARE_API_KEY': JSON.stringify(env.REACT_APP_CLOUDFLARE_API_KEY || ''),
            'process.env.REACT_APP_ENVIRONMENT': JSON.stringify(env.REACT_APP_ENVIRONMENT || 'development'),
        },
        resolve: {
            alias: [
                { find: '@', replacement: path.resolve(process.cwd(), './src') },
                { find: 'three', replacement: path.resolve(process.cwd(), './node_modules/three') },
                { find: 'fs/promises', replacement: path.resolve(process.cwd(), 'src', 'mocks', 'fs.ts') },
                { find: 'fs', replacement: path.resolve(process.cwd(), 'src', 'mocks', 'fs.ts') },
            ]
        }
    };
});
