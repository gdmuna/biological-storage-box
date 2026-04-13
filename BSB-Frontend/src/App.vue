<template>
    <v-app>
        <!-- 组织切换菜单栏 -->
        <OrgDrawer ref="drawer" v-model="drawer" @drawer-stop="drawer = false"></OrgDrawer>
        <!-- 应用栏 -->
        <v-app-bar color="light-green-lighten-1" :elevation="2">
            <template #prepend>
                <v-btn v-if="$route.meta.showNavBar" icon="" @click="drawerStop()">
                    <v-icon class="fa-solid fa-bars"></v-icon>
                </v-btn>
                <v-btn v-if="!$route.meta.showNavBar" icon="" @click="goBack()">
                    <v-icon class="fa-solid fa-chevron-left"></v-icon>
                </v-btn>
            </template>
            <v-app-bar-title>{{ $route.meta.title || 'Biological Storage Box' }}</v-app-bar-title>
            <template #append>
                <v-btn v-if="$route.meta.showNavBar" icon="mdi-magnify" @click="goSearch()"></v-btn>
            </template>
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
        // 抽屉组件的显示状态改变时触发
        drawerStop() {
            // 调用抽屉组件的函数
            this.$refs.drawer.fetchOrgList();
            // 设置抽屉组件的显示状态
            this.drawer = true;
        },
        // 用户在移动端设备点击后退按钮时，返回上一条路由
        goBack() {
            this.$router.go(-1);
        },
        // 用户在移动端设备点击搜索按钮时，跳转到搜索页面
        goSearch() {
            this.$router.push('/search/search');
        }
    }
};
</script>

<style scoped></style>
