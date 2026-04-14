<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Box } from 'lucide-vue-next';
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
    <div class="flex min-h-screen items-center justify-center bg-bsb-bg-marketing p-4">
        <Card class="w-full max-w-sm border-bsb-border-standard bg-bsb-bg-panel">
            <CardHeader class="space-y-1 text-center">
                <div class="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-bsb-accent-brand/10">
                    <Box class="size-5 text-bsb-accent-brand" />
                </div>
                <CardTitle class="text-xl text-bsb-text-primary">注册</CardTitle>
                <CardDescription class="text-bsb-text-tertiary">创建一个新账号</CardDescription>
            </CardHeader>
            <CardContent>
                <form class="space-y-4" @submit.prevent="handleRegister">
                    <div class="space-y-2">
                        <Label for="username" class="text-bsb-text-secondary">用户名</Label>
                        <Input id="username" v-model="username" placeholder="请输入用户名" autocomplete="username" class="border-bsb-border-standard bg-bsb-bg-surface text-bsb-text-primary placeholder:text-bsb-text-quaternary" />
                    </div>
                    <div class="space-y-2">
                        <Label for="email" class="text-bsb-text-secondary">邮箱</Label>
                        <Input id="email" v-model="email" type="email" placeholder="请输入邮箱" autocomplete="email" class="border-bsb-border-standard bg-bsb-bg-surface text-bsb-text-primary placeholder:text-bsb-text-quaternary" />
                    </div>
                    <div class="space-y-2">
                        <Label for="password" class="text-bsb-text-secondary">密码</Label>
                        <Input id="password" v-model="password" type="password" placeholder="请输入密码（至少8位）" autocomplete="new-password" class="border-bsb-border-standard bg-bsb-bg-surface text-bsb-text-primary placeholder:text-bsb-text-quaternary" />
                    </div>
                    <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
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
