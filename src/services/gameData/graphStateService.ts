/**
 * Graph State Service
 * Persists Neural Node configurations to InstantDB
 */

import { db, id, tx } from '../../lib/db';
import { NeuralNode, NeuralEdge } from '../../types';

export interface SavedGraph {
    id: string;
    name: string;
    nodes: NeuralNode[];
    edges: NeuralEdge[];
    createdAt: number;
    updatedAt: number;
}

class GraphStateService {
    /**
     * Save a graph state (create or update)
     */
    async saveGraph(name: string, nodes: NeuralNode[], edges: NeuralEdge[], existingId?: string) {
        const graphId = existingId || id();
        const now = Date.now();

        try {
            await db.transact([
                tx.saved_graphs[graphId].update({
                    name,
                    nodes: JSON.stringify(nodes),
                    edges: JSON.stringify(edges),
                    updatedAt: now,
                    ...(existingId ? {} : { createdAt: now })
                })
            ]);
            console.log(`[GRAPH] Saved graph "${name}" (${graphId})`);
            return graphId;
        } catch (error) {
            console.error('[GRAPH] Failed to save graph:', error);
            throw error;
        }
    }

    /**
     * Parse a raw DB graph entry into usable objects
     */
    parseGraph(entry: any): SavedGraph | null {
        if (!entry) return null;
        try {
            return {
                id: entry.id,
                name: entry.name,
                nodes: JSON.parse(entry.nodes),
                edges: JSON.parse(entry.edges),
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt
            };
        } catch (e) {
            console.error('[GRAPH] Failed to parse graph:', e);
            return null;
        }
    }

    /**
     * Hook-like helper queries
     */
    useGraphs() {
        return db.useQuery({ saved_graphs: {} });
    }
}

export const graphStateService = new GraphStateService();
export default graphStateService;
