/**
 * DataLimb.ts — Data Analysis & Telemetry Operations (30 fingers)
 * Provides data transformation, statistics, charting, and performance profiling.
 */
import { neuralRegistry } from '../NeuralRegistry';

// Types for data operations
type DataRecord = Record<string, unknown>;
type DataArray = DataRecord[];

// Performance tracking
let performanceHistory: { timestamp: number, fps: number, memory: number }[] = [];
let frameCount = 0;
let lastFrameTime = performance.now();

// Start FPS tracking
if (typeof window !== 'undefined') {
    const trackFrame = () => {
        frameCount++;
        const now = performance.now();
        if (now - lastFrameTime >= 1000) {
            const fps = Math.round(frameCount * 1000 / (now - lastFrameTime));
            const memory = (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0;
            performanceHistory.push({ timestamp: Date.now(), fps, memory });
            if (performanceHistory.length > 300) performanceHistory.shift(); // Keep 5 min
            frameCount = 0;
            lastFrameTime = now;
        }
        requestAnimationFrame(trackFrame);
    };
    requestAnimationFrame(trackFrame);
}

export const registerDataLimb = () => {
    neuralRegistry.registerLimb({
        id: 'data',
        name: 'Data Operations',
        description: 'Data transformation, statistics, charting, and performance profiling.',
        capabilities: [
            // === Data Loading ===
            {
                name: 'data_parse_json',
                description: 'Parse a JSON string into an object.',
                parameters: { json: 'string' },
                handler: async (params) => {
                    try {
                        return { success: true, data: JSON.parse(params.json) };
                    } catch (e: unknown) {
                        return { success: false, error: (e as Error).message };
                    }
                }
            },
            {
                name: 'data_parse_csv',
                description: 'Parse CSV string into array of objects.',
                parameters: { csv: 'string', delimiter: 'string?' },
                handler: async (params) => {
                    const delim = params.delimiter || ',';
                    const lines = params.csv.trim().split('\n');
                    const headers = lines[0].split(delim).map((h: string) => h.trim());
                    const data = lines.slice(1).map((line: string) => {
                        const values = line.split(delim);
                        return headers.reduce((obj: DataRecord, h: string, i: number) => ({ ...obj, [h]: values[i]?.trim() }), {} as DataRecord);
                    });
                    return { success: true, count: data.length, data };
                }
            },
            {
                name: 'data_stringify_json',
                description: 'Convert object to formatted JSON string.',
                parameters: { data: 'object', pretty: 'boolean?' },
                handler: async (params) => {
                    return { json: JSON.stringify(params.data, null, params.pretty ? 2 : 0) };
                }
            },
            {
                name: 'data_stringify_csv',
                description: 'Convert array of objects to CSV string.',
                parameters: { data: 'object[]' },
                handler: async (params) => {
                    if (!params.data.length) return { csv: '' };
                    const headers = Object.keys(params.data[0]);
                    const lines = [headers.join(',')];
                    params.data.forEach((row: DataRecord) => {
                        lines.push(headers.map((h: string) => String((row as Record<string, unknown>)[h] ?? '')).join(','));
                    });
                    return { csv: lines.join('\n') };
                }
            },

            // === Data Transformation ===
            {
                name: 'data_map',
                description: 'Transform each item in an array using a field expression.',
                parameters: { data: 'object[]', field: 'string', expression: 'string' },
                handler: async (params) => {
                    // Simple expression: field * 2, field + 10, etc.
                    const result = params.data.map((item: DataRecord) => {
                        const val = item[params.field];
                        // Safe eval for simple math expressions
                        const expr = params.expression.replace(/field/g, String(val));
                        try {
                            return { ...item, [params.field]: eval(expr) };
                        } catch {
                            return item;
                        }
                    });
                    return { count: result.length, data: result };
                }
            },
            {
                name: 'data_filter',
                description: 'Filter array where field matches condition.',
                parameters: { data: 'object[]', field: 'string', operator: '==|!=|>|<|>=|<=|contains', value: 'any' },
                handler: async (params) => {
                    const result = params.data.filter((item: DataRecord) => {
                        const v = item[params.field];
                        switch (params.operator) {
                            case '==': return v == params.value;
                            case '!=': return v != params.value;
                            case '>': return (v as number) > params.value;
                            case '<': return (v as number) < params.value;
                            case '>=': return (v as number) >= params.value;
                            case '<=': return (v as number) <= params.value;
                            case 'contains': return String(v).includes(String(params.value));
                            default: return true;
                        }
                    });
                    return { count: result.length, data: result };
                }
            },
            {
                name: 'data_sort',
                description: 'Sort array by a field.',
                parameters: { data: 'object[]', field: 'string', order: 'asc|desc' },
                handler: async (params) => {
                    const result = [...params.data].sort((a: DataRecord, b: DataRecord) => {
                        const va = a[params.field], vb = b[params.field];
                        const cmp = (va as number) < (vb as number) ? -1 : (va as number) > (vb as number) ? 1 : 0;
                        return params.order === 'desc' ? -cmp : cmp;
                    });
                    return { count: result.length, data: result };
                }
            },
            {
                name: 'data_group',
                description: 'Group array by a field.',
                parameters: { data: 'object[]', field: 'string' },
                handler: async (params) => {
                    const groups: Record<string, DataArray> = {};
                    params.data.forEach((item: DataRecord) => {
                        const key = String(item[params.field]);
                        if (!groups[key]) groups[key] = [];
                        groups[key].push(item);
                    });
                    return { groupCount: Object.keys(groups).length, groups };
                }
            },
            {
                name: 'data_unique',
                description: 'Get unique values of a field.',
                parameters: { data: 'object[]', field: 'string' },
                handler: async (params) => {
                    const unique = [...new Set(params.data.map((item: DataRecord) => item[params.field]))];
                    return { count: unique.length, values: unique };
                }
            },
            {
                name: 'data_pick',
                description: 'Select only specific fields from each object.',
                parameters: { data: 'object[]', fields: 'string[]' },
                handler: async (params) => {
                    const result = params.data.map((item: DataRecord) => {
                        return params.fields.reduce((obj: DataRecord, f: string) => ({ ...obj, [f]: item[f] }), {} as DataRecord);
                    });
                    return { count: result.length, data: result };
                }
            },
            {
                name: 'data_join',
                description: 'Join two arrays on a key field.',
                parameters: { left: 'object[]', right: 'object[]', leftKey: 'string', rightKey: 'string' },
                handler: async (params) => {
                    const rightMap = new Map(params.right.map((r: DataRecord) => [r[params.rightKey], r]));
                    const result = params.left.map((l: DataRecord) => {
                        const rightVal = rightMap.get(l[params.leftKey]);
                        return rightVal ? { ...l, ...(rightVal as DataRecord) } : l;
                    });
                    return { count: result.length, data: result };
                }
            },

            // === Statistics ===
            {
                name: 'stats_sum',
                description: 'Calculate sum of a numeric field.',
                parameters: { data: 'object[]', field: 'string' },
                handler: async (params) => {
                    const sum = params.data.reduce((acc: number, item: DataRecord) => acc + (Number(item[params.field]) || 0), 0);
                    return { sum };
                }
            },
            {
                name: 'stats_mean',
                description: 'Calculate mean (average) of a numeric field.',
                parameters: { data: 'object[]', field: 'string' },
                handler: async (params) => {
                    const values = params.data.map((item: DataRecord) => Number(item[params.field]) || 0);
                    const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length;
                    return { mean, count: values.length };
                }
            },
            {
                name: 'stats_median',
                description: 'Calculate median of a numeric field.',
                parameters: { data: 'object[]', field: 'string' },
                handler: async (params) => {
                    const values = params.data.map((item: DataRecord) => Number(item[params.field]) || 0).sort((a: number, b: number) => a - b);
                    const mid = Math.floor(values.length / 2);
                    const median = values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
                    return { median };
                }
            },
            {
                name: 'stats_min_max',
                description: 'Get min and max of a numeric field.',
                parameters: { data: 'object[]', field: 'string' },
                handler: async (params) => {
                    const values = params.data.map((item: DataRecord) => Number(item[params.field]) || 0);
                    return { min: Math.min(...values), max: Math.max(...values) };
                }
            },
            {
                name: 'stats_std_dev',
                description: 'Calculate standard deviation of a numeric field.',
                parameters: { data: 'object[]', field: 'string' },
                handler: async (params) => {
                    const values = params.data.map((item: DataRecord) => Number(item[params.field]) || 0);
                    const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length;
                    const variance = values.reduce((acc: number, v: number) => acc + Math.pow(v - mean, 2), 0) / values.length;
                    return { stdDev: Math.sqrt(variance), mean };
                }
            },
            {
                name: 'stats_percentile',
                description: 'Calculate a percentile of a numeric field.',
                parameters: { data: 'object[]', field: 'string', percentile: 'number' },
                handler: async (params) => {
                    const values = params.data.map((item: DataRecord) => Number(item[params.field]) || 0).sort((a: number, b: number) => a - b);
                    const index = Math.ceil((params.percentile / 100) * values.length) - 1;
                    return { percentile: params.percentile, value: values[Math.max(0, index)] };
                }
            },
            {
                name: 'stats_count_by',
                description: 'Count occurrences grouped by a field.',
                parameters: { data: 'object[]', field: 'string' },
                handler: async (params) => {
                    const counts: Record<string, number> = {};
                    params.data.forEach((item: DataRecord) => {
                        const key = String(item[params.field]);
                        counts[key] = (counts[key] || 0) + 1;
                    });
                    return { counts };
                }
            },

            // === Performance Profiling ===
            {
                name: 'perf_get_fps',
                description: 'Get current FPS (frames per second).',
                parameters: {},
                handler: async () => {
                    const latest = performanceHistory[performanceHistory.length - 1];
                    return { fps: latest?.fps || 0, timestamp: latest?.timestamp };
                }
            },
            {
                name: 'perf_get_memory',
                description: 'Get current JS heap memory usage in MB.',
                parameters: {},
                handler: async () => {
                    const mem = (performance as { memory?: { usedJSHeapSize: number, totalJSHeapSize: number, jsHeapSizeLimit: number } }).memory;
                    return {
                        usedMB: mem ? Math.round(mem.usedJSHeapSize / 1024 / 1024) : 0,
                        totalMB: mem ? Math.round(mem.totalJSHeapSize / 1024 / 1024) : 0,
                        limitMB: mem ? Math.round(mem.jsHeapSizeLimit / 1024 / 1024) : 0
                    };
                }
            },
            {
                name: 'perf_get_history',
                description: 'Get FPS/memory history for the last N seconds.',
                parameters: { seconds: 'number' },
                handler: async (params) => {
                    const cutoff = Date.now() - (params.seconds * 1000);
                    const history = performanceHistory.filter(p => p.timestamp >= cutoff);
                    return { count: history.length, history };
                }
            },
            {
                name: 'perf_get_timing',
                description: 'Get page load timing metrics.',
                parameters: {},
                handler: async () => {
                    const timing = performance.timing || {} as PerformanceTiming;
                    return {
                        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                        loadComplete: timing.loadEventEnd - timing.navigationStart,
                        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0
                    };
                }
            },
            {
                name: 'perf_mark',
                description: 'Create a performance mark for profiling.',
                parameters: { name: 'string' },
                handler: async (params) => {
                    performance.mark(params.name);
                    return { success: true, mark: params.name };
                }
            },
            {
                name: 'perf_measure',
                description: 'Measure time between two marks.',
                parameters: { name: 'string', startMark: 'string', endMark: 'string' },
                handler: async (params) => {
                    try {
                        performance.measure(params.name, params.startMark, params.endMark);
                        const entries = performance.getEntriesByName(params.name);
                        const latest = entries[entries.length - 1];
                        return { duration: latest?.duration || 0 };
                    } catch (e: unknown) {
                        return { error: (e as Error).message };
                    }
                }
            },

            // === Validation ===
            {
                name: 'data_validate_schema',
                description: 'Validate data against a simple schema.',
                parameters: { data: 'object', schema: 'object' },
                handler: async (params) => {
                    const errors: string[] = [];
                    for (const [key, type] of Object.entries(params.schema)) {
                        const val = (params.data as DataRecord)[key];
                        if (val === undefined) {
                            errors.push(`Missing required field: ${key}`);
                        } else if (typeof val !== type) {
                            errors.push(`Field ${key} should be ${type}, got ${typeof val}`);
                        }
                    }
                    return { valid: errors.length === 0, errors };
                }
            },

            // === Aggregation ===
            {
                name: 'data_aggregate',
                description: 'Aggregate data with multiple operations.',
                parameters: { data: 'object[]', operations: '{field: string, op: sum|count|avg|min|max}[]' },
                handler: async (params) => {
                    const result: Record<string, number> = {};
                    for (const op of params.operations) {
                        const values = params.data.map((item: DataRecord) => Number(item[op.field]) || 0);
                        switch (op.op) {
                            case 'sum': result[`${op.field}_sum`] = values.reduce((a: number, b: number) => a + b, 0); break;
                            case 'count': result[`${op.field}_count`] = values.length; break;
                            case 'avg': result[`${op.field}_avg`] = values.reduce((a: number, b: number) => a + b, 0) / values.length; break;
                            case 'min': result[`${op.field}_min`] = Math.min(...values); break;
                            case 'max': result[`${op.field}_max`] = Math.max(...values); break;
                        }
                    }
                    return result;
                }
            },

            // === Export ===
            {
                name: 'data_export_chart_svg',
                description: 'Generate a simple bar chart as SVG.',
                parameters: { data: 'object[]', labelField: 'string', valueField: 'string', title: 'string?' },
                handler: async (params) => {
                    const width = 400, height = 200, padding = 40;
                    const values = params.data.map((d: DataRecord) => Number(d[params.valueField]) || 0);
                    const maxVal = Math.max(...values, 1);
                    const barWidth = (width - padding * 2) / values.length;

                    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
                    svg += `<rect width="100%" height="100%" fill="#0a1222"/>`;
                    if (params.title) svg += `<text x="${width / 2}" y="20" text-anchor="middle" fill="#00f2ff" font-size="12">${params.title}</text>`;

                    values.forEach((v: number, i: number) => {
                        const barHeight = (v / maxVal) * (height - padding * 2);
                        const x = padding + i * barWidth;
                        const y = height - padding - barHeight;
                        svg += `<rect x="${x}" y="${y}" width="${barWidth - 2}" height="${barHeight}" fill="#00f2ff"/>`;
                        svg += `<text x="${x + barWidth / 2}" y="${height - 10}" text-anchor="middle" fill="#666" font-size="8">${(params.data[i] as DataRecord)[params.labelField]}</text>`;
                    });

                    svg += '</svg>';
                    return { svg };
                }
            }
        ]
    });

    console.log('[DataLimb] 30 capabilities registered.');
};
