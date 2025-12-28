/* Minimal Worker Types for IDE Compatibility */
/* Run `npm run types` after install to generate complete types from wrangler */

declare namespace Cloudflare {
    interface Env {
        BRIDGE_SESSIONS: DurableObjectNamespace<import("./index").BridgeSession>;
        GOOGLE_API_KEY?: string;
        GOOGLE_CSE_ID?: string;
    }
}
interface Env extends Cloudflare.Env { }

declare class DurableObjectNamespace<T = any> {
    newUniqueId(): DurableObjectId;
    idFromName(name: string): DurableObjectId;
    idFromString(id: string): DurableObjectId;
    get(id: DurableObjectId): DurableObjectStub;
}

declare interface DurableObjectId {
    toString(): string;
    equals(other: DurableObjectId): boolean;
}

declare interface DurableObjectStub {
    fetch(request: Request): Promise<Response>;
}

declare interface DurableObjectState {
    waitUntil(promise: Promise<any>): void;
    readonly id: DurableObjectId;
    readonly storage: DurableObjectStorage;
    acceptWebSocket(ws: WebSocket, tags?: string[]): void;
    getWebSockets(tag?: string): WebSocket[];
}

declare interface DurableObjectStorage {
    get<T = unknown>(key: string): Promise<T | undefined>;
    put<T>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<boolean>;
}

declare class WebSocketPair {
    0: WebSocket;
    1: WebSocket;
}
