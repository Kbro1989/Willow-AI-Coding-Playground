/**
 * Cloud File System Service
 * Fallback for when local bridge is unavailable.
 * Uses Cloudflare R2 through the main worker API.
 */

// The main Pages/Worker URL that hosts the app
// In cloud-only mode, we use the deployed Pages functions
const getWorkerUrl = () => {
  // In production, use relative URL (same origin)
  if (typeof window !== 'undefined' && window.location.hostname.includes('pages.dev')) {
    return '';
  }
  // For local dev pointing to cloud, use the deployed URL
  return 'https://willow-ai-coding-playground.pages.dev';
};

/**
 * Cloud file storage - saves to R2 bucket via worker
 */
export const readCloudFile = async (path: string): Promise<string | null> => {
  try {
    const workerUrl = getWorkerUrl();
    const response = await fetch(`${workerUrl}/api/storage/${encodeURIComponent(path)}`);
    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`[CLOUD_FS] File not found: ${path}`);
        return null;
      }
      throw new Error(`Failed to read: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`[CLOUD_FS] Read error (${path}):`, error);
    return null;
  }
};

export const writeCloudFile = async (path: string, content: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const workerUrl = getWorkerUrl();
    const response = await fetch(`${workerUrl}/api/storage/${encodeURIComponent(path)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: content,
    });
    if (!response.ok) {
      throw new Error(`Failed to write: ${response.status}`);
    }
    return { success: true };
  } catch (error) {
    console.error(`[CLOUD_FS] Write error (${path}):`, error);
    return { success: false, message: String(error) };
  }
};

export const deleteCloudFile = async (path: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const workerUrl = getWorkerUrl();
    const response = await fetch(`${workerUrl}/api/storage/${encodeURIComponent(path)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete: ${response.status}`);
    }
    return { success: true };
  } catch (error) {
    console.error(`[CLOUD_FS] Delete error (${path}):`, error);
    return { success: false, message: String(error) };
  }
};

export const listCloudFiles = async (prefix?: string): Promise<string[]> => {
  try {
    const workerUrl = getWorkerUrl();
    const url = prefix
      ? `${workerUrl}/api/storage?prefix=${encodeURIComponent(prefix)}`
      : `${workerUrl}/api/storage`;
    const response = await fetch(url);
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data : (data.files || []);
  } catch (error) {
    console.error("[CLOUD_FS] List error:", error);
    return [];
  }
};
