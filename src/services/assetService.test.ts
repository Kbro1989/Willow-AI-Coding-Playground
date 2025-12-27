import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadAsset, deleteAsset } from './assetService';
import { db } from '../lib/db';

// Global mocks for fetch
global.fetch = vi.fn();

vi.mock('../lib/db', () => ({
    db: {
        transact: vi.fn().mockResolvedValue({ success: true })
    },
    id: () => 'mock-id',
    tx: new Proxy({}, {
        get: () => new Proxy({}, {
            get: () => ({
                update: vi.fn().mockReturnValue({ success: true }),
                delete: vi.fn().mockReturnValue({ success: true })
            })
        })
    })
}));

describe('AssetService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should upload asset successfully', async () => {
        const mockFile = new File(['hello'], 'hello.txt', { type: 'text/plain' });
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ url: 'http://r2.url/hello.txt', id: 'worker-id' })
        });

        const asset = await uploadAsset(mockFile, 'hello.txt', 'image', 'user-1');

        expect(asset).not.toBeNull();
        expect(asset?.url).toBe('http://r2.url/hello.txt');
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/assets'), expect.any(Object));
        expect(db.transact).toHaveBeenCalled();
    });

    it('should handle upload failure', async () => {
        const mockFile = new File(['hello'], 'hello.txt', { type: 'text/plain' });
        (global.fetch as any).mockResolvedValue({
            ok: false
        });

        const asset = await uploadAsset(mockFile);
        expect(asset).toBeNull();
    });

    it('should delete asset successfully', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true
        });

        const result = await deleteAsset('asset-123');
        expect(result.success).toBe(true);
        expect(db.transact).toHaveBeenCalled();
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/assets/asset-123'), expect.any(Object));
    });
});
