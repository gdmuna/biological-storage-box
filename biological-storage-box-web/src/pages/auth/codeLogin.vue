<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm h-full mx-auto px-10 py-10 flex-1">
            <v-img class="w-1/2 max-w-48 mx-auto my-10 bg-white rounded-lg" cover src="/RhineLab.svg"></v-img>
            <v-form class="w-full max-w-sm mx-auto" @submit.prevent="codeLogin">
                <v-text-field v-model="email" label="邮箱"></v-text-field>
                <v-text-field v-model="code" label="输入你的验证码" :append-inner-icon="'mdi-shield-key'" :rules="[rules.notNull]" outlined dense>
                    <template #append>
                        <v-btn text small :disabled="!email || sending || countdown > 0" @click="sendCode">
                            {{ countdown > 0 ? countdown + '秒后重发' : sending ? '发送中...' : '发送验证码' }}
                        </v-btn>
                    </template>
                </v-text-field>
                <v-btn :loading="loading" :disabled="!isFormValid || loading" class="mt-2" text="登录" type="submit" block></v-btn>
            </v-form>
            <!-- 账号密码登录跳转链接 -->
            <div class="text-center mt-4">
                <span>
                    <a href="#" class="text-blue-500" @click.prevent="goToLogin">账号密码登录</a>
                </span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'LoginPage',
    components: {},
    data() {
        return {
            email: null,
            code: null,
            showPassword: false,
            loading: false,
            // 控制“修改密码按钮”是否可点击
            isUpdatingEmail: false,
            countdown: 0,
            sending: false,
            rules: {
                notNull: (value) => !!value || '此处不能为空'
            }
        };
    },
    computed: {
        isFormValid() {
            return this.email && this.code;
        }
    },
    created() {},
    mounted() {},
    updated() {},
    methods: {
        async codeLogin() {
            this.loading = true;
            const result = await this.$api.auth.login({ email: this.email, code: this.code });
            console.log(result);
            // 如果登录失败则直接结束后续操作
            if (!result) {
                this.$api.notify.error('登录失败，请检查用户名和密码');
                this.loading = false;
                return;
            }
            const orgList = await this.$api.org.list();
            // 判断用户是否加入了课题组
            if (orgList.length !== 0) {
                // 从本地存储获取当前课题组ID并检测其是否有效
                const localOrgID = localStorage.getItem('orgID');
                // 判断本地存储的课题组ID是否有效
                if (localOrgID && orgList.some((org) => org.id === parseInt(localOrgID))) {
                    // 如果有效则使用本地存储的课题组ID
                    this.$store.user.currentOrg = localOrgID;
                } else {
                    // 否则使用课题组列表的第一个课题组ID
                    this.$store.user.currentOrg = orgList[0].id;
                    localStorage.setItem('orgID', orgList[0].id);
                }
            }
            this.$api.notify.success('登录成功');
            this.$router.push('/root/manageRoot');
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
        //跳转账号密码登录页面
        goToLogin() {
            this.$router.push('/auth/login');
        }
    }
};
</script>

<style scoped></style>
