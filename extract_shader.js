import fs from 'fs';
import path from 'path';

const inputFile = 'C:\\Users\\Destiny\\Desktop\\projects\\OKComputer_rebuild my app for me\\webviewer.js.txt';
const outputFile = 'C:\\Users\\Destiny\\Desktop\\projects\\OKComputer_rebuild my app for me\\antigravity-engine\\src\\services\\rsmv\\shaders\\runeapps_generated.glsl';

try {
    const buffer = fs.readFileSync(inputFile);
    let content;

    // Check BOM
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
        console.log("Detected UTF-16LE BOM");
        content = buffer.toString('utf16le');
    } else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
        console.log("Detected UTF-16BE BOM");
        content = buffer.toString('utf16be');
    } else {
        // Try to guess. 
        // If lots of nulls, probably 16.
        let nulls = 0;
        for (let i = 0; i < 100 && i < buffer.length; i++) {
            if (buffer[i] === 0) nulls++;
        }
        if (nulls > 30) {
            console.log("Detected UTF-16LE (heuristic)");
            content = buffer.toString('utf16le');
        } else {
            console.log("Detected UTF-8 (default)");
            content = buffer.toString('utf8');
        }
    }

    const lines = content.split(/\r?\n/);
    console.log(`Read ${lines.length} lines.`);

    let shaderLine = lines.find(line => line.includes('#version 460') && line.includes('e.exports='));

    if (!shaderLine) {
        console.error('Could not find shader line');
        process.exit(1);
    }

    const startMarker = 'e.exports="';
    const startIndex = shaderLine.indexOf(startMarker);
    if (startIndex === -1) throw new Error('Start marker not found');

    let shaderString = shaderLine.substring(startIndex + startMarker.length);

    let rawContent = "";

    // The previously used split strategy
    const splitEnd = shaderString.split('"},');
    if (splitEnd.length > 1) {
        rawContent = splitEnd[0];
    } else {
        const lastQ = shaderString.lastIndexOf('"');
        if (lastQ > 0) {
            rawContent = shaderString.substring(0, lastQ);
        } else {
            throw new Error('End marker not found');
        }
    }

    try {
        let jsonString = `"${rawContent}"`;
        let unescaped = JSON.parse(jsonString);

        const outDir = path.dirname(outputFile);
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        fs.writeFileSync(outputFile, unescaped);
        console.log(`Successfully extracted shader to ${outputFile}`);
    } catch (parseError) {
        console.error("JSON parse error, trying manual unescape", parseError.message);
        let unescaped = rawContent
            .replace(/\\r\\n/g, '\n')
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
        const outDir = path.dirname(outputFile);
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(outputFile, unescaped);
        console.log(`Successfully extracted shader (manual) to ${outputFile}`);
    }

} catch (e) {
    console.error('Error:', e);
    process.exit(1);
}
