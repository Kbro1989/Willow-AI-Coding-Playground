// Cloudflare runtime types are provided at execution time in Pages Functions.
// Casting to any to avoid local TypeScript environment errors for R2Bucket and PagesFunction.

export const onRequest: any = async (context: any) => {
    const { request, env } = context;
    const method = request.method;

    // STORAGE is the R2 bucket binding
    const storage = (env as any).STORAGE;

    // Check if R2 binding exists
    if (!storage) {
        // If no R2, return empty results for list, 404 for reads
        if (method === 'GET' && (!path || path === '')) {
            return new Response(JSON.stringify({ files: [], message: 'R2 not configured' }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        return new Response(JSON.stringify({ error: 'Storage not configured' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace('/api/storage/', '').replace('/api/storage', '');
    const prefix = url.searchParams.get('prefix');

    try {
        switch (method) {
            case 'GET': {
                // List files if no path
                if (!path || path === '') {
                    const options: any = prefix ? { prefix } : {};
                    const list = await storage.list(options);
                    const files = list.objects.map((obj: any) => obj.key);
                    return new Response(JSON.stringify({ files }), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                // Read file
                const object = await storage.get(path);
                if (!object) {
                    return new Response(JSON.stringify({ error: 'Not found' }), {
                        status: 404,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                return new Response(object.body, {
                    headers: {
                        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream'
                    }
                });
            }

            case 'PUT': {
                // Write file
                if (!path) {
                    return new Response(JSON.stringify({ error: 'Path required' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                const body = await request.arrayBuffer();
                await storage.put(path, body, {
                    httpMetadata: { contentType: request.headers.get('Content-Type') || 'application/octet-stream' }
                });
                return new Response(JSON.stringify({ success: true, path }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            case 'DELETE': {
                // Delete file
                if (!path) {
                    return new Response(JSON.stringify({ error: 'Path required' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                await storage.delete(path);
                return new Response(JSON.stringify({ success: true }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            default:
                return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                    status: 405,
                    headers: { 'Content-Type': 'application/json' }
                });
        }
    } catch (error) {
        console.error('[Storage API Error]', error);
        return new Response(JSON.stringify({ error: 'Internal error', message: String(error) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
