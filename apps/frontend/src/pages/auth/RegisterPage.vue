<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RegisterFormSchema } from '@/schemas/user.schema';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

const username = ref('');
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function handleRegister() {
    error.value = '';
    const result = RegisterFormSchema.safeParse({
        username: username.value,
        email: email.value,
        password: password.value
    });
    if (!result.success) {
        error.value = result.error.issues[0].message;
        return;
    }
    loading.value = true;
    try {
        await auth.doRegister(result.data);
        router.push('/dashboard');
    } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : '注册失败';
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
                <CardTitle class="font-display text-xl font-bold tracking-tight text-bsb-text-primary">注册</CardTitle>
                <CardDescription class="text-xs text-bsb-text-quaternary">生物样本储存管理系统</CardDescription>
            </CardHeader>
            <CardContent>
                <form class="space-y-4" @submit.prevent="handleRegister">
                    <div class="space-y-2">
                        <Label for="username" class="text-bsb-text-secondary">用户名</Label>
                        <Input id="username" v-model="username" name="username" placeholder="请输入用户名" autocomplete="username" class="border-bsb-border-standard bg-bsb-bg-surface text-bsb-text-primary placeholder:text-bsb-text-quaternary" />
                    </div>
                    <div class="space-y-2">
                        <Label for="email" class="text-bsb-text-secondary">邮箱</Label>
                        <Input id="email" v-model="email" name="email" type="email" placeholder="请输入邮箱" autocomplete="email" class="border-bsb-border-standard bg-bsb-bg-surface text-bsb-text-primary placeholder:text-bsb-text-quaternary" />
                    </div>
                    <div class="space-y-2">
                        <Label for="password" class="text-bsb-text-secondary">密码</Label>
                        <Input id="password" v-model="password" name="password" type="password" placeholder="请输入密码（至少8位）" autocomplete="new-password" class="border-bsb-border-standard bg-bsb-bg-surface text-bsb-text-primary placeholder:text-bsb-text-quaternary" />
                    </div>
                    <p v-if="error" role="alert" class="text-sm text-red-500">{{ error }}</p>
                    <Button type="submit" class="w-full bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" :disabled="loading">
                        {{ loading ? '注册中…' : '注册' }}
                    </Button>
                    <p class="text-center text-sm text-bsb-text-quaternary">
                        已有账号？
                        <RouterLink to="/login" class="text-bsb-accent-brand hover:text-bsb-accent-hover">登录</RouterLink>
                    </p>
                </form>
            </CardContent>
        </Card>
    </div>
</template>
