<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/auth';
import { updateUserInfo, updatePassword } from '@/api/modules/user';

const auth = useAuthStore();

const nickname = ref(auth.user?.nickname ?? '');
const realname = ref(auth.user?.realname ?? '');
const infoError = ref('');
const infoLoading = ref(false);

const oldPassword = ref('');
const newPassword = ref('');
const pwError = ref('');
const pwLoading = ref(false);

async function handleUpdateInfo() {
    infoError.value = '';
    infoLoading.value = true;
    try {
        await updateUserInfo({
            nickname: nickname.value || undefined,
            realname: realname.value || undefined
        }).send();
        await auth.fetchMe();
    } catch (e: unknown) {
        infoError.value = e instanceof Error ? e.message : '更新失败';
    } finally {
        infoLoading.value = false;
    }
}

async function handleUpdatePassword() {
    pwError.value = '';
    if (newPassword.value.length < 8) {
        pwError.value = '密码至少8位';
        return;
    }
    pwLoading.value = true;
    try {
        await updatePassword({
            oldPassword: oldPassword.value,
            newPassword: newPassword.value
        }).send();
        oldPassword.value = '';
        newPassword.value = '';
    } catch (e: unknown) {
        pwError.value = e instanceof Error ? e.message : '修改失败';
    } finally {
        pwLoading.value = false;
    }
}
</script>

<template>
    <div class="max-w-lg space-y-6">
        <h1 class="text-2xl font-[590] text-bsb-text-primary">个人设置</h1>

        <!-- Profile info -->
        <Card class="border-bsb-border-standard bg-bsb-bg-panel">
            <CardHeader>
                <CardTitle class="text-sm text-bsb-text-primary">基本信息</CardTitle>
            </CardHeader>
            <CardContent>
                <form class="space-y-4" @submit.prevent="handleUpdateInfo">
                    <div class="space-y-2">
                        <Label class="text-bsb-text-secondary">用户名</Label>
                        <Input :model-value="auth.user?.username ?? ''" disabled class="border-bsb-border-standard bg-bsb-bg-surface text-bsb-text-quaternary" />
                    </div>
                    <div class="space-y-2">
                        <Label class="text-bsb-text-secondary">邮箱</Label>
                        <Input :model-value="auth.user?.email ?? ''" disabled class="border-bsb-border-standard bg-bsb-bg-surface text-bsb-text-quaternary" />
                    </div>
                    <div class="space-y-2">
                        <Label class="text-bsb-text-secondary">昵称</Label>
                        <Input v-model="nickname" placeholder="输入昵称" class="border-bsb-border-standard bg-bsb-bg-surface text-bsb-text-primary" />
                    </div>
                    <div class="space-y-2">
                        <Label class="text-bsb-text-secondary">真实姓名</Label>
                        <Input v-model="realname" placeholder="输入真实姓名" class="border-bsb-border-standard bg-bsb-bg-surface text-bsb-text-primary" />
                    </div>
                    <p v-if="infoError" class="text-sm text-red-400">{{ infoError }}</p>
                    <Button type="submit" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" :disabled="infoLoading">
                        {{ infoLoading ? '保存中…' : '保存' }}
                    </Button>
                </form>
            </CardContent>
        </Card>

        <Separator class="bg-bsb-border-standard" />

        <!-- Change password -->
        <Card class="border-bsb-border-standard bg-bsb-bg-panel">
            <CardHeader>
                <CardTitle class="text-sm text-bsb-text-primary">修改密码</CardTitle>
            </CardHeader>
            <CardContent>
                <form class="space-y-4" @submit.prevent="handleUpdatePassword">
                    <div class="space-y-2">
                        <Label class="text-bsb-text-secondary">当前密码</Label>
                        <Input v-model="oldPassword" type="password" placeholder="输入当前密码" autocomplete="current-password" class="border-bsb-border-standard bg-bsb-bg-surface text-bsb-text-primary" />
                    </div>
                    <div class="space-y-2">
                        <Label class="text-bsb-text-secondary">新密码</Label>
                        <Input v-model="newPassword" type="password" placeholder="输入新密码（至少8位）" autocomplete="new-password" class="border-bsb-border-standard bg-bsb-bg-surface text-bsb-text-primary" />
                    </div>
                    <p v-if="pwError" class="text-sm text-red-400">{{ pwError }}</p>
                    <Button type="submit" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" :disabled="pwLoading">
                        {{ pwLoading ? '修改中…' : '修改密码' }}
                    </Button>
                </form>
            </CardContent>
        </Card>
    </div>
</template>
