<template>
    <v-navigation-drawer v-model="drawer" temporary>
        <v-list>
            <v-list-item title="我的课题组"></v-list-item>
        </v-list>
        <v-divider class="border-opacity-75"></v-divider>
        <v-list v-if="!loading">
            <template v-if="filteredItems.length > 0">
                <v-list-item v-for="(item, index) in filteredItems" :key="item.id" :class="index === 0 ? '' : 'mt-5'">
                    <v-btn class="flex justify-start items-center p-0 border border-gray-400 shadow-none w-full" style="background-color: #f5f5f5; transition: background-color 0.3s ease" @mouseover="(e) => (e.currentTarget.style.backgroundColor = '#e0e0e0')" @mouseleave="(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')" @click="readOrgID(item.id)">
                        <div class="w-full text-left p-4">
                            <div class="font-bold">{{ item.name }}</div>
                            <div class="text-gray-600">{{ item.introduce }}</div>
                        </div>
                    </v-btn>
                </v-list-item>
            </template>
            <template v-else>
                <v-list-item>
                    <v-btn class="text-left p-0 border border-gray-400 shadow-none" width="100%">
                        <div class="w-full p-4">
                            <div class="font-bold mb-4">暂无课题组</div>
                            <div class="text-gray-600">请创建或加入课题组</div>
                        </div>
                    </v-btn>
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
                    <v-list-item append-icon="mdi-chevron-right" subtitle="创建课题组/组织" link></v-list-item>
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
        }
    }
};
</script>

<style scoped></style>
