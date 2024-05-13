<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <div v-for="(item, index) in boxList" :key="item.id" :class="index === 0 ? '' : 'mt-5'">
                <v-card>
                    <v-card-item>
                        <v-card-title>{{ item.name }}</v-card-title>
                        <v-card-subtitle>
                            创建者：
                            <v-chip size="small" color="indigo">
                                <v-icon icon="mdi-account-circle" start></v-icon>
                                {{ item.createBy }}
                            </v-chip>
                        </v-card-subtitle>
                    </v-card-item>
                    <v-card-text class="py-1">
                        创建时间：
                        <v-chip size="small" color="deep-purple-lighten-1">{{ item.createTime }}</v-chip>
                    </v-card-text>
                    <v-card-text class="py-1">
                        更新时间：
                        <v-chip size="small" color="purple-lighten-1">{{ item.updateTime }}</v-chip>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn variant="flat" color="light-green-lighten-4" @click="routeToManageReagent(item.id)">管理试剂</v-btn>
                        <v-btn variant="flat" color="light-green-lighten-4">编辑信息</v-btn>
                        <v-btn variant="flat" color="light-green-lighten-4">删除</v-btn>
                    </v-card-actions>
                </v-card>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ManageBoxPage',
    components: {},
    data() {
        return {
            boxList: []
        };
    },
    created() {},
    mounted() {
        this.getBox();
    },
    updated() {},
    methods: {
        // 获取试剂盒列表
        async getBox() {
            const result = await this.$api.box.org({ pageNum: 1, pageSize: 10 });
            this.boxList = result;
        },
        // 跳转到管理试剂页面
        async routeToManageReagent(boxId) {
            this.$router.push({ path: '/reagent', query: { boxId } });
        }
    }
};
</script>

<style scoped></style>
