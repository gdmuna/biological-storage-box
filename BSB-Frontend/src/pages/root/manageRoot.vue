<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <div v-for="(item, index) in roomList" :key="item.id" :class="index === 0 ? '' : 'mt-5'">
                <v-card>
                    <v-card-item>
                        <v-card-title>{{ item.roomName }}</v-card-title>
                        <v-card-subtitle>
                            创建者：
                            <v-chip size="small" color="indigo">
                                <v-icon icon="mdi-account-circle" start></v-icon>
                                {{ item.createBy }}
                            </v-chip>
                        </v-card-subtitle>
                    </v-card-item>
                    <v-card-text class="py-1">
                        房间简介：
                        <v-chip size="small" color="deep-purple-lighten-1">{{ item.roomDescribe }}</v-chip>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn variant="flat" color="light-green-lighten-4" @click="routeToManageContainer(item.id)">管理容器</v-btn>
                        <v-btn variant="flat" color="light-green-lighten-4" @click="routeToEditRoot(item.id)">编辑信息</v-btn>
                        <v-btn variant="flat" color="light-green-lighten-4" @click="showDeleteDialog(item.id)">删除</v-btn>
                    </v-card-actions>
                </v-card>
            </div>
            <v-fab icon="mdi-plus" class="mb-6" location="bottom end" size="60" absolute app appear @click="routeToCreateRoot()"></v-fab>
        </div>
        <!-- 删除对话框 -->
        <v-dialog v-model="deleteDialog" max-width="500px">
            <v-card title="确认删除">
                <v-card-actions class="ml-2">
                    <v-btn class="basis-1/2" variant="flat" color="light-green-lighten-1" :loading="loading" @click="deleteRoot()">确认</v-btn>
                    <v-btn class="basis-1/2" variant="flat" color="light-green-lighten-4" @click="returnManageRoot()">取消</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
export default {
    name: 'ManageRoomPage',
    components: {},
    data() {
        return {
            roomList: [],
            deleteDialog: false,
            deleteRootID: '',
            loading: false
        };
    },
    watch: {
        '$store.user.currentOrg': 'getRootList'
    },
    created() {},
    mounted() {
        this.getRootList();
    },
    updated() {},
    methods: {
        // 跳转到创建房间页面
        async routeToCreateRoot() {
            this.$router.push({ path: '/root/createRoot' });
        },
        // 获取房间列表
        async getRootList() {
            const orgID = this.$store.user.currentOrg;
            const result = await this.$api.root.list({
                orgID: orgID,
                pageNum: 1,
                pageSize: 10,
                parentID: 0
            });
            this.roomList = result;
        },
        // 跳转到管理容器页面
        async routeToManageContainer(rootID) {
            const store = this.$store.user;
            store.currentRoot = rootID;
            this.$router.push({ path: '/storageLocation/manageContainer' });
        },
        // 跳转到编辑房间信息页面
        async routeToEditRoot(rootID) {
            this.$router.push({ path: '/root/updateRoot', query: { rootID } });
        },
        // 显示删除对话框
        async showDeleteDialog(rootID) {
            this.deleteRootID = rootID;
            this.deleteDialog = true;
        },
        // 返回房间管理页面
        async returnManageRoot() {
            this.deleteDialog = false;
        },
        // 获取某个房间的详细信息
        async getRootInfo(rootID) {
            const orgID = this.$store.user.currentOrg;
            const result = await this.$api.root.one({ rootID: rootID, orgID: orgID });
            return result;
        },
        // 删除房间
        async deleteRoot() {
            this.loading = true;
            const orgID = this.$store.user.currentOrg;
            console.log('deleteRootID', this.deleteRootID);
            const roomList = await this.getRootInfo(this.deleteRootID);
            const result = await this.$api.root.del(
                {
                    createBy: roomList.createBy,
                    id: roomList.id,
                    introduce: roomList.introduce,
                    name: roomList.name
                },
                {
                    orgID: orgID
                }
            );
            if (result === 1) {
                this.$router.push({ path: '/root/manageRoot' });
                this.$api.notify.success('删除成功');
                this.deleteDialog = false;
                this.loading = false;
                await this.getRootList();
            } else {
                this.deleteDialog = false;
                this.loading = false;
                this.$api.notify.error('删除失败，请重试');
            }
        }
    }
};
</script>

<style scoped></style>
