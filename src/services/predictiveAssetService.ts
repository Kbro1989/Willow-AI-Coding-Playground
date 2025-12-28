/**
 * predictiveAssetService.ts — ML-powered Asset Prefetching
 * Predicts and pre-generates assets based on user behavior patterns.
 */

interface UserAction {
    action: string;
    context: string;
    timestamp: number;
}

interface PredictionResult {
    assets: string[];
    confidence: number;
}

// In-memory behavior tracking
const behaviorHistory: UserAction[] = [];
const MAX_HISTORY = 500;

// Common gameplay patterns for heuristic prediction
const GAMEPLAY_PATTERNS: Record<string, string[]> = {
    'zone_change': ['level_tileset', 'background_layers', 'ambient_audio'],
    'enemy_spawn': ['enemy_sprites', 'attack_sfx', 'death_sfx'],
    'player_low_health': ['health_item', 'pickup_sfx'],
    'boss_approaching': ['boss_music', 'boss_sprites', 'boss_arena_bg'],
    'new_level': ['level_music', 'level_tileset', 'enemy_pack', 'item_pack'],
    'dialogue_start': ['character_portrait', 'dialogue_sfx'],
    'combat_start': ['battle_music', 'attack_effects', 'hit_sfx'],
    'shop_enter': ['shop_ui', 'coin_sfx', 'item_icons'],
};

/**
 * Record a user action for pattern learning
 */
export const recordUserBehavior = (action: string, context: string = ''): void => {
    behaviorHistory.push({
        action,
        context,
        timestamp: Date.now()
    });

    // Trim old entries
    if (behaviorHistory.length > MAX_HISTORY) {
        behaviorHistory.shift();
    }

    console.log(`[PredictiveAsset] Recorded: ${action} (context: ${context})`);
};

/**
 * Predict next likely assets based on current context
 * Uses simple heuristics (future: ML model)
 */
export const predictNextAssets = (currentContext: {
    zone?: string;
    playerHealth?: number;
    nearbyEnemies?: number;
    currentEvent?: string;
}): PredictionResult => {
    const predictions: string[] = [];
    let confidence = 0.5; // Base confidence

    // Rule-based predictions

    // Player low health → predict health items
    if (currentContext.playerHealth !== undefined && currentContext.playerHealth < 30) {
        predictions.push('health_item', 'pickup_sfx');
        confidence += 0.2;
    }

    // Many enemies → predict combat assets
    if (currentContext.nearbyEnemies !== undefined && currentContext.nearbyEnemies > 3) {
        predictions.push('battle_music', 'attack_effects', 'hit_sfx');
        confidence += 0.15;
    }

    // Zone change likely → predict level assets
    if (currentContext.currentEvent === 'zone_change' || currentContext.currentEvent === 'new_level') {
        const pattern = GAMEPLAY_PATTERNS[currentContext.currentEvent];
        if (pattern) {
            predictions.push(...pattern);
            confidence += 0.3;
        }
    }

    // Analyze recent behavior for patterns
    const recentActions = behaviorHistory.slice(-10).map(b => b.action);

    // If player has been in combat, predict healing
    if (recentActions.filter(a => a === 'combat' || a === 'attack').length > 3) {
        predictions.push('health_item');
    }

    // If player has been exploring, predict new zone assets
    if (recentActions.filter(a => a === 'move' || a === 'explore').length > 5) {
        predictions.push('level_tileset', 'ambient_audio');
    }

    // Deduplicate
    const uniquePredictions = [...new Set(predictions)];

    console.log(`[PredictiveAsset] Predicted ${uniquePredictions.length} assets with ${(confidence * 100).toFixed(0)}% confidence`);

    return {
        assets: uniquePredictions.slice(0, 5), // Top 5 predictions
        confidence: Math.min(confidence, 1.0)
    };
};

/**
 * Pre-generate predicted assets in background
 */
export const prefetchPredictedAssets = async (context: {
    zone?: string;
    playerHealth?: number;
    nearbyEnemies?: number;
    currentEvent?: string;
}): Promise<{ prefetched: string[], skipped: string[] }> => {
    const prediction = predictNextAssets(context);

    // Only prefetch if confidence is high enough
    if (prediction.confidence < 0.6) {
        console.log('[PredictiveAsset] Confidence too low, skipping prefetch');
        return { prefetched: [], skipped: prediction.assets };
    }

    // Import neuralRegistry for capability calls
    const { neuralRegistry } = await import('./ai/NeuralRegistry');

    const prefetched: string[] = [];

    for (const asset of prediction.assets) {
        try {
            // Map asset types to pipeline capabilities
            switch (asset) {
                case 'health_item':
                    await neuralRegistry.callCapability('asset_pipeline', 'pipeline_quick_item', {
                        itemType: 'health_potion',
                        style: 'pixel'
                    });
                    prefetched.push(asset);
                    break;
                case 'enemy_sprites':
                    await neuralRegistry.callCapability('asset_pipeline', 'pipeline_quick_enemy', {
                        enemyType: 'generic',
                        style: 'pixel'
                    });
                    prefetched.push(asset);
                    break;
                // Add more mappings as needed
                default:
                    console.log(`[PredictiveAsset] No handler for asset type: ${asset}`);
            }
        } catch (error) {
            console.warn(`[PredictiveAsset] Failed to prefetch ${asset}:`, error);
        }
    }

    return {
        prefetched,
        skipped: prediction.assets.filter(a => !prefetched.includes(a))
    };
};

/**
 * Get behavior analytics for debugging
 */
export const getBehaviorAnalytics = (): {
    totalActions: number;
    recentActions: UserAction[];
    actionCounts: Record<string, number>;
} => {
    const actionCounts: Record<string, number> = {};

    for (const action of behaviorHistory) {
        actionCounts[action.action] = (actionCounts[action.action] || 0) + 1;
    }

    return {
        totalActions: behaviorHistory.length,
        recentActions: behaviorHistory.slice(-20),
        actionCounts
    };
};

export default {
    recordUserBehavior,
    predictNextAssets,
    prefetchPredictedAssets,
    getBehaviorAnalytics
};
