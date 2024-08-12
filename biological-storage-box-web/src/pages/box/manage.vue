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
                        <v-btn variant="flat" color="light-green-lighten-4" @click="routeToEditBox(item.id)">编辑信息</v-btn>
                        <v-btn variant="flat" color="light-green-lighten-4" @click="showDeleteDialog(item.id)">删除</v-btn>
                    </v-card-actions>
                </v-card>
            </div>
            <v-fab icon="mdi-plus" class="mb-6" location="bottom end" size="60" absolute app appear @click="routeToCreateBox()"></v-fab>
        </div>
        <!-- 删除对话框 -->
        <v-dialog v-model="deleteDialog" max-width="500px">
            <v-card title="确认删除">
                <v-card-actions class="ml-2">
                    <v-btn class="basis-1/2" variant="flat" color="light-green-lighten-1" @click="deleteBox()">确认</v-btn>
                    <v-btn class="basis-1/2" variant="flat" color="light-green-lighten-4" @click="returnBox()">取消</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
export default {
    name: 'ManageBoxPage',
    components: {},
    data() {
        return {
            boxList: [],
            deleteDialog: false,
            deleteBoxId: ''
        };
    },
    watch: {
        '$store.user.currentOrg': 'getBox'
    },
    created() {},
    mounted() {
        this.getBox();
    },
    updated() {},
    methods: {
        // 获取试剂盒列表
        async getBox() {
            const orgID = this.$store.user.currentOrg;
            const result = await this.$api.box.list({ orgID: orgID, pageNum: 1, pageSize: 10 });
            this.boxList = result;
        },
        // 跳转到管理试剂页面
        async routeToManageReagent(boxId) {
            this.$router.push({ path: '/reagent', query: { boxId } });
        },
        // 跳转到编辑试剂盒页面
        async routeToEditBox(boxId) {
            this.$router.push({ path: '/box/update', query: { boxId } });
        },
        // 获取某个试剂盒的详细信息
        async getBoxInfo(boxId) {
            const orgID = this.$store.user.currentOrg;
            const result = await this.$api.box.one({ boxID: boxId, orgID: orgID });
            return result;
        },
        // 显示删除对话框
        async showDeleteDialog(boxId) {
            this.deleteBoxId = boxId;
            this.deleteDialog = true;
        },
        // 返回试剂盒列表
        async returnBox() {
            this.deleteDialog = false;
        },
        // 删除试剂盒
        async deleteBox() {
            const orgID = this.$store.user.currentOrg;
            const orgList = await this.getBoxInfo(this.deleteBoxId);
            const result = await this.$api.box.del(
                {
                    createBy: orgList.createBy,
                    id: orgList.id,
                    introduce: orgList.introduce,
                    name: orgList.name,
                    x: orgList.x,
                    y: orgList.y
                },
                {
                    orgID: orgID
                }
            );
            if (result === 1) {
                this.$router.push({ path: '/box' });
                this.$api.notify.success('删除成功');
                this.deleteDialog = false;
                await this.getBox();
            } else {
                this.$api.notify.error('删除失败，请重试');
            }
        },
        // 跳转到创建试剂盒页面
        async routeToCreateBox() {
            this.$router.push({ path: '/box/create' });
        }
    }
};
</script>

<style scoped></style>
