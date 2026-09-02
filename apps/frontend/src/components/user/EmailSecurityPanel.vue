<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sendEmailCode, updateEmail, emailUpdatePassword } from '@/api/modules/user';

const newEmail = ref('');
const emailCode = ref('');
const passwordEmail = ref('');
const passwordCode = ref('');
const newPassword = ref('');
const message = ref('');
const error = ref('');

async function handleSendEmailCode(email: string) {
    error.value = '';
    message.value = '';
    try {
        await sendEmailCode(email);
        message.value = '验证码已发送';
    } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : '发送失败';
    }
}

async function handleUpdateEmail() {
    error.value = '';
    message.value = '';
    try {
        await updateEmail({ email: newEmail.value, code: emailCode.value });
        message.value = '邮箱更新成功';
    } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : '更新失败';
    }
}

async function handleEmailPasswordUpdate() {
    error.value = '';
    message.value = '';
    try {
        await emailUpdatePassword({
            email: passwordEmail.value,
            code: passwordCode.value,
            newPassword: newPassword.value
        });
        message.value = '密码更新成功';
    } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : '更新失败';
    }
}
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-3 rounded-lg border border-bsb-border-standard p-4">
            <h3 class="text-sm font-semibold text-bsb-text-primary">修改邮箱</h3>
            <div class="space-y-2">
                <Label>新邮箱</Label>
                <Input v-model="newEmail" type="email" placeholder="输入新邮箱" />
            </div>
            <div class="flex gap-2">
                <Input v-model="emailCode" placeholder="验证码" />
                <Button type="button" variant="outline" @click="handleSendEmailCode(newEmail)">发送验证码</Button>
            </div>
            <Button type="button" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" @click="handleUpdateEmail">确认更新邮箱</Button>
        </div>

        <div class="space-y-3 rounded-lg border border-bsb-border-standard p-4">
            <h3 class="text-sm font-semibold text-bsb-text-primary">邮箱验证码改密</h3>
            <Input v-model="passwordEmail" type="email" placeholder="邮箱" />
            <div class="flex gap-2">
                <Input v-model="passwordCode" placeholder="验证码" />
                <Button type="button" variant="outline" @click="handleSendEmailCode(passwordEmail)">发送验证码</Button>
            </div>
            <Input v-model="newPassword" type="password" placeholder="新密码（至少8位）" />
            <Button type="button" class="bg-bsb-accent-brand text-white hover:bg-bsb-accent-hover" @click="handleEmailPasswordUpdate">确认修改密码</Button>
        </div>

        <p v-if="message" class="text-sm text-emerald-600">{{ message }}</p>
        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
    </div>
</template>
