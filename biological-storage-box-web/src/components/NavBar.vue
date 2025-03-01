<template>
    <v-bottom-navigation v-model="navBarValue" color="light-green-lighten-1" grow horizontal>
        <v-btn @click="$router.push('/box')">
            <v-icon class="fa-duotone fa-vial"></v-icon>
        </v-btn>
        <v-btn @click="$router.push('/grid')">
            <v-icon class="fa-duotone fa-grid-2"></v-icon>
        </v-btn>
        <v-btn @click="$router.push('/user')">
            <v-icon class="fa-duotone fa-user"></v-icon>
        </v-btn>
    </v-bottom-navigation>
</template>

<script lang="js">
export default {
    name: 'NavBar',
    components: {},
    props: {},
    emits: [],
    data() {
        return {
            navBarValue: this.$route.path // 初始值为当前路由路径
        };
    },
    watch: {
        '$route.path'(newPath) {
            this.navBarValue = newPath; // 路由变化时更新导航栏的值
        }
    },
    created() {},
    mounted() {},
    updated() {},
    unmounted() {},
    methods: {
        navigateTo(path) {
            this.$router.push(path);
        }
    }
};
</script>

<style scoped></style>
