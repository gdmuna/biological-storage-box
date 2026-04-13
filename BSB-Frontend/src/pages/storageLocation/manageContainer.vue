<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <!-- 房间下容器列表 -->
            <div v-for="(item, index) in containerList" :key="item.id" :class="index === 0 ? '' : 'mt-5'">
                <v-card>
                    <v-card-item>
                        <v-card-title>{{ item.roomName }}</v-card-title>
                        <v-card-subtitle>
                            所属组织ID：
                            <v-chip size="small" color="indigo">
                                <v-icon icon="mdi-account-circle" start></v-icon>
                                {{ item.createBy }}
                            </v-chip>
                        </v-card-subtitle>
                    </v-card-item>
                    <v-card-text class="py-1">
                        描述：
                        <v-chip size="small" color="deep-purple-lighten-1">{{ item.roomDescribe }}</v-chip>
                    </v-card-text>
                    <v-card-text class="py-1">
                        创建时间：
                        <v-chip size="small" color="deep-purple-lighten-1">
                            <TimeFormatter :time="item.createTime" />
                        </v-chip>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn variant="flat" color="light-green-lighten-4" @click="routeToManageContainer(item.id)">管理试剂盒</v-btn>
                        <v-btn variant="flat" color="light-green-lighten-4" @click="routeToEditContainer(item.id)">编辑信息</v-btn>
                        <v-btn variant="flat" color="light-green-lighten-4" @click="showDeleteDialog(item.id)">删除</v-btn>
                    </v-card-actions>
                </v-card>
            </div>
            <!-- 房间下试剂盒列表 -->
            <div class="mt-5">
                <div v-for="(item, index) in boxList" :key="item.id" :class="index === 0 ? '' : 'mt-5'">
                    <v-card>
                        <v-card-item>
                            <v-card-title>{{ item.name }}</v-card-title>
                            <v-card-subtitle>
                                所属组织ID：
                                <v-chip size="small" color="indigo">
                                    <v-icon icon="mdi-account-circle" start></v-icon>
                                    {{ item.createBy }}
                                </v-chip>
                            </v-card-subtitle>
                        </v-card-item>
                        <v-card-text class="py-1">
                            简称：
                            <v-chip size="small" color="deep-purple-lighten-1">{{ item.shortName }}</v-chip>
                        </v-card-text>
                        <v-card-text class="py-1">
                            创建时间：
                            <v-chip size="small" color="deep-purple-lighten-1">
                                <TimeFormatter :time="item.createTime" />
                            </v-chip>
                        </v-card-text>
                        <v-card-actions>
                            <v-btn variant="flat" color="light-green-lighten-4" @click="routeToManageReagent(item.id)">管理试剂</v-btn>
                            <v-btn variant="flat" color="light-green-lighten-4" @click="routeToEditBox(item.id)">编辑信息</v-btn>
                            <v-btn variant="flat" color="light-green-lighten-4" @click="showDeleteDialog2(item.id)">删除</v-btn>
                        </v-card-actions>
                    </v-card>
                </div>
            </div>
            <!-- 创建容器和试剂盒按钮 -->
            <v-menu location="bottom end" min-width="50" offset-y nudge-bottom="-6">
                <template #activator="{ props }">
                    <v-fab v-bind="props" icon="mdi-plus" class="mb-6" location="bottom end" size="60" absolute app appear></v-fab>
                </template>
                <v-list>
                    <v-list-item @click="routeToCreateContainer()">
                        <v-list-item-title>创建容器</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="routeToCreateBox()">
                        <v-list-item-title>创建试剂盒</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu>
        </div>
        <!-- 删除容器对话框 -->
        <v-dialog v-model="deleteDialog" max-width="500px">
            <v-card title="确认删除">
                <v-card-actions class="ml-2">
                    <v-btn class="basis-1/2" variant="flat" color="light-green-lighten-1" :loading="loading" @click="deleteContainer()">确认</v-btn>
                    <v-btn class="basis-1/2" variant="flat" color="light-green-lighten-4" @click="returnContainer()">取消</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <!-- 删除对话框 -->
        <v-dialog v-model="deleteDialog2" max-width="500px">
            <v-card title="确认删除">
                <v-card-actions class="ml-2">
                    <v-btn class="basis-1/2" variant="flat" color="light-green-lighten-1" :loading="loading" @click="deleteBox()">确认</v-btn>
                    <v-btn class="basis-1/2" variant="flat" color="light-green-lighten-4" @click="returnBox()">取消</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
// 引入TimeFormatter组件对时间进行格式化
import TimeFormatter from '@/components/TimeFormatter.vue';

export default {
    name: 'ManageContainerPage',
    components: {
        TimeFormatter
    },
    data() {
        return {
            containerList: [],
            boxList: [],
            deleteDialog: false,
            deleteDialog2: false,
            deleteContainerId: '',
            deleteBoxId: '', // 添加专用的box删除ID字段
            loading: false
        };
    },
    // 当用户全局的当前房间ID发生变化就调用getContainer和getBox方法
    watch: {
        '$store.user.currentRoot': {
            handler(newVal) {
                this.getContainer();
                this.getBox();
            }
        }
    },
    created() {},
    mounted() {
        this.getContainer();
        this.getBox();
    },
    updated() {},
    methods: {
        // 获取容器列表
        async getContainer() {
            const result = await this.$api.root.list({
                orgID: this.$store.user.currentOrg,
                pageNum: 1,
                pageSize: 10,
                parentID: this.$store.user.currentRoot
            });
            this.containerList = result;
        },
        // 获取试剂盒列表
        async getBox() {
            const orgID = this.$store.user.currentOrg;
            const rootID = this.$store.user.currentRoot;
            console.log(orgID, rootID);
            const result = await this.$api.box.rootList({
                orgID: orgID,
                pageNum: 1,
                pageSize: 10,
                rootID: rootID
            });
            this.boxList = result;
        },
        // 跳转到试剂盒页面
        routeToManageContainer(containerId) {
            this.$router.push({ path: '/box', query: { containerId } });
            this.$store.user.currentRoot = containerId;
        },
        // 跳转到编辑容器页面
        routeToEditContainer(containerId) {
            this.$router.push({ path: '/storageLocation/updateContainer', query: { containerId } });
        },
        // 显示删除容器对话框
        showDeleteDialog(containerId) {
            this.deleteContainerId = containerId;
            this.deleteDialog = true;
        },
        // 显示删除盒子对话框
        showDeleteDialog2(boxId) {
            this.deleteBoxId = boxId; // 使用专用字段存储box ID
            this.deleteDialog2 = true;
        },
        // 取消删除
        returnContainer() {
            this.deleteDialog = false;
        },
        // 获取某个容器的详细信息
        async getContainerInfo(deleteContainerId) {
            const orgID = this.$store.user.currentOrg;
            const result = await this.$api.root.one({ orgID: orgID, rootID: deleteContainerId });
            return result;
        },
        // 删除容器
        async deleteContainer() {
            this.loading = true;
            const orgID = this.$store.user.currentOrg;
            const delContainerList = await this.getContainerInfo(this.deleteContainerId);
            const result = await this.$api.root.del(
                {
                    createBy: delContainerList.createBy,
                    id: delContainerList.id,
                    introduce: delContainerList.roomDescribee,
                    name: delContainerList.roomName
                },
                {
                    orgID: orgID
                }
            );
            if (result === 1) {
                this.$router.push({ path: '/storageLocation/manageContainer' });
                this.$api.notify.success('删除成功');
                this.deleteDialog = false;
                this.loading = false;
                await this.getContainer();
            } else {
                this.deleteDialog = false;
                this.loading = false;
                this.$api.notify.error('删除失败，请重试');
            }
        },
        // 跳转到创建容器页面
        routeToCreateContainer() {
            this.$router.push({ path: '/storageLocation/createContainer' });
        },
        // 跳转到创建试剂盒页面
        routeToCreateBox() {
            this.$router.push({ path: '/box/create' });
        },
        // 跳转到管理试剂页面
        routeToManageReagent(boxId) {
            this.$router.push({ path: '/reagent', query: { boxId } });
        },
        // 跳转到编辑试剂盒页面
        routeToEditBox(boxId) {
            this.$router.push({ path: '/box/update', query: { boxId } });
        },
        // 获取某个试剂盒的详细信息
        async getBoxInfo(boxId) {
            const orgID = this.$store.user.currentOrg;
            const result = await this.$api.box.one({ boxID: boxId, orgID: orgID });
            return result;
        },
        // 删除试剂盒
        async deleteBox() {
            this.loading = true;
            const orgID = this.$store.user.currentOrg;
            const boxInfo = await this.getBoxInfo(this.deleteBoxId);
            const result = await this.$api.box.del(
                {
                    createBy: boxInfo.createBy,
                    id: boxInfo.id,
                    introduce: boxInfo.introduce,
                    name: boxInfo.name,
                    x: boxInfo.x,
                    y: boxInfo.y
                },
                {
                    orgID: orgID
                }
            );
            if (result === 1) {
                this.$router.push({ path: '/storageLocation/manageContainer' });
                this.$api.notify.success('删除成功');
                this.deleteDialog2 = false;
                this.loading = false;
                await this.getBox();
            } else {
                this.deleteDialog2 = false;
                this.loading = false;
                this.$api.notify.error('删除失败，请重试');
            }
        }
    }
};
</script>

<style scoped></style>
