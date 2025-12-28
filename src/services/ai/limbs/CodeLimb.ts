/**
 * CodeLimb.ts — Code Operations (30 fingers)
 * Provides code parsing, formatting, refactoring, and execution.
 */
import { neuralRegistry } from '../NeuralRegistry';
import { localBridgeClient } from '../../localBridgeService';

export const registerCodeLimb = () => {
    neuralRegistry.registerLimb({
        id: 'code',
        name: 'Code Operations',
        description: 'Code parsing, formatting, refactoring, and execution.',
        capabilities: [
            // === Parsing & Analysis ===
            {
                name: 'code_parse_ast',
                description: 'Parse code into AST representation.',
                parameters: { code: 'string', language: 'string' },
                handler: async (params) => {
                    // Simplified AST parsing - would use real parser in production
                    const lines = params.code.split('\n').length;
                    const functions = (params.code.match(/function\s+\w+|const\s+\w+\s*=/g) || []).length;
                    return { lines, functions, language: params.language };
                }
            },
            {
                name: 'code_lint',
                description: 'Run linter on code and get issues.',
                parameters: { code: 'string', language: 'string' },
                handler: async (params) => {
                    // Simplified lint - would use ESLint/etc in production
                    const issues: string[] = [];
                    if (params.code.includes('var ')) issues.push('Use const/let instead of var');
                    if (params.code.includes('console.log')) issues.push('Remove console.log in production');
                    if (!params.code.includes('use strict') && params.language === 'javascript') {
                        issues.push('Consider adding "use strict"');
                    }
                    return { issues, count: issues.length };
                }
            },
            {
                name: 'code_format',
                description: 'Format code with proper indentation.',
                parameters: { code: 'string', language: 'string', indentSize: 'number?' },
                handler: async (params) => {
                    // Basic formatting - would use Prettier in production
                    const indent = ' '.repeat(params.indentSize || 2);
                    let level = 0;
                    const lines = params.code.split('\n').map(line => {
                        const trimmed = line.trim();
                        if (trimmed.startsWith('}')) level = Math.max(0, level - 1);
                        const formatted = indent.repeat(level) + trimmed;
                        if (trimmed.endsWith('{')) level++;
                        return formatted;
                    });
                    return { formatted: lines.join('\n') };
                }
            },
            {
                name: 'code_minify',
                description: 'Minify code by removing whitespace.',
                parameters: { code: 'string' },
                handler: async (params) => {
                    const minified = params.code
                        .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // Remove comments
                        .replace(/\s+/g, ' ')
                        .replace(/\s*([{}();,:])\s*/g, '$1')
                        .trim();
                    return { minified, ratio: (minified.length / params.code.length * 100).toFixed(1) + '%' };
                }
            },
            {
                name: 'code_complexity',
                description: 'Analyze code complexity metrics.',
                parameters: { code: 'string' },
                handler: async (params) => {
                    const lines = params.code.split('\n').length;
                    const ifs = (params.code.match(/if\s*\(/g) || []).length;
                    const loops = (params.code.match(/for\s*\(|while\s*\(/g) || []).length;
                    const functions = (params.code.match(/function\s+\w+|\w+\s*=\s*\(.*\)\s*=>/g) || []).length;
                    const cyclomaticComplexity = 1 + ifs + loops;
                    return { lines, functions, ifs, loops, cyclomaticComplexity };
                }
            },

            // === Search & Navigation ===
            {
                name: 'code_search',
                description: 'Search for patterns in codebase.',
                parameters: { pattern: 'string', directory: 'string', extensions: 'string[]?' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({
                        type: 'grep-files',
                        directory: params.directory,
                        pattern: params.pattern,
                        extensions: params.extensions
                    });
                    return result;
                }
            },
            {
                name: 'code_find_definition',
                description: 'Find where a symbol is defined.',
                parameters: { symbol: 'string', directory: 'string' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({
                        type: 'grep-files',
                        directory: params.directory,
                        pattern: `(function|const|let|var|class|interface|type)\\s+${params.symbol}`,
                        extensions: ['.ts', '.tsx', '.js', '.jsx']
                    });
                    return result;
                }
            },
            {
                name: 'code_find_references',
                description: 'Find all references to a symbol.',
                parameters: { symbol: 'string', directory: 'string' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({
                        type: 'grep-files',
                        directory: params.directory,
                        pattern: params.symbol,
                        extensions: ['.ts', '.tsx', '.js', '.jsx']
                    });
                    return result;
                }
            },
            {
                name: 'code_find_imports',
                description: 'Find all imports of a module.',
                parameters: { moduleName: 'string', directory: 'string' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({
                        type: 'grep-files',
                        directory: params.directory,
                        pattern: `import.*from.*['"].*${params.moduleName}['"]`,
                        extensions: ['.ts', '.tsx', '.js', '.jsx']
                    });
                    return result;
                }
            },

            // === Refactoring ===
            {
                name: 'code_rename_symbol',
                description: 'Rename a symbol across a file.',
                parameters: { code: 'string', oldName: 'string', newName: 'string' },
                handler: async (params) => {
                    const regex = new RegExp(`\\b${params.oldName}\\b`, 'g');
                    const refactored = params.code.replace(regex, params.newName);
                    const count = (params.code.match(regex) || []).length;
                    return { refactored, replacements: count };
                }
            },
            {
                name: 'code_extract_function',
                description: 'Extract code block into a new function.',
                parameters: { code: 'string', startLine: 'number', endLine: 'number', functionName: 'string' },
                handler: async (params) => {
                    const lines = params.code.split('\n');
                    const extracted = lines.slice(params.startLine - 1, params.endLine).join('\n');
                    const newFunction = `function ${params.functionName}() {\n  ${extracted}\n}`;
                    return {
                        newFunction,
                        callSite: `${params.functionName}();`,
                        message: `Extract lines ${params.startLine}-${params.endLine} to ${params.functionName}()`
                    };
                }
            },
            {
                name: 'code_inline_function',
                description: 'Inline a function at call sites.',
                parameters: { functionName: 'string', functionBody: 'string', code: 'string' },
                handler: async (params) => {
                    const callRegex = new RegExp(`${params.functionName}\\(\\)`, 'g');
                    const inlined = params.code.replace(callRegex, `(${params.functionBody})`);
                    return { inlined };
                }
            },
            {
                name: 'code_add_import',
                description: 'Add an import statement to code.',
                parameters: { code: 'string', importStatement: 'string' },
                handler: async (params) => {
                    const lines = params.code.split('\n');
                    let insertIndex = 0;
                    for (let i = 0; i < lines.length; i++) {
                        if (lines[i].startsWith('import ')) insertIndex = i + 1;
                        else if (!lines[i].trim().startsWith('//') && lines[i].trim()) break;
                    }
                    lines.splice(insertIndex, 0, params.importStatement);
                    return { code: lines.join('\n') };
                }
            },
            {
                name: 'code_remove_unused_imports',
                description: 'Remove unused import statements.',
                parameters: { code: 'string' },
                handler: async (params) => {
                    // Simplified - would use real AST in production
                    const lines = params.code.split('\n');
                    const importLines = lines.filter(l => l.trim().startsWith('import '));
                    let removed = 0;
                    const cleaned = lines.filter(line => {
                        if (!line.trim().startsWith('import ')) return true;
                        const match = line.match(/import\s+(\{[^}]+\}|\w+)/);
                        if (!match) return true;
                        const symbols = match[1].replace(/[{}]/g, '').split(',').map(s => s.trim());
                        const used = symbols.some(s => {
                            const regex = new RegExp(`\\b${s}\\b`, 'g');
                            const matches = (params.code.match(regex) || []).length;
                            return matches > 1; // More than just the import
                        });
                        if (!used) removed++;
                        return used;
                    });
                    return { cleaned: cleaned.join('\n'), removed };
                }
            },

            // === Generation ===
            {
                name: 'code_generate_interface',
                description: 'Generate TypeScript interface from object.',
                parameters: { object: 'object', interfaceName: 'string' },
                handler: async (params) => {
                    const generateType = (val: any): string => {
                        if (val === null) return 'null';
                        if (Array.isArray(val)) return val.length ? `${generateType(val[0])}[]` : 'any[]';
                        if (typeof val === 'object') return '{ ' + Object.entries(val).map(([k, v]) => `${k}: ${generateType(v)}`).join('; ') + ' }';
                        return typeof val;
                    };
                    const fields = Object.entries(params.object)
                        .map(([key, val]) => `  ${key}: ${generateType(val)};`)
                        .join('\n');
                    return { interface: `interface ${params.interfaceName} {\n${fields}\n}` };
                }
            },
            {
                name: 'code_generate_test',
                description: 'Generate unit test for a function.',
                parameters: { functionCode: 'string', functionName: 'string' },
                handler: async (params) => {
                    const test = `describe('${params.functionName}', () => {
  it('should work correctly', () => {
    // TODO: Add test assertions
    const result = ${params.functionName}();
    expect(result).toBeDefined();
  });
  
  it('should handle edge cases', () => {
    // TODO: Add edge case tests
  });
});`;
                    return { test };
                }
            },
            {
                name: 'code_generate_docs',
                description: 'Generate JSDoc documentation.',
                parameters: { functionCode: 'string' },
                handler: async (params) => {
                    const match = params.functionCode.match(/function\s+(\w+)\s*\(([^)]*)\)/);
                    if (!match) return { docs: '/** TODO: Add documentation */' };
                    const [, name, paramsStr] = match;
                    const paramNames = paramsStr.split(',').map(p => p.trim().split(':')[0].trim()).filter(Boolean);
                    const paramDocs = paramNames.map(p => ` * @param ${p} - Description`).join('\n');
                    return {
                        docs: `/**
 * ${name} - Add description
 *
${paramDocs}
 * @returns Description
 */`
                    };
                }
            },

            // === Execution ===
            {
                name: 'code_run_terminal',
                description: 'Run a command in terminal.',
                parameters: { command: 'string', cwd: 'string?' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({
                        type: 'run-command',
                        command: params.command,
                        cwd: params.cwd
                    });
                    return result;
                }
            },
            {
                name: 'code_install_package',
                description: 'Install an npm package.',
                parameters: { packageName: 'string', dev: 'boolean?' },
                handler: async (params) => {
                    const command = `npm install ${params.dev ? '-D' : ''} ${params.packageName}`;
                    const result = await localBridgeClient.execute({ type: 'run-command', command });
                    return result;
                }
            },
            {
                name: 'code_build',
                description: 'Run build command.',
                parameters: { cwd: 'string?' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({
                        type: 'run-command',
                        command: 'npm run build',
                        cwd: params.cwd
                    });
                    return result;
                }
            },
            {
                name: 'code_test',
                description: 'Run test suite.',
                parameters: { cwd: 'string?', testFile: 'string?' },
                handler: async (params) => {
                    const command = params.testFile ? `npm test -- ${params.testFile}` : 'npm test';
                    const result = await localBridgeClient.execute({
                        type: 'run-command',
                        command,
                        cwd: params.cwd
                    });
                    return result;
                }
            },

            // === TypeScript Specific ===
            {
                name: 'code_typecheck',
                description: 'Run TypeScript type checking.',
                parameters: { cwd: 'string?' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({
                        type: 'run-command',
                        command: 'npx tsc --noEmit',
                        cwd: params.cwd
                    });
                    return result;
                }
            },
            {
                name: 'code_fix_types',
                description: 'Attempt to fix TypeScript errors.',
                parameters: { code: 'string', error: 'string' },
                handler: async (params) => {
                    const { modelRouter } = await import('../../modelRouter');
                    const prompt = `Fix this TypeScript error:\n\nError: ${params.error}\n\nCode:\n${params.code}\n\nProvide only the corrected code.`;
                    const result = await modelRouter.chat(prompt);
                    return 'content' in result ? { fixed: result.content } : { error: 'No response' };
                }
            },

            // === Diff & Patching ===
            {
                name: 'code_diff',
                description: 'Generate diff between two code versions.',
                parameters: { original: 'string', modified: 'string' },
                handler: async (params) => {
                    const origLines = params.original.split('\n');
                    const modLines = params.modified.split('\n');
                    const diff: string[] = [];
                    const maxLen = Math.max(origLines.length, modLines.length);
                    for (let i = 0; i < maxLen; i++) {
                        if (origLines[i] !== modLines[i]) {
                            if (origLines[i]) diff.push(`- ${origLines[i]}`);
                            if (modLines[i]) diff.push(`+ ${modLines[i]}`);
                        }
                    }
                    return { diff: diff.join('\n'), changes: diff.length };
                }
            },
            {
                name: 'code_apply_patch',
                description: 'Apply a simple line replacement.',
                parameters: { code: 'string', lineNumber: 'number', newLine: 'string' },
                handler: async (params) => {
                    const lines = params.code.split('\n');
                    if (params.lineNumber > 0 && params.lineNumber <= lines.length) {
                        lines[params.lineNumber - 1] = params.newLine;
                    }
                    return { patched: lines.join('\n') };
                }
            },

            // === Statistics ===
            {
                name: 'code_stats',
                description: 'Get code statistics for a directory.',
                parameters: { directory: 'string' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({
                        type: 'code-stats',
                        directory: params.directory
                    });
                    return result;
                }
            },
            {
                name: 'code_dependencies',
                description: 'List project dependencies.',
                parameters: { packageJsonPath: 'string' },
                handler: async (params) => {
                    const result = await localBridgeClient.execute({
                        type: 'read-file',
                        path: params.packageJsonPath
                    });
                    if (!result.success) return result;
                    try {
                        const pkg = JSON.parse(result.content);
                        return {
                            dependencies: Object.keys(pkg.dependencies || {}),
                            devDependencies: Object.keys(pkg.devDependencies || {}),
                            total: Object.keys(pkg.dependencies || {}).length + Object.keys(pkg.devDependencies || {}).length
                        };
                    } catch {
                        return { error: 'Invalid package.json' };
                    }
                }
            }
        ]
    });

    console.log('[CodeLimb] 30 capabilities registered.');
};
