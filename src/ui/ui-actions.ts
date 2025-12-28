import {
    ActiveView,
    AIModelMode,
    ProjectEnv,
    GameAsset,
    SceneObject,
    FileId,
    TaskId
} from '../types';

/**
 * UI ACTION TYPES
 * Authoritative set of all intents that can be triggered from the UI.
 */
export type UIAction =
    | { type: 'NAV_SWITCH_VIEW'; view: ActiveView }
    | { type: 'ENV_SET_PROJECT_ENV'; env: ProjectEnv }
    | { type: 'AI_SET_MODE'; mode: AIModelMode }
    | { type: 'SYSTEM_PANIC' }
    | { type: 'SYSTEM_TOGGLE_PERFORMANCE_HUD' }
    | { type: 'SYSTEM_TOGGLE_KEY_MANAGER' }
    | { type: 'SYSTEM_TOGGLE_AI_PANEL' }
    | { type: 'BRIDGE_TOGGLE_RELAY' }
    | { type: 'EDITOR_OPEN_FILE'; fileId: FileId }
    | { type: 'EDITOR_SAVE_ACTIVE' }
    | { type: 'EDITOR_FORMAT_ACTIVE' }
    | { type: 'FILE_SELECT'; path: string }
    | { type: 'FILE_CREATE'; parentPath: string | null; name: string; nodeType: 'file' | 'dir' }
    | { type: 'FILE_CHANGE'; content: string }
    | { type: 'GIT_STAGE'; path: string }
    | { type: 'GIT_UNSTAGE'; path: string }
    | { type: 'GIT_COMMIT'; message: string }
    | { type: 'TASK_TOGGLE'; id: TaskId }
    | { type: 'TASK_ADD'; tasks: any[] }
    | { type: 'EXTENSION_UNINSTALL'; id: string }
    | { type: 'AI_CHAT_SUBMIT'; prompt: string }
    | { type: 'AI_TRIGGER_REVIEW'; reviewType: 'symphony' | 'pm' }
    | { type: 'AI_START_SPRINT'; goal: string }
    | { type: 'MATRIX_ENTITY_SPAWN'; entity: SceneObject }
    | { type: 'MATRIX_ACTION'; action: string }
    | { type: 'ASSET_IMPORT'; asset: GameAsset }
    | { type: 'NARRATIVE_SYNTHESIZE' }
    | { type: 'TERMINAL_COMMAND'; command: string };

/**
 * UI ACTION HANDLER
 * The single translation point from UI Intent to Engine/Agent Action.
 */
export type UIActionDispatcher = (action: UIAction) => void;

/**
 * EXHAUSTIVENESS CHECK
 * Ensures that every UIAction is handled in the dispatcher.
 */
export function assertNever(action: never): never {
    throw new Error(`Unhandled UI Action: ${JSON.stringify(action)}`);
}
