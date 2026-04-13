<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm h-full mx-auto px-10 py-5 flex-1">
            <v-img class="w-1/2 max-w-48 mx-auto mt-3 mb-10 bg-white rounded-lg" cover src="/RhineLab.svg"></v-img>
            <v-form class="w-full max-w-sm mx-auto" @submit.prevent="register">
                <v-text-field v-model="user.email" label="邮箱地址" :rules="[rules.notNull, rules.email]" required></v-text-field>
                <v-text-field v-model="user.code" label="输入你的验证码" :append-inner-icon="mdiShieldKey" :rules="[rules.notNull]" required>
                    <template #append>
                        <v-btn text small :disabled="!isValidEmail || sending || countdown > 0" @click="sendCode">
                            {{ countdown > 0 ? countdown + '秒后重发' : sending ? '发送中...' : '发送验证码' }}
                        </v-btn>
                    </template>
                </v-text-field>
                <v-text-field v-model="user.nickName" label="昵称" :rules="[rules.notNull]"></v-text-field>
                <v-text-field v-model="user.realName" label="真实姓名" :rules="[rules.notNull]"></v-text-field>
                <v-text-field v-model="user.password" label="密码" :type="showPassword ? 'text' : 'password'" :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'" :rules="[rules.minLength, rules.notNull]" @click:append-inner="showPassword = !showPassword"></v-text-field>
                <v-btn :loading="loading" :disabled="!isFormValid || loading" class="mt-2" text="注册" type="submit" block>注册</v-btn>
            </v-form>
            <div class="text-center mt-4">
                <span>
                    已有账户？
                    <a href="#" class="text-blue-500" @click.prevent="goToLogin">去登录</a>
                </span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'RegisterPage',
    components: {},
    data() {
        return {
            user: {
                email: null,
                code: null,
                account: null,
                nickName: null,
                realName: null,
                password: null
            },
            showPassword: false,
            sending: false, // 控制发送验证码按钮状态
            loading: false, // 控制注册按钮是否可点击
            countdown: 0, // 倒计时秒数
            timer: null, // 存储定时器ID
            rules: {
                minLength: (value) => (value && value.length >= 6) || '密码长度至少为6位',
                notNull: (value) => {
                    if (value) return true;
                    return '此处不能为空';
                },
                email: (value) => /^(?:[a-z0-9]+(?:[.-_][a-z0-9]+)*@[a-z0-9-]+\.[a-z0-9]+(?:\.[a-z0-9]+)*)$/i.test(value) || '邮箱格式不正确'
            }
        };
    },
    computed: {
        // 判断表单是否填写完整，从而是否可以点击注册按钮
        isFormValid() {
            const firstValue = this.user.email && this.user.code && this.user.nickName && this.user.realName;
            const secondeValue = this.user.password && this.user.password.length >= 6;
            return firstValue && secondeValue;
        },
        // 添加邮箱验证的计算属性
        isValidEmail() {
            return this.user.email && this.rules.email(this.user.email) === true;
        }
    },
    methods: {
        async register() {
            // 禁用注册按钮
            this.loading = true;
            const result = await this.$api.auth.register({
                account: this.user.email,
                code: this.user.code,
                nickName: this.user.nickName,
                realName: this.user.realName,
                password: this.user.password
            });
            // 如果注册失败则直接结束后续操作
            if (!result) {
                this.$api.notify.error('邮箱已注册，请重新输入');
                this.loading = false;
                return;
            } else {
                this.$api.notify.success('注册成功，请登录');
                this.$router.push('/auth/login');
            }
        },
        // 点击发送验证码按钮
        async sendCode() {
            // 防止重复点击
            if (this.sending || this.countdown > 0) return;
            this.sending = true;
            const result = await this.$api.user.sendEmail({ email: this.user.email });
            if (result != '验证码发送成功') {
                this.$api.notify.error('发送验证码失败，请稍后重试');
            } else {
                this.$api.notify.success('验证码已发送');
                // 成功后启动60秒倒计时
                this.startCountdown(60);
            }
            this.sending = false;
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
        //跳转去登录页面
        goToLogin() {
            this.$router.push('/auth/login');
        }
    }
};
</script>

<style scoped></style>
