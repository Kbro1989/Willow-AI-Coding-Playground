/**
 * RSMV Model Data Service
 * Interacts with the Cloudflare Worker to fetch RSMV model data
 */

import { RSMVModelEntry, GameSource, ModelCategory } from '../components/RSMVBrowser';

const WORKER_URL = 'https://ai-game-studio.kristain33rs.workers.dev';

export const JAGEX_LAUNCHER_PATHS = {
  root: 'C:\\Program Files (x86)\\Jagex Launcher',
  games: 'C:\\Program Files (x86)\\Jagex Launcher\\Games',
  launcher: 'C:\\Program Files (x86)\\Jagex Launcher\\JagexLauncher.exe',
  libcef: 'C:\\Program Files (x86)\\Jagex Launcher\\libcef.dll',
  vulkan: 'C:\\Program Files (x86)\\Jagex Launcher\\vulkan-1.dll'
};

export const verifyJagexLauncher = async (): Promise<boolean> => {
  try {
    // Check critical launcher components via window.agentAPI
    if (!(window as any).agentAPI) return false;

    const [launcher, games] = await Promise.all([
      (window as any).agentAPI.fs.stat(JAGEX_LAUNCHER_PATHS.launcher),
      (window as any).agentAPI.fs.stat(JAGEX_LAUNCHER_PATHS.games)
    ]);

    return !!(launcher.success && games.success);
  } catch (err) {
    console.error('[RSMV_SERVICE] Verification failed:', err);
    return false;
  }
};

export const getRsmvModels = async (gameSource: GameSource, category: ModelCategory): Promise<RSMVModelEntry[]> => {
  try {
    // If local launcher is verified, we could potentially inject local data here
    // For now, we fetch from cloud but signal the "linked" state in the UI
    const response = await fetch(`${WORKER_URL}/api/rsmv/${gameSource}/${category}`);
    if (!response.ok) {
      return [];
    }
    return await response.json() as RSMVModelEntry[];
  } catch (error) {
    console.error('[RSMV_SERVICE] Failed to fetch models:', error);
    return [];
  }
};
