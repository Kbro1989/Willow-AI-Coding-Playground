import { rsmv } from "../index";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { exportThreeJsGltf } from "../viewer/threejsrender";

// Polyfill for Node.js environment
// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function precompileModels(ids: number[], outputDir: string, cachePath?: string) {
    console.log(`RSMV: Precompiling ${ids.length} models to ${outputDir}...`);

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Link cache if provided
    if (cachePath) {
        await rsmv.linkLocalCache(cachePath);
    }

    for (const id of ids) {
        try {
            process.stdout.write(`  Processing model ${id}... `);
            // loadModel returns a pre-assembled THREE.Group in .scene
            const model = await rsmv.loadModel(id);

            // Use the existing exporter logic
            const glbBuffer = await exportThreeJsGltf(model.scene as any);
            const outputPath = path.join(outputDir, `model_${id}.glb`);

            await fs.writeFile(outputPath, Buffer.from(glbBuffer));
            console.log(`DONE`);
        } catch (e) {
            console.log(`FAILED`, e);
        }
    }

    console.log(`RSMV: Precompilation finished.`);
}

// Example usage:
// node precompile.js 4151,11694 public/assets/models C:/ProgramData/Jagex/RuneScape
const args = process.argv.slice(2);
if (args.length >= 2) {
    const ids = args[0].split(",").map(Number);
    const outDir = args[1];
    const cache = args[2];
    precompileModels(ids, outDir, cache);
} else {
    console.log("Usage: node precompile.js <ids> <outputDir> [cachePath]");
}
