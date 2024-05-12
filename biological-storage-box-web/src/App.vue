<template>
    <v-app>
        <!-- 组织切换菜单栏 -->
        <OrgDrawer v-model="drawer"></OrgDrawer>
        <!-- 应用栏 -->
        <v-app-bar color="light-green-lighten-1" :elevation="2">
            <template #prepend>
                <v-app-bar-nav-icon @click="drawer = true">
                    <v-icon icon="fa-solid fa-bars" />
                </v-app-bar-nav-icon>
            </template>
            <v-app-bar-title>{{ $route.meta.title || 'Biological Storage Box' }}</v-app-bar-title>
        </v-app-bar>
        <!-- 主要内容区域 -->
        <v-main style="height: calc(100vh - 64px - 56px)">
            <router-view></router-view>
        </v-main>
        <!-- 底部导航栏 -->
        <NavBar v-if="$route.meta.showNavBar"></NavBar>
    </v-app>
</template>

<script lang="js">
import OrgDrawer from '@/components/OrgDrawer.vue';
import NavBar from '@/components/NavBar.vue';

export default {
    name: 'App',
    components: {
        OrgDrawer,
        NavBar
    },
    data() {
        return {
            drawer: false
        };
    },
    created() {
        document.addEventListener('backbutton', this.goBack);
    },
    mounted() {},
    updated() {},
    unmounted() {
        document.removeEventListener('backbutton', this.goBack);
    },
    methods: {
        // 用户在移动端设备点击后退按钮时，返回上一条路由
        goBack() {
            this.$router.go(-1);
        }
    }
};
</script>

<style scoped></style>
