/**
 * Engine Logging Service - Nexus Standard
 * Centralized logging for tasks, model usage, audit events, and observability.
 */

const WORKER_URL = import.meta.env.VITE_AI_WORKER_URL || 'https://ai-game-studio.kristain33rs.workers.dev';

export interface NexusLog {
  taskId: string;
  step: string;
  status: 'success' | 'failure' | 'pending';
  duration?: number;
  metadata?: any;
  timestamp: number;
}

export interface AuditEvent {
  event: string;
  action: string;
  userId?: string;
  data?: any;
  timestamp: number;
  severity: 'info' | 'warn' | 'error' | 'critical';
}

// In-memory audit trail (for dashboard display)
const auditTrail: AuditEvent[] = [];
const MAX_AUDIT_ENTRIES = 1000;

/**
 * Log a specific task transition or outcome
 */
export const logTask = async (log: NexusLog): Promise<{ success: boolean }> => {
  try {
    console.log(`[NEXUS_LOG] Task: ${log.taskId} | Step: ${log.step} | Status: ${log.status}`);

    const response = await fetch(`${WORKER_URL}/api/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });

    return { success: response.ok };
  } catch (error) {
    console.error('[LOGGING_SERVICE] Task log failed:', error);
    return { success: false };
  }
};

/**
 * Standardize model usage metrics collection
 */
export const logModelUsage = async (usage: {
  model: string,
  provider: string,
  tokens: number,
  cost: number
}) => {
  return await logTask({
    taskId: 'system-metrics',
    step: 'MODEL_USAGE',
    status: 'success',
    metadata: usage,
    timestamp: Date.now()
  });
};

/**
 * Log an audit event (security, access, actions)
 */
export const logAudit = (event: string, action: string, data?: any, severity: AuditEvent['severity'] = 'info'): AuditEvent => {
  const auditEvent: AuditEvent = {
    event,
    action,
    data,
    severity,
    timestamp: Date.now()
  };

  // Console log with severity prefix
  const prefix = `[AUDIT:${severity.toUpperCase()}]`;
  if (severity === 'critical' || severity === 'error') {
    console.error(`${prefix} ${event}: ${action}`, data || '');
  } else if (severity === 'warn') {
    console.warn(`${prefix} ${event}: ${action}`, data || '');
  } else {
    console.log(`${prefix} ${event}: ${action}`, data || '');
  }

  // Add to in-memory trail
  auditTrail.push(auditEvent);

  // Trim if over max
  if (auditTrail.length > MAX_AUDIT_ENTRIES) {
    auditTrail.shift();
  }

  // Dispatch event for dashboard
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nexus:audit', { detail: auditEvent }));
  }

  return auditEvent;
};

/**
 * Log security-related events
 */
export const logSecurityEvent = (action: string, data?: any) => {
  return logAudit('SECURITY', action, data, 'warn');
};

/**
 * Log AI model access
 */
export const logAIAccess = (model: string, prompt: string, success: boolean) => {
  return logAudit('AI_ACCESS', success ? 'success' : 'failure', {
    model,
    promptLength: prompt.length,
    timestamp: Date.now()
  }, success ? 'info' : 'error');
};

/**
 * Log file system access
 */
export const logFileAccess = (operation: string, path: string, success: boolean) => {
  return logAudit('FILE_ACCESS', operation, { path, success }, success ? 'info' : 'warn');
};

/**
 * Get audit trail (for dashboard)
 */
export const getAuditTrail = (limit = 100, severity?: AuditEvent['severity']): AuditEvent[] => {
  let filtered = auditTrail;

  if (severity) {
    filtered = auditTrail.filter(e => e.severity === severity);
  }

  return filtered.slice(-limit).reverse();
};

/**
 * Fetch logs for observability dashboards
 */
export const getLogs = async (): Promise<NexusLog[]> => {
  try {
    const response = await fetch(`${WORKER_URL}/api/logs`);
    return response.ok ? await response.json() : [];
  } catch (error) {
    console.error('[LOGGING_SERVICE] Fetch logs failed:', error);
    return [];
  }
};

export default {
  logTask,
  logModelUsage,
  logAudit,
  logSecurityEvent,
  logAIAccess,
  logFileAccess,
  getAuditTrail,
  getLogs
};
