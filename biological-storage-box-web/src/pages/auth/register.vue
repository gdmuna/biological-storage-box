<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm h-full mx-auto px-10 py-10 flex-1">
            <v-img class="w-1/2 max-w-48 mx-auto my-10 bg-white rounded-lg" cover src="/RhineLab.svg"></v-img>
            <v-form class="w-full max-w-sm mx-auto" @submit.prevent="register">
                <v-text-field v-model="user.account" label="用户名"></v-text-field>
                <v-text-field v-model="user.nickname" label="昵称"></v-text-field>
                <v-text-field v-model="user.realName" label="真实姓名"></v-text-field>
                <v-text-field v-model="user.password" label="密码" :type="showPassword ? 'text' : 'password'" :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'" @click:append-inner="showPassword = !showPassword"></v-text-field>
                <v-btn :disabled="!isFormValid" class="mt-2" text="注册" type="submit" block>注册</v-btn>
            </v-form>
            <div class="text-center mt-4">
                <span>
                    已有账户？
                    <a href="#" class="text-blue-500" @click.prevent="goToLogin">去登录</a>
                </span>
            </div>
            <!-- 显示注册失败消息 -->
            <v-alert v-if="registerError" type="error" dismissible class="rounded-lg p-2 mx-auto mt-8 sm:w-2/3 md:w-1/2 lg:w-1/3">用户名重复，请重新输入</v-alert>
            <!-- 显示注册成功消息 -->
            <v-alert v-if="registerSuccess" type="success" dismissible class="rounded-lg p-2 mx-auto mt-8 sm:w-2/3 md:w-1/2 lg:w-1/3">注册成功，请登录</v-alert>
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
                account: null,
                nickname: null,
                realName: null,
                password: null
            },
            showPassword: false,
            // 控制 v-alert 显示的变量
            registerError: false,
            registerSuccess: false
        };
    },
    computed: {
        isFormValid() {
            return this.user.account && this.user.nickname && this.user.realName && this.user.password;
        }
    },
    methods: {
        async register() {
            const result = await this.$api.auth.register({ account: this.user.account, nickname: this.user.nickname, realName: this.user.realName, password: this.user.password });
            // 如果注册失败则直接结束后续操作
            if (result !== 200) {
                this.registerError = true;
                setTimeout(() => {
                    this.registerError = false;
                }, 3000);
                return;
            }
            this.registerSuccess = true;
            setTimeout(() => {
                this.registerSuccess = false;
                this.$router.push('/auth/login');
            }, 3000);
        },
        //跳转去登录页面
        goToLogin() {
            this.$router.push('/auth/login');
        }
    }
};
</script>

<style scoped></style>
