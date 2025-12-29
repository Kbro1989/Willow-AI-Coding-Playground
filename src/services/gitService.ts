/**
 * Source Control (Git) Service
 * Interacts with the Cloudflare Worker to perform Git operations
 */

// Bridge-relay worker hosts the /api/git endpoint
const WORKER_URL = 'https://antigravity-bridge-relay.kristain33rs.workers.dev';

export const getGitStatus = async (): Promise<{ staged: string[], unstaged: string[] }> => {
  try {
    const response = await fetch(`${WORKER_URL}/api/git`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command: 'status' }),
    });

    if (!response.ok) {
      return { staged: [], unstaged: [] };
    }

    return await response.json();
  } catch (error) {
    console.error('[GIT_SERVICE] Failed to get status:', error);
    return { staged: [], unstaged: [] };
  }
};

export const commitChanges = async (message: string): Promise<{ success: boolean, commitId: string }> => {
  try {
    const response = await fetch(`${WORKER_URL}/api/git`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command: 'commit', message }),
    });

    if (!response.ok) {
      return { success: false, commitId: '' };
    }

    return await response.json();
  } catch (error) {
    console.error('[GIT_SERVICE] Failed to commit changes:', error);
    return { success: false, commitId: '' };
  }
}

export const getBranches = async (): Promise<{ current: string, all: string[] }> => {
  try {
    const response = await fetch(`${WORKER_URL}/api/git`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'branches' }),
    });
    if (!response.ok) return { current: 'main', all: ['main'] };
    return await response.json();
  } catch (error) {
    console.error('[GIT_SERVICE] Failed to get branches:', error);
    return { current: 'main', all: ['main'] };
  }
};

export const createBranch = async (name: string): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(`${WORKER_URL}/api/git`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'checkout-b', name }),
    });
    return { success: response.ok };
  } catch (error) {
    console.error(`[GIT_SERVICE] Failed to create branch ${name}:`, error);
    return { success: false };
  }
};
