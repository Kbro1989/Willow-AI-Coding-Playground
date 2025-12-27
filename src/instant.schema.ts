// Antigravity Engine - Comprehensive InstantDB Schema
// Integrated from ElderScape for game data persistence

import { i } from "@instantdb/react";

const _schema = i.schema({
    entities: {
        // System entities (InstantDB built-in)
        $files: i.entity({
            path: i.string().unique().indexed(),
            url: i.string().optional(),
        }),
        $users: i.entity({
            email: i.string().unique().indexed().optional(),
            imageURL: i.string().optional(),
            type: i.string().optional(),
            displayName: i.string().optional(),
            createdAt: i.number().optional(),
            lastLoginAt: i.number().optional(),
        }),

        // Player characters
        characters: i.entity({
            userId: i.string().indexed(),
            name: i.string().indexed(),
            class: i.string(),
            level: i.number(),
            experience: i.number(),
            health: i.number(),
            maxHealth: i.number(),
            mana: i.number(),
            maxMana: i.number(),
            currentLocation: i.string().indexed(),
            isOnline: i.boolean().indexed(),
            playTime: i.number(),
            createdAt: i.number(),
            lastPlayedAt: i.number().optional(),
        }),

        // Game locations/world areas
        locations: i.entity({
            name: i.string().indexed(),
            description: i.string(),
            type: i.string().indexed(), // 'town', 'dungeon', 'wilderness'
            difficulty: i.number(),
            minLevel: i.number().indexed(),
            isSafeZone: i.boolean(),
            pvpEnabled: i.boolean(),
        }),

        // AI-generated events and content
        events: i.entity({
            type: i.string().indexed(), // 'generated_content', 'system_event', 'player_action'
            category: i.string().indexed(), // 'code', 'media', '3d_model', 'text'
            title: i.string().indexed(),
            description: i.string(),
            source: i.string(),
            createdAt: i.number().indexed(),
            createdBy: i.string().indexed(),
            isPublic: i.boolean().indexed(),
            qualityScore: i.number().optional(),
        }),

        // AI model usage tracking
        aiUsage: i.entity({
            model: i.string().indexed().optional(),
            provider: i.string().indexed().optional(), // 'gemini', 'cloudflare', 'local'
            taskType: i.string().indexed().optional(), // 'text', 'image', 'code', etc.
            inputTokens: i.number().optional(),
            outputTokens: i.number().optional(),
            cost: i.number().optional(),
            duration: i.number().optional(),
            success: i.boolean().indexed().optional(),
            userId: i.string().indexed().optional(),
            timestamp: i.number().indexed().optional(),
        }),

        // Task management (Restored from pull)
        todos: i.entity({
            text: i.string().optional(),
            done: i.boolean().optional(),
            createdAt: i.number().optional(),
        }),

        // Quests and achievements
        quests: i.entity({
            title: i.string().indexed(),
            description: i.string(),
            type: i.string().indexed(), // 'main', 'side', 'daily'
            minLevel: i.number().indexed(),
            difficulty: i.number(),
            isRepeatable: i.boolean(),
            aiGenerated: i.boolean().indexed(),
        }),

        // Items and equipment
        items: i.entity({
            name: i.string().indexed(),
            description: i.string(),
            type: i.string().indexed(), // 'weapon', 'armor', 'consumable'
            rarity: i.string().indexed(), // 'common', 'rare', 'epic', 'legendary'
            value: i.number(),
            stackable: i.boolean(),
            isTradable: i.boolean(),
            aiGenerated: i.boolean().indexed(),
        }),

        // User-generated assets
        assets: i.entity({
            name: i.string().indexed(),
            type: i.string().indexed(), // 'image', 'video', 'audio', '3d_model'
            format: i.string(),
            url: i.string(),
            thumbnail: i.string().optional(),
            size: i.number(),
            ownerId: i.string().indexed(),
            isPublic: i.boolean().indexed(),
            downloads: i.number(),
            likes: i.number(),
            status: i.string().optional(), // 'raw', 'processing', 'optimized'
            tags: i.string().optional(), // JSON array or comma-separated
            createdAt: i.number().indexed(),
            aiGenerated: i.boolean().indexed(),
        }),

        // Game sessions
        sessions: i.entity({
            userId: i.string().indexed(),
            characterId: i.string().indexed().optional(),
            startTime: i.number().indexed(),
            endTime: i.number().optional(),
            duration: i.number().optional(),
            isActive: i.boolean().indexed(),
        }),

        // Real-time Presence (Cursors and Focus)
        presence: i.entity({
            userId: i.string().indexed(),
            userName: i.string().optional(),
            cursorX: i.number().optional(),
            cursorY: i.number().optional(),
            activeFile: i.string().optional(),
            activeTab: i.string().optional(),
            activeView: i.string().optional(),
            lastActive: i.number().indexed(),
        }),

        // Collaborative Workspace State
        workspace_state: i.entity({
            workspaceId: i.string().indexed(),
            activeUsers: i.string(), // JSON array of user IDs
            lockedEntities: i.string(), // JSON array of entity IDs
            globalDirectives: i.string(), // Current AI goal/state
            narrativeContext: i.string().optional(), // Shared drafting context
            updatedAt: i.number(),
        }),

        // Saved Node Graphs (Neural Configurations)
        saved_graphs: i.entity({
            name: i.string().indexed(),
            nodes: i.string(), // JSON string of NeuralNodes
            edges: i.string(), // JSON string of NeuralEdges
            thumbnail: i.string().optional(),
            createdAt: i.number(),
            updatedAt: i.number().indexed(),
        }),
    },
    links: {
        // System links
        $usersLinkedPrimaryUser: {
            forward: {
                on: "$users",
                has: "one",
                label: "linkedPrimaryUser",
                onDelete: "cascade",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "linkedGuestUsers",
            },
        },

        // Character relationships
        charactersOwner: {
            forward: {
                on: "characters",
                has: "one",
                label: "owner",
                onDelete: "cascade",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "characters",
            },
        },

        // Event creator
        eventsCreator: {
            forward: {
                on: "events",
                has: "one",
                label: "creator",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "createdEvents",
            },
        },

        // Asset owner
        assetsOwner: {
            forward: {
                on: "assets",
                has: "one",
                label: "owner",
                onDelete: "cascade",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "assets",
            },
        },
    },
    rooms: {},
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema { }
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
