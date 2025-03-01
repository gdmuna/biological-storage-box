<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm h-full mx-auto px-10 py-10 flex-1">
            <v-img class="w-1/2 max-w-48 mx-auto my-10 bg-white rounded-lg" cover src="/RhineLab.svg"></v-img>
            <v-form class="w-full max-w-sm mx-auto" @submit.prevent="verifyCode">
                <!-- 显示邮箱地址（只读） -->
                <v-text-field v-model="user.email" label="邮箱地址" readonly required></v-text-field>

                <!-- 输入验证码和发送验证码按钮 -->
                <v-text-field v-model="user.code" label="输入你的验证码" :append-inner-icon="mdiShieldKey" :rules="[rules.required]" required>
                    <template #append>
                        <v-btn text small :disabled="sending" @click="sendCode">
                            {{ sending ? '发送中...' : '发送验证码' }}
                        </v-btn>
                    </template>
                </v-text-field>

                <!-- 下一步按钮 -->
                <v-btn :disabled="!user.code" class="mt-2" text="下一步" type="submit" block>下一步</v-btn>
            </v-form>

            <!-- 返回登录链接 -->
            <div class="text-center mt-4">
                <span>
                    已有账户？
                    <a href="#" class="text-blue-500" @click.prevent="goToLogin">返回登录</a>
                </span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'VerifyCodePage',
    data() {
        return {
            user: {
                email: this.$route.query.email || '', // 获取上一步传来的邮箱
                code: null
            },
            sending: false, // 控制发送验证码按钮状态
            rules: {
                required: (value) => !!value || '此字段为必填项'
            }
        };
    },
    methods: {
        // 验证验证码
        verifyCode() {
            this.$api.auth
                .verifyCode({ email: this.user.email, code: this.user.code })
                .then(() => {
                    this.$api.notify.success('验证码验证成功');
                    this.$router.push('/auth/setNewPassword'); // 跳转到设置新密码页面
                })
                .catch(() => {
                    this.$api.notify.error('验证码无效，请重试');
                });
        },
        // 发送验证码
        sendCode() {
            this.sending = true;
            this.$api.auth
                .sendVerificationCode({ email: this.user.email })
                .then(() => {
                    this.$api.notify.success('验证码已发送');
                })
                .catch(() => {
                    this.$api.notify.error('发送验证码失败，请稍后重试');
                })
                .finally(() => {
                    this.sending = false;
                });
        },
        goToLogin() {
            this.$router.push('/auth/login');
        }
    }
};
</script>

<style scoped></style>
