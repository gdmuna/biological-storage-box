<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm h-full mx-auto px-10 py-10 flex-1">
            <v-img class="w-1/2 max-w-48 mx-auto mt-3 mb-10 bg-white rounded-lg" cover src="/RhineLab.svg"></v-img>
            <v-form class="w-full max-w-sm mx-auto" @submit.prevent="register">
                <v-text-field v-model="user.account" label="用户名"></v-text-field>
                <v-text-field v-model="user.nickName" label="昵称"></v-text-field>
                <v-text-field v-model="user.realName" label="真实姓名"></v-text-field>
                <v-text-field v-model="user.password" label="密码" :type="showPassword ? 'text' : 'password'" :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'" :rules="[rules.minLength]" @click:append-inner="showPassword = !showPassword"></v-text-field>
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
                account: null,
                nickName: null,
                realName: null,
                password: null
            },
            showPassword: false,
            // 控制注册按钮是否可点击
            loading: false,
            rules: {
                minLength: (value) => (value && value.length >= 6) || '密码长度至少为6位'
            }
        };
    },
    computed: {
        // 判断表单是否填写完整，从而是否可以点击注册按钮
        isFormValid() {
            const firstValue = this.user.account && this.user.nickName && this.user.realName;
            const secondeValue = this.user.password && this.user.password.length >= 6
            if (firstValue && secondeValue === true) {
                return true;
            } else {
                return false;
            }
        }
    },
    methods: {
        async register() {
            // 禁用注册按钮
            this.loading = true;
            const result = await this.$api.auth.register({ account: this.user.account, nickName: this.user.nickName, realName: this.user.realName, password: this.user.password });
            // 如果注册失败则直接结束后续操作
            if (!result) {
                this.$api.notify.error('用户名重复，请重新输入');
                this.loading = false;
                return;
            } else {
                this.$api.notify.success('注册成功，请登录');
                this.$router.push('/auth/login');
            }
        },
        //跳转去登录页面
        goToLogin() {
            this.$router.push('/auth/login');
        }
    }
};
</script>

<style scoped></style>
