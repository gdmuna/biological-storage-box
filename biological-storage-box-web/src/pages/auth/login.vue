<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm h-full mx-auto px-10 py-10 flex-1">
            <v-img class="mx-auto my-10 bg-white" width="200" aspect-ratio="1/1" cover src="/RhineLab.svg"></v-img>
            <v-form @submit.prevent="login">
                <v-text-field v-model="user.username" label="用户名"></v-text-field>
                <v-text-field v-model="user.password" label="密码"></v-text-field>
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
                username: null,
                password: null
            }
        };
    },
    created() {},
    mounted() {},
    updated() {},
    methods: {
        async login() {
            const result = await this.$api.auth.login({ phoneNumber: this.user.username, password: this.user.password });
            if (result) {
                this.$router.push('/box/manage');
            }
        }
    }
};
</script>

<style scoped></style>
