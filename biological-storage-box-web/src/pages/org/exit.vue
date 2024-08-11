<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <template v-if="items.length > 0">
                <div v-for="item in items" :key="item.id" class="mt-5 pb-5">
                    <v-card>
                        <v-card-item>
                            <v-card-title>{{ item.name }}</v-card-title>
                        </v-card-item>
                        <v-card-actions class="mr-2">
                            <v-btn class="basis-1/2" variant="flat" color="light-green-lighten-4" @click="routeToEditOrg(item.id)">编辑信息</v-btn>
                            <v-btn class="basis-1/2" variant="flat" color="light-green-lighten-4" @click="deleteOrg(item.id)">删除</v-btn>
                        </v-card-actions>
                    </v-card>
                </div>
            </template>
            <template v-else>
                <div>
                    <v-card variant="flat" block>
                        <div class="flex flex-col justify-center items-center p-2">
                            <div>暂无课题组</div>
                            <div class="text-gray-600 text-sm">请创建或加入课题组</div>
                        </div>
                    </v-card>
                </div>
            </template>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ExitOrgPage',
    components: {},
    data() {
        return {
            items: []
        };
    },
    computed: {},
    async created() {
        await this.fetchOrgList();
    },
    mounted() {},
    updated() {},
    methods: {
        // 获取试剂盒列表
        async fetchOrgList() {
            const result = await this.$api.org.list();
            console.log('Fetched result:', result); // 打印获取到的数据
            if (Array.isArray(result)) {
                this.items = result;
            } else {
                console.error('Expected array but got:', result);
            }
        },
        // 跳转到编辑试剂盒页面
        async routeToEditOrg(orgId) {
            this.$router.push({ path: '/org/update', query: { orgId } });
        },
        // 删除组织
        async deleteOrg(orgId) {
            const result = await this.$api.org.del(null, { orgID: orgId });
            console.log('Delete org result:', result);
            if (result === '操作成功') {
                this.$api.notify.success('删除成功');
                await this.fetchOrgList();
            } else {
                this.$api.notify.error('删除失败，请重试');
            }
        }
    }
};
</script>

<style scoped></style>
