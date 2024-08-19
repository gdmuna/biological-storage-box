<template>
    <v-navigation-drawer v-model="drawer" temporary>
        <div class="flex flex-col h-full">
            <div>
                <v-list>
                    <v-list-item title="我的课题组"></v-list-item>
                </v-list>
                <v-divider class="border-opacity-75"></v-divider>
                <div class="org-list-container overflow-y-auto flex-1">
                    <v-list v-if="!loading">
                        <template v-if="items.length > 0">
                            <v-list-item v-for="item in items" :key="item.id" class="pl-0">
                                <v-card class="p-0 rounded-e-pill" :class="{ highlighted: $store.user.currentOrg === item.id }" variant="flat" color="light-green-lighten-3" block @click="readOrgID(item.id)">
                                    <div class="flex flex-row justify-start items-center">
                                        <v-icon class="fa-duotone fa-user-group rounded-lg bg-green-50 m-2 p-4" color="light-green-lighten-3" size="x-small"></v-icon>
                                        <div class="w-full text-left pl-1">
                                            <div>{{ item.name }}</div>
                                            <div class="text-gray-600 text-xs">{{ item.introduce }}</div>
                                        </div>
                                    </div>
                                </v-card>
                            </v-list-item>
                        </template>
                        <template v-else>
                            <v-list-item>
                                <v-card variant="flat" color="light-green-lighten-4" block>
                                    <div class="flex flex-col justify-center items-center p-2">
                                        <div>暂无课题组</div>
                                        <div class="text-gray-600 text-sm">请创建或加入课题组</div>
                                    </div>
                                </v-card>
                            </v-list-item>
                        </template>
                    </v-list>
                </div>
                <v-divider class="border-opacity-75"></v-divider>
                <v-list>
                    <v-list-group>
                        <template #activator="{ props }">
                            <v-list-item v-bind="props" subtitle="创建或加入课题组/组织"></v-list-item>
                        </template>
                        <v-list>
                            <v-list-item append-icon="mdi-chevron-right" subtitle="创建课题组/组织" link @click="createOrg()"></v-list-item>
                            <v-list-item append-icon="mdi-chevron-right" subtitle="加入课题组/组织" link @click="joinOrg()"></v-list-item>
                        </v-list>
                    </v-list-group>
                    <v-list-item append-icon="mdi-chevron-right" lines="two" subtitle="退出或编辑已有课题组/组织" link @click="exitOrg()"></v-list-item>
                </v-list>
                <v-divider class="border-opacity-75"></v-divider>
            </div>
            <v-spacer></v-spacer>
            <div class="flex-none">
                <v-list class="flex flex-row justify-between items-center mb-4">
                    <v-list-item @click="logout">
                        <v-icon class="fa-duotone fa-sign-out-alt" color="light-green-lighten-3" size="default"></v-icon>
                    </v-list-item>
                    <v-list-item @click="goToSettings">
                        <v-icon class="fa-duotone fa-cog" color="light-green-lighten-3" size="default"></v-icon>
                    </v-list-item>
                </v-list>
            </div>
        </div>
    </v-navigation-drawer>
</template>

<script lang="js">
export default {
    name: 'OrgDrawer',
    props: {
        value: {
            type: Boolean,
            default: false
        }
    },
    emits: ['drawerStop'],
    data() {
        return {
            items: [],
            drawer: false,
            loading: true // 增加加载状态
        };
    },
    computed: {},
    created() {},
    methods: {
        async fetchOrgList() {
            try {
                const result = await this.$api.org.list();
                if (Array.isArray(result)) {
                    this.items = result;
                } else {
                    console.error('Expected array but got:', result);
                }
            } catch (error) {
                console.error('Error fetching organization list:', error);
            } finally {
                this.loading = false;
            }
        },
        async readOrgID(orgID) {
            //将当前组织ID存储到本地存储中
            this.$store.user.currentOrg = orgID;
            localStorage.setItem('orgID', orgID);
            await this.$nextTick();
            this.$emit('drawerStop', false);
        },
        // 跳转到创建课题组页面
        async createOrg() {
            this.$router.push({ path: '/org/create' });
        },
        // 跳转到加入课题组页面
        async joinOrg() {
            this.$router.push({ path: '/org/joinOrg' });
        },
        // 跳转到退出或编辑课题组页面
        async exitOrg() {
            this.$router.push({ path: '/org/exit' });
        },
        // 跳转登录页面
        async logout() {
            this.$router.push('/auth/login');
        },
        // 跳转去设置页面
        async goToSettings() {
            this.$router.push('/user/setting');
        }
    }
};
</script>

<style scoped>
/* 设置最大高度以限制组织列表只能在盒子内滑动 */
.org-list-container {
    max-height: 290px;
}
/* 高亮显示选中的组织 */
.highlighted {
    background-color: #99b998 !important; /* 你可以根据需要更改高亮颜色 */
}
</style>
