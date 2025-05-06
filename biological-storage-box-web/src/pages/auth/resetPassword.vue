<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm h-full mx-auto px-10 py-10 flex-1">
            <v-img class="w-1/2 max-w-48 mx-auto my-10 bg-white rounded-lg" cover src="/RhineLab.svg"></v-img>
            <v-form class="w-full max-w-sm mx-auto" @submit.prevent="resetPassword">
                <!-- 邮箱输入框 -->
                <v-text-field v-model="email" label="当前邮箱" type="email" outlined dense></v-text-field>
                <!-- 验证码输入框 -->
                <v-text-field v-model="code" label="输入你的验证码" :append-inner-icon="'mdi-shield-key'" :rules="[rules.notNull]" outlined dense>
                    <template #append>
                        <v-btn text small :disabled="!email || sending || countdown > 0" @click="sendCode">
                            {{ countdown > 0 ? countdown + '秒后重发' : sending ? '发送中...' : '发送验证码' }}
                        </v-btn>
                    </template>
                </v-text-field>
                <!-- 新密码输入框 -->
                <v-text-field v-model="newPassword" label="新密码" :type="showNewPassword ? 'text' : 'password'" :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'" :rules="[rules.notNull, rules.minLength]" outlined dense @click:append-inner="showNewPassword = !showNewPassword"></v-text-field>
                <!-- 确认新密码输入框 -->
                <v-text-field v-model="confirmPassword" label="确认新密码" :type="showConfirmPassword ? 'text' : 'password'" :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'" :rules="[rules.notNull, rules.minLength, rules.matchPassword]" outlined dense @click:append-inner="showConfirmPassword = !showConfirmPassword"></v-text-field>
                <!-- 重置密码按钮 -->
                <v-btn :loading="isResetting" :disabled="!isPasswordFieldsFilled || isResetting" class="mt-4 bg-custom-green text-white" type="submit" block>重置密码</v-btn>
            </v-form>
            <!-- 返回登录链接 -->
            <div class="text-center mt-4">
                <span>
                    记得密码了？
                    <a href="#" class="text-blue-500" @click.prevent="goToLogin">去登录</a>
                </span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ResetPasswordPage',
    data() {
        return {
            email: '',
            code: '',
            newPassword: '',
            confirmPassword: '',
            showNewPassword: false,
            showConfirmPassword: false,
            isResetting: false,
            // 控制“修改密码按钮”是否可点击
            isUpdatingEmail: false,
            countdown: 0,
            sending: false,
            rules: {
                notNull: (value) => !!value || '此处不能为空',
                minLength: (value) => (value && value.length >= 6) || '密码长度至少为6位',
                matchPassword: (value) => value === this.newPassword || '两次输入的密码不匹配'
            }
        };
    },
    computed: {
        isPasswordFieldsFilled() {
            return this.newPassword && this.confirmPassword && this.newPassword === this.confirmPassword && this.newPassword.length >= 6;
        }
    },
    methods: {
        async resetPassword() {
            this.isResetting = true;
            const result = await this.$api.user.updatePassword({ email: this.email, code: this.code, newPassword: this.newPassword });
            if (result === '操作成功') {
                this.$api.notify.success('密码重置成功！请重新登录');
                this.$router.push('/auth/login');
            } else {
                this.$api.notify.error('密码重置失败，请重试');
            }
            this.isResetting = false;
        },
        goToLogin() {
            this.$router.push('/auth/login');
        },
        // 点击发送验证码按钮
        async sendCode() {
            // 防止重复点击
            if (this.sending || this.countdown > 0) return;
            this.sending = true;
            try {
                await this.$api.user.sendEmail({ email: this.email });
                this.$api.notify.success('验证码已发送');
                // 成功后启动60秒倒计时
                this.startCountdown(60);
            } catch (error) {
                this.$api.notify.error('发送验证码失败，请稍后重试');
            } finally {
                this.sending = false;
            }
        },
        // 启动倒计时
        startCountdown(seconds) {
            this.countdown = seconds;
            this.timer && clearInterval(this.timer);
            this.timer = setInterval(() => {
                this.countdown--;
                if (this.countdown <= 0) {
                    clearInterval(this.timer);
                    this.timer = null;
                }
            }, 1000);
        },
    }
};
</script>

<style scoped>
.bg-custom-green {
    background-color: #95b9a1;
}
</style>
