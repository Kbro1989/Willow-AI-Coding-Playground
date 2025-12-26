/**
 * Behavior Bridge Service
 * Connects AI-generated Logic (Behavior Trees) to the Matrix Runtime.
 */

export type BehaviorNodeType = 'sequence' | 'selector' | 'action' | 'condition';

export interface BehaviorNode {
    id: string;
    type: BehaviorNodeType;
    name: string;
    args?: Record<string, any>;
    children?: BehaviorNode[];
}

export interface BehaviorTree {
    entityId: string;
    root: BehaviorNode;
    timestamp: number;
}

class BehaviorBridge {
    private activeBehaviors: Map<string, BehaviorTree> = new Map();

    /**
     * Register a new behavior for an entity
     */
    registerBehavior(entityId: string, behaviorJson: string) {
        try {
            const root = JSON.parse(behaviorJson) as BehaviorNode;
            const tree: BehaviorTree = {
                entityId,
                root,
                timestamp: Date.now()
            };

            this.activeBehaviors.set(entityId, tree);
            console.log(`[BEHAVIOR_BRIDGE] Logic Registered for Entity: ${entityId}`);

            // Future: Broadcast to Matrix via Command Bus
        } catch (e) {
            console.error("[BEHAVIOR_BRIDGE] Failed to parse behavior logic:", e);
        }
    }

    /**
     * Get active behavior for an entity
     */
    getBehavior(entityId: string): BehaviorTree | undefined {
        return this.activeBehaviors.get(entityId);
    }

    /**
     * Clear logic for an entity
     */
    clearBehavior(entityId: string) {
        this.activeBehaviors.delete(entityId);
    }

    /**
     * List all entities with active AI logic
     */
    getActiveEntities(): string[] {
        return Array.from(this.activeBehaviors.keys());
    }
}

export const behaviorBridge = new BehaviorBridge();
export default behaviorBridge;
