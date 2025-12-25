/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GEMINI_API_KEY: string
    readonly VITE_CLOUDFLARE_API_KEY: string
    readonly VITE_CLOUDFLARE_ACCOUNT_ID: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
