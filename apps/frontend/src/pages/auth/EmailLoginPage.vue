<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmailCodeFormSchema, EmailLoginFormSchema } from '@/schemas/user.schema';
import { useAuthStore } from '@/stores/auth';
import { sendEmailCode as sendCodeApi } from '@/api/modules/user';

const router = useRouter();
const auth = useAuthStore();

const email = ref('');
const code = ref('');
const loading = ref(false);
const sending = ref(false);
const error = ref('');
const info = ref('');

async function handleSendCode() {
    error.value = '';
    info.value = '';
    const parsed = EmailCodeFormSchema.safeParse({ email: email.value });
    if (!parsed.success) {
        error.value = parsed.error.issues[0].message;
        return;
    }

    sending.value = true;
    try {
        await sendCodeApi(parsed.data.email);
        info.value = '验证码已发送，请查收邮箱';
    } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : '发送失败';
    } finally {
        sending.value = false;
    }
}

async function handleLogin() {
    error.value = '';
    info.value = '';
    const parsed = EmailLoginFormSchema.safeParse({ email: email.value, code: code.value });
    if (!parsed.success) {
        error.value = parsed.error.issues[0].message;
        return;
    }

    loading.value = true;
    try {
        await auth.doEmailLogin(parsed.data);
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
                <CardTitle class="font-display text-xl font-bold tracking-tight text-bsb-text-primary">邮箱验证码登录</CardTitle>
                <CardDescription class="text-xs text-bsb-text-quaternary">输入邮箱并使用验证码登录</CardDescription>
            </CardHeader>
            <CardContent>
                <form class="space-y-4" @submit.prevent="handleLogin">
                    <div class="space-y-2">
                        <Label for="email" class="text-bsb-text-secondary">邮箱</Label>
                        <Input id="email" v-model="email" name="email" type="email" placeholder="请输入邮箱" autocomplete="email" />
                    </div>
                    <div class="space-y-2">
                        <Label for="code" class="text-bsb-text-secondary">验证码</Label>
                        <Input id="code" v-model="code" name="code" placeholder="请输入验证码" />
                    </div>

                    <Button type="button" variant="outline" class="w-full" :disabled="sending" @click="handleSendCode">
                        {{ sending ? '发送中…' : '发送验证码' }}
                    </Button>

                    <p v-if="info" class="text-sm text-emerald-600">{{ info }}</p>
                    <p v-if="error" role="alert" class="text-sm text-red-500">{{ error }}</p>

                    <Button type="submit" class="w-full bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" :disabled="loading">
                        {{ loading ? '登录中…' : '登录' }}
                    </Button>

                    <p class="text-center text-sm text-bsb-text-quaternary">
                        使用密码登录？
                        <RouterLink to="/login" class="text-bsb-accent-brand hover:text-bsb-accent-hover">返回账号登录</RouterLink>
                    </p>
                </form>
            </CardContent>
        </Card>
    </div>
</template>
