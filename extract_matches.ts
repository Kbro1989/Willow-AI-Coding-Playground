
import fs from 'fs';
import path from 'path';

const inputFile = 'src/services/rsmv/shaders/runeapps_main.glsl';
const content = fs.readFileSync(inputFile, 'utf-8');

const matches = content.split(/\/\* MATCH \d+ \*\//);

// Matches are 1-indexed in the file comments but 0-indexed in the split array.
// The first element [0] is the content before "MATCH 0" (likely empty or header).
// "MATCH 0" corresponds to matches[1].
// "MATCH 1" corresponds to matches[2].
// "MATCH 3" (Vertex) corresponds to matches[4].
// "MATCH 4" (Fragment) corresponds to matches[5].

// Verify indices by printing first lines
console.log('Match 3 Start:', matches[4].trim().substring(0, 50));
console.log('Match 4 Start:', matches[5].trim().substring(0, 50));

fs.writeFileSync('src/services/rsmv/shaders/RunescapeVertex.glsl', matches[4].trim());
console.log('Wrote RunescapeVertex.glsl');

fs.writeFileSync('src/services/rsmv/shaders/RunescapeFragment.glsl', matches[5].trim());
console.log('Wrote RunescapeFragment.glsl');
