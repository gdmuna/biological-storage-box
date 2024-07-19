<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm h-full mx-auto px-10 py-10 flex-1">
            <v-img class="w-1/2 max-w-48 mx-auto my-10 bg-white rounded-lg" cover src="/RhineLab.svg"></v-img>
            <v-form class="w-full max-w-sm mx-auto" @submit.prevent="login">
                <v-text-field v-model="user.account" label="用户名"></v-text-field>
                <v-text-field v-model="user.password" label="密码" :type="showPassword ? 'text' : 'password'" :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'" @click:append-inner="showPassword = !showPassword"></v-text-field>
                <v-btn class="mt-2" text="登录" type="submit" block></v-btn>
            </v-form>
        </div>
    </div>
</template>

<script>
export default {
    name: 'LoginPage',
    components: {},
    data() {
        return {
            user: {
                account: null,
                password: null
            },
            showPassword: false
        };
    },
    created() {},
    mounted() {},
    updated() {},
    methods: {
        async login() {
            const result = await this.$api.auth.login({ account: this.user.account, password: this.user.password });
            // 如果登录失败则直接结束后续操作
            if (!result) {
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
            this.$router.push('/box');
        }
    }
};
</script>

<style scoped></style>
