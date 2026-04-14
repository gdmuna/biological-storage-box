import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '@/stores/auth';

const mockUser = {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    nickname: null,
    realname: null,
    createdAt: '2024-01-01T00:00:00.000Z',
};

vi.mock('@/api/modules/auth', () => ({
    getMyInfo: vi.fn(() => ({ send: vi.fn().mockResolvedValue(mockUser) })),
    login: vi.fn(() => ({ send: vi.fn().mockResolvedValue(mockUser) })),
    logout: vi.fn(() => ({ send: vi.fn().mockResolvedValue(undefined) })),
    register: vi.fn(() => ({ send: vi.fn().mockResolvedValue(mockUser) })),
}));

describe('auth store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    it('isLoggedIn is false initially', () => {
        const auth = useAuthStore();
        expect(auth.isLoggedIn).toBe(false);
    });

    it('initialized is false initially', () => {
        const auth = useAuthStore();
        expect(auth.initialized).toBe(false);
    });

    it('user is null initially', () => {
        const auth = useAuthStore();
        expect(auth.user).toBeNull();
    });

    it('fetchMe sets user on success', async () => {
        const auth = useAuthStore();
        await auth.fetchMe();
        expect(auth.user).toEqual(mockUser);
        expect(auth.isLoggedIn).toBe(true);
        expect(auth.initialized).toBe(true);
    });

    it('fetchMe sets initialized even on error', async () => {
        const { getMyInfo } = await import('@/api/modules/auth');
        vi.mocked(getMyInfo).mockReturnValueOnce({
            send: vi.fn().mockRejectedValue(new Error('Unauthorized')),
        } as any);

        const auth = useAuthStore();
        await auth.fetchMe();
        expect(auth.user).toBeNull();
        expect(auth.initialized).toBe(true);
        expect(auth.isLoggedIn).toBe(false);
    });

    it('doLogin sets user', async () => {
        const auth = useAuthStore();
        await auth.doLogin({ account: 'testuser', password: 'password123' });
        expect(auth.user).toEqual(mockUser);
        expect(auth.isLoggedIn).toBe(true);
        expect(auth.initialized).toBe(true);
    });

    it('doRegister sets user', async () => {
        const auth = useAuthStore();
        await auth.doRegister({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
        });
        expect(auth.user).toEqual(mockUser);
        expect(auth.isLoggedIn).toBe(true);
    });

    it('doLogout clears user', async () => {
        const auth = useAuthStore();
        auth.user = mockUser;
        expect(auth.isLoggedIn).toBe(true);

        await auth.doLogout();
        expect(auth.user).toBeNull();
        expect(auth.isLoggedIn).toBe(false);
    });
});
