import fs from 'fs';
import path from 'path';

const inputFile = 'C:\\Users\\Destiny\\Desktop\\projects\\OKComputer_rebuild my app for me\\webviewer.js.txt';
const outputFile = 'C:\\Users\\Destiny\\Desktop\\projects\\OKComputer_rebuild my app for me\\antigravity-engine\\src\\services\\rsmv\\shaders\\runeapps_main.glsl';

try {
    const buffer = fs.readFileSync(inputFile);
    let content;

    // Check BOM
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
        content = buffer.toString('utf16le');
    } else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
        content = buffer.toString('utf16be');
    } else {
        let nulls = 0;
        for (let i = 0; i < 100 && i < buffer.length; i++) {
            if (buffer[i] === 0) nulls++;
        }
        if (nulls > 30) {
            content = buffer.toString('utf16le');
        } else {
            content = buffer.toString('utf8');
        }
    }

    // Search for "void main"
    // It might be in a string like "void main() { ... }"
    // We want to extract the whole string containing it.

    const regex = /"([^"]*void\s+main\s*\([^"]*)"/g;
    let match;
    let found = [];

    while ((match = regex.exec(content)) !== null) {
        found.push(match[1]);
    }

    if (found.length === 0) {
        // Try single quotes?
        const regex2 = /'([^']*void\s+main\s*\([^']*)'/g;
        while ((match = regex2.exec(content)) !== null) {
            found.push(match[1]);
        }
    }

    console.log(`Found ${found.length} matches for 'void main'.`);

    if (found.length > 0) {
        // Sort by length? Or just dump all?
        // Let's dump them all separated by headers.
        let out = "";
        found.forEach((s, i) => {
            // Unescape
            let unescaped = s;
            try { unescaped = JSON.parse(`"${s}"`); } catch (e) { }

            // Clean up common escapes if JSON parse failed or didn't catch everything
            unescaped = unescaped
                .replace(/\\r\\n/g, '\n')
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');

            out += `\n/* MATCH ${i} */\n${unescaped}\n`;
        });

        const outDir = path.dirname(outputFile);
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        fs.writeFileSync(outputFile, out);
        console.log(`Wrote matches to ${outputFile}`);
    } else {
        console.error("No 'void main' found.");
        // Maybe it's constructed dynamically?
        // Search for 'main' simply?
    }

} catch (e) {
    console.error('Error:', e);
}
