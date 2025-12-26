import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Copy assets from source to dist directory
 * This script runs after TypeScript compilation
 */

const ASSET_DIRS = [
    'assets',
    'src/assets'
];

const DIST_DIR = 'dist';

async function copyAssets() {
    console.log('🚀 Starting asset copy process...');

    for (const assetDir of ASSET_DIRS) {
        const sourcePath = path.join(__dirname, '..', assetDir);
        const destPath = path.join(__dirname, '..', DIST_DIR, assetDir);

        if (fs.existsSync(sourcePath)) {
            console.log(`📁 Copying ${assetDir}...`);
            await copyDirectory(sourcePath, destPath);
            console.log(`✅ Copied ${assetDir} successfully`);
        } else {
            console.log(`⚠️  Source directory not found: ${assetDir} (skipping)`);
        }
    }

    console.log('🎉 Asset copy process completed');
}

async function copyDirectory(source, destination) {
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
    }

    const entries = fs.readdirSync(source, { withFileTypes: true });

    for (const entry of entries) {
        const sourcePath = path.join(source, entry.name);
        const destPath = path.join(destination, entry.name);

        if (entry.isDirectory()) {
            await copyDirectory(sourcePath, destPath);
        } else {
            // Copy file
            fs.copyFileSync(sourcePath, destPath);
        }
    }
}

// Run the copy process
copyAssets().catch(error => {
    console.error('❌ Asset copy failed:', error);
    process.exit(1);
});
