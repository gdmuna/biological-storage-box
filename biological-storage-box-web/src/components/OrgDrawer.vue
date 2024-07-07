<template>
    <v-navigation-drawer v-model="drawer" temporary>
        <v-list>
            <v-list-item title="我的课题组"></v-list-item>
        </v-list>
        <v-divider class="border-opacity-75"></v-divider>
        <v-list v-if="!loading">
            <template v-if="filteredItems.length > 0">
                <v-list-item v-for="item in filteredItems" :key="item.id" class="pl-0">
                    <v-card class="p-0 rounded-e-pill" variant="flat" color="light-green-lighten-3" block @click="readOrgID(item.id)">
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
        <v-divider class="border-opacity-75"></v-divider>
        <v-list>
            <v-list-group>
                <template #activator="{ props }">
                    <v-list-item v-bind="props" subtitle="创建或加入课题组/组织"></v-list-item>
                </template>
                <v-list>
                    <v-list-item append-icon="mdi-chevron-right" subtitle="创建课题组/组织" link @click="createOrg()"></v-list-item>
                    <v-list-item append-icon="mdi-chevron-right" subtitle="加入课题组/组织" link></v-list-item>
                </v-list>
            </v-list-group>
            <v-list-item append-icon="mdi-chevron-right" lines="two" subtitle="退出或编辑已有课题组/组织" link></v-list-item>
        </v-list>
        <v-divider class="border-opacity-75"></v-divider>
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
    computed: {
        filteredItems() {
            return this.items.filter((item) => item && item.id); // 过滤掉无效的项目
        }
    },
    created() {
        this.fetchOrgList();
    },
    methods: {
        async fetchOrgList() {
            try {
                const result = await this.$api.org.list();
                console.log('Fetched result:', result); // 打印获取到的数据
                if (Array.isArray(result)) {
                    this.items = result;
                } else {
                    console.error('Expected array but got:', result);
                }
                console.log('Items:', this.items); // 打印赋值后的 items
            } catch (error) {
                console.error('Error fetching organization list:', error);
            } finally {
                this.loading = false; // 数据加载完成后设置为 false
            }
        },
        async readOrgID(orgID) {
            this.$store.user.currentOrg = orgID;
            console.log(this.$store.user.currentOrg); // 调试当前组织的orgID信息是否存入全局变量
            await this.$nextTick();
            this.$router.push('/box');
            this.$emit('drawerStop', false);
        },
        // 跳转到创建课题组页面
        async createOrg() {
            this.$router.push({ path: '/org/create' });
        }
    }
};
</script>

<style scoped></style>
