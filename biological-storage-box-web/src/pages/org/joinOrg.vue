<template>
    <div class="main-container py-10">
        <div class="w-full max-w-screen-sm mx-auto px-10">
            <!-- 搜索框 -->
            <v-text-field v-model="searchOrgName" class="mb-6" :loading="loading" append-inner-icon="mdi-magnify" label="搜索" variant="solo" hide-details single-line @input="handleInput" @click:append-inner="search"></v-text-field>
            <!-- 分别显示每个组织 -->
            <div v-if="orgList.length === 0">
                <v-card class="w-full mx-auto p-6">
                    <v-list-item>
                        <v-list-item-title>查无此课题组</v-list-item-title>
                    </v-list-item>
                </v-card>
            </div>
            <div v-for="(item, index) in orgList" :key="index" class="mb-4">
                <v-card class="border border-gray-300 rounded-lg">
                    <v-list-item>
                        <div class="flex items-center justify-between w-full">
                            <!-- 图标和组织信息 -->
                            <div class="flex items-center flex-1">
                                <v-icon class="mr-4">mdi-account-group</v-icon>
                                <div class="text-left">
                                    <v-list-item-title class="text-lg font-semibold">{{ item.name }}</v-list-item-title>
                                    <v-list-item-subtitle class="text-base">{{ item.introduce }}</v-list-item-subtitle>
                                </div>
                            </div>
                            <div class="flex items-center justify-center" style="width: 50px">
                                <v-chip v-if="!item.joined" class="w-full text-center flex items-center justify-center" @click="goToApplyPage(item.id)">加入</v-chip>
                                <v-chip v-else color="success" class="w-full text-center flex items-center justify-center">已加入</v-chip>
                            </div>
                        </div>
                    </v-list-item>
                </v-card>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'JoinOrgPage',
    data() {
        return {
            loading: false,
            searchOrgName: '',
            orgList: [],
            userOrgIds: [],
            debounceTimer: null // 用于存储防抖计时器
        };
    },
    created() {
        this.fetchUserOrgs();
    },
    mounted() {},
    updated() {},
    methods: {
        // 处理输入事件，应用防抖功能
        handleInput() {
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            this.debounceTimer = setTimeout(() => {
                this.search();
            }, 300);
        },
        // 搜索课题组并与userOrgIds比对，更新组织列表的joined状态
        async search() {
            this.loading = true;
            const result = await this.$api.org.search({ name: this.searchOrgName, pageNum: 1, pageSize: 10 });
            this.orgList = result.map((org) => ({
                ...org,
                joined: this.userOrgIds.includes(org.id)
            }));
            this.loading = false;
        },
        async goToApplyPage(orgId) {
            this.$router.push({ path: '/org/applyReason', query: { orgId } });
        },
        // 获取用户已加入的课题组将其加入到userOrgIds
        async fetchUserOrgs() {
            const result = await this.$api.org.list();
            // 过滤掉无效的对象
            this.userOrgIds = result.filter((org) => org && org.id != null).map((org) => org.id);
        }
    }
};
</script>

<style scoped>
/* 覆盖 Vuetify 组件样式 */
.v-list-item-title {
    font-size: 1.25rem;
}
.v-list-item-subtitle {
    font-size: 1rem;
}
</style>
