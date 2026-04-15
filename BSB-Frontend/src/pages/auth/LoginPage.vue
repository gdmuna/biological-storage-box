<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoginFormSchema } from '@/schemas/user.schema';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

const account = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function handleLogin() {
    error.value = '';
    const result = LoginFormSchema.safeParse({
        account: account.value,
        password: password.value
    });
    if (!result.success) {
        error.value = result.error.issues[0].message;
        return;
    }
    loading.value = true;
    try {
        await auth.doLogin(result.data);
        router.push('/dashboard');
    } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : '登录失败';
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <div class="flex min-h-screen items-center justify-center bg-bsb-bg-surface p-4">
        <Card class="w-full max-w-sm rounded-xl border-0 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.06)]">
            <CardHeader class="space-y-1 pb-4 text-center">
                <div class="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-[#f2f9ff]">
                    <img src="/icons/logo.svg" class="size-6" alt="BSB" />
                </div>
                <CardTitle class="font-display text-xl font-bold tracking-tight text-bsb-text-primary">登录</CardTitle>
                <CardDescription class="text-xs text-bsb-text-quaternary">生物样本储存管理系统</CardDescription>
            </CardHeader>
            <CardContent>
                <form class="space-y-4" @submit.prevent="handleLogin">
                    <div class="space-y-2">
                        <Label for="account" class="text-bsb-text-secondary">用户名</Label>
                        <Input id="account" v-model="account" name="account" placeholder="请输入用户名" autocomplete="username" class="border-bsb-border-standard bg-bsb-bg-surface text-bsb-text-primary placeholder:text-bsb-text-quaternary" />
                    </div>
                    <div class="space-y-2">
                        <Label for="password" class="text-bsb-text-secondary">密码</Label>
                        <Input id="password" v-model="password" name="password" type="password" placeholder="请输入密码" autocomplete="current-password" class="border-bsb-border-standard bg-bsb-bg-surface text-bsb-text-primary placeholder:text-bsb-text-quaternary" />
                    </div>
                    <p v-if="error" role="alert" class="text-sm text-red-500">{{ error }}</p>
                    <Button type="submit" class="w-full bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" :disabled="loading">
                        {{ loading ? '登录中…' : '登录' }}
                    </Button>
                    <RouterLink to="/login/email" class="block text-center text-sm text-bsb-accent-brand hover:text-bsb-accent-hover">使用邮箱验证码登录</RouterLink>
                    <p class="text-center text-sm text-bsb-text-quaternary">
                        没有账号？
                        <RouterLink to="/register" class="text-bsb-accent-brand hover:text-bsb-accent-hover">注册</RouterLink>
                    </p>
                </form>
            </CardContent>
        </Card>
    </div>
</template>
