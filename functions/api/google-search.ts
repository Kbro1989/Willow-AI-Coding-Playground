import type { PagesContext } from '@cloudflare/workers-types';

interface Env {
    GOOGLE_API_KEY?: string;
    GOOGLE_CSE_ID?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    const query = url.searchParams.get('q');
    const cseId = url.searchParams.get('cx') || env.GOOGLE_CSE_ID || '';

    if (!query) {
        return new Response(JSON.stringify({ error: 'Missing query parameter "q"' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    if (!env.GOOGLE_API_KEY) {
        return new Response(JSON.stringify({ error: 'GOOGLE_API_KEY not configured in Pages secrets' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${env.GOOGLE_API_KEY}&cx=${cseId}&q=${encodeURIComponent(query)}`;
        const response = await fetch(searchUrl);
        const data = await response.json();

        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
};
