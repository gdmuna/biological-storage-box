import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserInfo } from '@/schemas/user.schema';
import { getMyInfo, login, logout, register } from '@/api/modules/auth';
import type { LoginForm, RegisterForm } from '@/schemas/user.schema';

export const useAuthStore = defineStore('auth', () => {
    const user = ref<UserInfo | null>(null);
    const initialized = ref(false);

    const isLoggedIn = computed(() => !!user.value);

    async function fetchMe() {
        try {
            user.value = await getMyInfo().send();
        } catch {
            user.value = null;
        } finally {
            initialized.value = true;
        }
    }

    async function doLogin(form: LoginForm) {
        user.value = await login(form).send();
        initialized.value = true;
    }

    async function doRegister(form: RegisterForm) {
        user.value = await register(form).send();
        initialized.value = true;
    }

    async function doLogout() {
        await logout().send();
        user.value = null;
    }

    return { user, initialized, isLoggedIn, fetchMe, doLogin, doRegister, doLogout };
});
