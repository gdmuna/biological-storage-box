import { vi } from 'vitest';

// Stub out alova createAlova so tests don't need a real HTTP adapter
vi.mock('@/api/instance', () => ({
    default: {},
    alovaInstance: {},
}));
