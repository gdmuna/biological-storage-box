import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserInfo } from '@/schemas/user.schema';
import { getMyInfo, login, logout, register } from '@/api/modules/auth';
import { emailLogin } from '@/api/modules/user';
import type { LoginForm, RegisterForm } from '@/schemas/user.schema';
import { setAccessToken, callRefreshToken } from '@/api/token';

export const useAuthStore = defineStore('auth', () => {
    const user = ref<UserInfo | null>(null);
    const initialized = ref(false);

    const isLoggedIn = computed(() => !!user.value);

    /**
     * Called once on app startup.
     * Uses the HttpOnly refresh-token cookie to obtain a new access token,
     * then fetches full user info.
     */
    async function fetchMe() {
        try {
            const newToken = await callRefreshToken();
            if (!newToken) {
                user.value = null;
                return;
            }
            setAccessToken(newToken);
            user.value = await getMyInfo().send();
        } catch {
            user.value = null;
            setAccessToken(null);
        } finally {
            initialized.value = true;
        }
    }

    async function doLogin(form: LoginForm) {
        const result = await login(form).send();
        setAccessToken(result.accessToken);
        user.value = await getMyInfo().send(true);
        initialized.value = true;
    }

    async function doRegister(form: RegisterForm) {
        const result = await register(form).send();
        setAccessToken(result.accessToken);
        user.value = await getMyInfo().send(true);
        initialized.value = true;
    }

    async function doEmailLogin(payload: { email: string; code: string }) {
        const result = await emailLogin(payload).send();
        setAccessToken(result.accessToken);
        user.value = await getMyInfo().send(true);
        initialized.value = true;
    }

    async function doLogout() {
        await logout().send();
        setAccessToken(null);
        user.value = null;
    }

    return { user, initialized, isLoggedIn, fetchMe, doLogin, doRegister, doEmailLogin, doLogout };
});
