<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth';
import { updateUserInfo, updatePassword } from '@/api/modules/user';
import EmailSecurityPanel from '@/components/user/EmailSecurityPanel.vue';

const auth = useAuthStore();

type Tab = 'info' | 'password';
const activeTab = ref<Tab>('info');

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
        <h1 class="font-display text-2xl font-bold tracking-tight text-bsb-text-primary">账号信息</h1>

        <!-- Tab bar -->
        <div class="flex gap-1 rounded-lg bg-bsb-bg-surface p-1">
            <button class="flex-1 rounded-md py-1.5 text-sm font-medium transition-all" :class="activeTab === 'info' ? 'bg-white text-bsb-text-primary shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-[rgba(0,0,0,0.06)]' : 'text-bsb-text-tertiary hover:text-bsb-text-secondary'" @click="activeTab = 'info'">基本信息</button>
            <button class="flex-1 rounded-md py-1.5 text-sm font-medium transition-all" :class="activeTab === 'password' ? 'bg-white text-bsb-text-primary shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-[rgba(0,0,0,0.06)]' : 'text-bsb-text-tertiary hover:text-bsb-text-secondary'" @click="activeTab = 'password'">修改密码</button>
        </div>

        <!-- Profile info tab -->
        <Card v-if="activeTab === 'info'" class="rounded-xl border-bsb-border-standard bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <CardContent class="pt-6">
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
                    <p v-if="infoError" class="text-sm text-red-500">{{ infoError }}</p>
                    <Button type="submit" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" :disabled="infoLoading">
                        {{ infoLoading ? '保存中…' : '保存' }}
                    </Button>
                </form>
            </CardContent>
        </Card>

        <!-- Change password tab -->
        <Card v-if="activeTab === 'password'" class="rounded-xl border-bsb-border-standard bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <CardContent class="pt-6">
                <form class="space-y-4" @submit.prevent="handleUpdatePassword">
                    <div class="space-y-2">
                        <Label class="text-bsb-text-secondary">当前密码</Label>
                        <Input v-model="oldPassword" type="password" placeholder="输入当前密码" autocomplete="current-password" class="border-bsb-border-standard bg-bsb-bg-surface text-bsb-text-primary" />
                    </div>
                    <div class="space-y-2">
                        <Label class="text-bsb-text-secondary">新密码</Label>
                        <Input v-model="newPassword" type="password" placeholder="输入新密码（至少8位）" autocomplete="new-password" class="border-bsb-border-standard bg-bsb-bg-surface text-bsb-text-primary" />
                    </div>
                    <p v-if="pwError" class="text-sm text-red-500">{{ pwError }}</p>
                    <Button type="submit" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" :disabled="pwLoading">
                        {{ pwLoading ? '修改中…' : '修改密码' }}
                    </Button>
                </form>
            </CardContent>
        </Card>

        <Card class="rounded-xl border-bsb-border-standard bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <CardContent class="pt-6">
                <EmailSecurityPanel />
            </CardContent>
        </Card>
    </div>
</template>
