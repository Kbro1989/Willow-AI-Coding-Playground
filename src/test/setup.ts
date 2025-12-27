import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Fetch API
global.fetch = vi.fn();

// Mock InstantDB
vi.mock('@instantdb/react', () => ({
    init: () => ({
        useAuth: () => ({ user: { id: 'test-user', email: 'test@example.com' }, isLoading: false }),
        useQuery: () => ({ isLoading: false, error: null, data: {} }),
        transact: vi.fn(),
        tx: new Proxy({}, {
            get: () => new Proxy({}, {
                get: () => ({
                    update: vi.fn(),
                    delete: vi.fn(),
                    link: vi.fn(),
                    unlink: vi.fn(),
                })
            })
        })
    }),
    id: () => 'mock-id-' + Math.random().toString(36).substr(2, 9),
    tx: new Proxy({}, {
        get: () => new Proxy({}, {
            get: () => ({
                update: vi.fn(),
                delete: vi.fn(),
                link: vi.fn(),
                unlink: vi.fn(),
            })
        })
    })
}));

// Mock Console to keep output clean, but allow errors
// global.console = {
//   ...console,
//   log: vi.fn(),
//   info: vi.fn(),
//   warn: vi.fn(),
//   // error: vi.fn(), // Keep errors visible
// };
