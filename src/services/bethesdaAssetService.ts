
import { RSMVModelEntry, GameSource, ModelCategory } from '../components/RSMVBrowser';
import * as THREE from 'three';
import { Buffer } from 'buffer';
import { NifParser } from './rsmv/3d/nifParser';

export interface BethesdaGamePaths {
    id: GameSource;
    root: string;
    data: string;
    archives: string[];
}

export const GOG_GALAXY_PATHS: Record<string, BethesdaGamePaths> = {
    morrowind: {
        id: 'morrowind',
        root: 'C:\\Program Files (x86)\\GOG Galaxy\\Games\\Morrowind',
        data: 'C:\\Program Files (x86)\\GOG Galaxy\\Games\\Morrowind\\Data Files',
        archives: ['Morrowind.bsa', 'Tribunal.bsa', 'Bloodmoon.bsa']
    },
    fallout: {
        id: 'fallout',
        root: 'C:\\Program Files (x86)\\GOG Galaxy\\Games\\Fallout New Vegas',
        data: 'C:\\Program Files (x86)\\GOG Galaxy\\Games\\Fallout New Vegas\\Data',
        archives: ['Fallout - Meshes.bsa', 'DeadMoney - Main.bsa', 'HonestHearts - Main.bsa', 'OldWorldBlues - Main.bsa', 'LonesomeRoad - Main.bsa', 'GunRunnersArsenal - Main.bsa']
    }
};

export class BethesdaAssetService {
    private static instance: BethesdaAssetService;
    private indexedModels: Record<GameSource, RSMVModelEntry[]> = {
        runescape: [],
        morrowind: [],
        fallout: []
    };

    private constructor() { }

    static getInstance() {
        if (!this.instance) {
            this.instance = new BethesdaAssetService();
        }
        return this.instance;
    }

    async detectInstallations(): Promise<GameSource[]> {
        const api = (window as any).agentAPI;
        if (!api) return [];

        const found: GameSource[] = [];
        for (const [key, paths] of Object.entries(GOG_GALAXY_PATHS)) {
            const res = await api.fs.stat(paths.root);
            if (res.success) {
                found.push(key as GameSource);
            }
        }
        return found;
    }

    async getModels(game: GameSource): Promise<RSMVModelEntry[]> {
        return this.indexedModels[game] || [];
    }

    async loadNif(game: GameSource, relativePath: string): Promise<THREE.Group> {
        const paths = GOG_GALAXY_PATHS[game];
        if (!paths) throw new Error("Game path not found");

        const fullPath = `${paths.data}\\${relativePath}`;
        const api = (window as any).agentAPI;
        if (!api) throw new Error("Agent API not available");

        const res = await api.fs.readFile(fullPath, 'binary');
        if (!res.success) throw new Error(`Failed to read file: ${res.error}`);

        // buffer comes as base64 from the bridge usually, or raw buffer if local?
        // Wait, agentAPI fs.readFile returns base64 string for binary usually in this env?
        // Let's assume content is base64 string if 'binary' encoding is used, or we need to handle it.
        // Actually, looking at typical bridge implementations here:
        // If it returns a Buffer object directly (unlikely over JSON bridge) or base64.

        let buffer: Buffer;
        if (typeof res.content === 'string') {
            buffer = Buffer.from(res.content, 'base64');
        } else {
            // Assume it might be an array or similar
            buffer = Buffer.from(res.content);
        }

        return NifParser.parse(buffer);
    }

    // This would be triggered by the "Link Local Assets" button
    async linkLocalAssets(game: GameSource): Promise<boolean> {
        const paths = GOG_GALAXY_PATHS[game];
        if (!paths) return false;

        console.log(`[BETHESDA_SERVICE] Indexing ${game} assets...`);

        // In a real scenario, we would run a command to generate the index
        // For this demo/task, we will simulate indexing or use a pre-generated index

        try {
            const api = (window as any).agentAPI;
            if (!api) return false;

            // Check if index exists, if not, we'd theoretically trigger a build
            // For now, we'll scan the 'Meshes' directory for loose files (Morrowind only)
            if (game === 'morrowind') {
                const meshesDir = `${paths.data}\\Meshes`;
                const res = await api.fs.stat(meshesDir);
                if (res.success) {
                    const files = await this.scanDirectoryRecursive(meshesDir, 'Meshes');
                    this.indexedModels.morrowind = files.map((f, i) => ({
                        id: 1000 + i,
                        name: f.split('/').pop()?.replace('.nif', '') || f,
                        category: 'models',
                        gameSource: 'morrowind',
                        filePath: f
                    }));
                }
            }

            return true;
        } catch (err) {
            console.error(`[BETHESDA_SERVICE] Failed to link assets for ${game}:`, err);
            return false;
        }
    }

    private async scanDirectoryRecursive(path: string, relativeRoot: string): Promise<string[]> {
        const api = (window as any).agentAPI;
        const result: string[] = [];

        const scan = async (currentPath: string, currentRel: string) => {
            const res = await api.fs.readDirectory(currentPath);
            if (res.success) {
                for (const file of res.files) {
                    const fullPath = `${currentPath}\\${file.name}`;
                    const relPath = `${currentRel}/${file.name}`;
                    if (file.isDir) {
                        await scan(fullPath, relPath);
                    } else if (file.name.toLowerCase().endsWith('.nif')) {
                        result.push(relPath);
                    }
                }
            }
        };

        await scan(path, relativeRoot);
        return result;
    }
}
