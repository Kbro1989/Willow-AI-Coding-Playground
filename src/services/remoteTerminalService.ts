/**
 * Remote Terminal Service
 * Fallback for when local bridge is unavailable.
 * NOTE: True terminal commands require local machine access.
 * In cloud-only mode, this returns a helpful message.
 */

const getWorkerUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname.includes('pages.dev')) {
    return '';
  }
  return 'https://willow-ai-coding-playground.pages.dev';
};

export const executeRemoteCommand = async (command: string): Promise<{ output: string } | null> => {
  // In cloud-only mode, we can't execute arbitrary shell commands
  // This is a security limitation by design

  // Special commands that CAN work in cloud mode
  if (command.startsWith('echo ')) {
    return { output: command.substring(5) };
  }

  if (command === 'pwd' || command === 'cd') {
    return { output: '/cloud (virtual)' };
  }

  if (command === 'date') {
    return { output: new Date().toISOString() };
  }

  if (command === 'whoami') {
    return { output: 'cloud-user@antigravity-studio' };
  }

  // Try to proxy to worker if available
  try {
    const workerUrl = getWorkerUrl();
    const response = await fetch(`${workerUrl}/api/terminal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    // Worker doesn't have terminal endpoint, that's expected
  }

  // Return helpful message about cloud-only limitations
  return {
    output: `⚠️ CLOUD MODE: Terminal commands require local bridge.\n` +
      `Command "${command}" cannot be executed in cloud-only mode.\n\n` +
      `To enable terminal access:\n` +
      `  1. Start the local agent: node bridge/agent.js\n` +
      `  2. Or connect via relay: $env:RELAY_URL="wss://antigravity-bridge-relay.kristain33rs.workers.dev/bridge/1"\n`
  };
};
