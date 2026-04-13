<template>
    <v-navigation-drawer v-model="drawer" temporary>
        <div class="flex flex-col h-full">
            <!-- 顶部标题区域 -->
            <div>
                <v-list>
                    <v-list-item title="我的课题组"></v-list-item>
                </v-list>
                <v-divider class="border-opacity-75"></v-divider>
                <div class="org-list-container overflow-y-auto flex-1">
                    <v-list v-model:opened="open" v-if="!loading">
                        <!-- 有课题组时显示列表 -->
                        <template v-if="items.length > 0">
                            <v-list-group v-for="org in items" :key="org.id" value="org">
                                <template v-slot:activator="{ props }">
                                    <v-list-item v-bind="props" :class="{ highlighted: $store.user.currentOrg === org.id }" @click="readOrgID(org.id)">
                                        <template v-slot:prepend>
                                            <v-icon class="fa-duotone fa-user-group"></v-icon>
                                        </template>
                                        <v-list-item-title>{{ org.name }}</v-list-item-title>
                                        <v-list-item-subtitle>{{ org.introduce }}</v-list-item-subtitle>
                                    </v-list-item>
                                </template>

                                <!-- 房间列表 -->
                                <template v-if="$store.user.currentOrg === org.id">
                                    <v-list-group v-for="room in roomList" :key="room.id" :value="room.id">
                                        <template v-slot:activator="{ props }">
                                            <v-list-item v-bind="props" @click="readRoomID(room.id)" class="room-item">
                                                <template v-slot:prepend>
                                                    <v-icon>mdi-door</v-icon>
                                                </template>
                                                <v-list-item-title class="text-truncate">{{ room.roomName }}</v-list-item-title>
                                            </v-list-item>
                                        </template>

                                        <!-- 容器列表 -->
                                        <v-list-group v-for="container in containerMap.get(room.id) || []" :key="container.id" :value="container.id">
                                            <template v-slot:activator="{ props }">
                                                <v-list-item v-bind="props" @click="readContainerID(container.id)">
                                                    <template v-slot:prepend>
                                                        <v-icon>mdi-door</v-icon>
                                                    </template>
                                                    <v-list-item-title>{{ container.roomName }}</v-list-item-title>
                                                </v-list-item>
                                            </template>

                                            <!-- 容器下的试剂盒列表 -->
                                            <v-list-item v-for="box in boxMap.get(container.id) || []" :key="box.id" @click="goToBox(box.id)">
                                                <template v-slot:prepend>
                                                    <v-icon>mdi-cube-outline</v-icon>
                                                </template>
                                                <v-list-item-title>{{ box.name }}</v-list-item-title>
                                            </v-list-item>
                                        </v-list-group>

                                        <!-- 房间下的试剂盒列表 -->
                                        <v-list-item v-for="box in roomBoxMap.get(room.id) || []" :key="box.id" @click="goToBox(box.id)">
                                            <template v-slot:prepend>
                                                <v-icon>mdi-cube-outline</v-icon>
                                            </template>
                                            <v-list-item-title>{{ box.name }}</v-list-item-title>
                                        </v-list-item>
                                    </v-list-group>
                                </template>
                            </v-list-group>
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
                            <v-list-item v-bind="props" subtitle="创建或加入课题组/组织">
                                <template v-slot:prepend>
                                    <v-icon>mdi-plus-circle-outline</v-icon>
                                </template>
                            </v-list-item>
                        </template>
                        <div class="child">
                            <v-list>
                                <v-list-item append-icon="mdi-chevron-right" subtitle="创建课题组/组织" link @click="createOrg()">
                                    <template v-slot:prepend>
                                        <v-icon>mdi-plus</v-icon>
                                    </template>
                                </v-list-item>
                                <v-list-item append-icon="mdi-chevron-right" subtitle="加入课题组/组织" link @click="joinOrg()">
                                    <template v-slot:prepend>
                                        <v-icon>mdi-account-plus</v-icon>
                                    </template>
                                </v-list-item>
                            </v-list>
                        </div>
                    </v-list-group>
                    <v-list-item append-icon="mdi-chevron-right" lines="two" subtitle="退出或编辑已有课题组/组织" link @click="exitOrg()">
                        <template v-slot:prepend>
                            <v-icon>mdi-account-edit</v-icon>
                        </template>
                    </v-list-item>
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

<script>
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
            roomList: [],
            // 使用Map存储每个房间的容器列表
            containerMap: new Map(),
            // 使用Map存储每个容器的盒子列表
            boxMap: new Map(),
            // 使用Map存储每个房间的盒子列表
            roomBoxMap: new Map(),
            drawer: this.value,
            loading: true,
            // 添加当前选中的房间
            currentRoom: null,
            // 控制展开的项，默认展开组织
            open: ['org']
        };
    },
    watch: {
        'drawer'(val) {
            if (val) {
                this.fetchOrgList();
            }
        },
        'value'(val) {
            this.drawer = val;
        },
        // 监听组织ID变化，加载房间列表
        '$store.user.currentOrg': {
            handler(newVal) {
                if (newVal) {
                    this.getRootList();
                }
            },
            immediate: true
        },
        // 添加路由监听，当路由变化时刷新列表
        '$route': {
            handler() {
                if (this.$store.user.currentOrg) {
                    this.getRootList();
                }
            },
            immediate: true
        }
    },
    mounted() {
        this.fetchOrgList();
    },
    methods: {
        // 获取组织列表
        async fetchOrgList() {
            this.loading = true;
            try {
                const result = await this.$api.org.list();
                if (Array.isArray(result)) {
                    this.items = result;
                }
            } catch (error) {
                console.error(error);
            } finally {
                this.loading = false;
            }
        },
        // 获取房间列表
        async getRootList() {
            try {
                const result = await this.$api.root.list({
                    orgID: this.$store.user.currentOrg,
                    pageNum: 1,
                    pageSize: 10,
                    parentID: 0
                });
                this.roomList = result;
            } catch (error) {
                console.error(error);
            }
        },
        // 获取容器列表
        async getContainer(roomId) {
            try {
                const result = await this.$api.root.list({
                    orgID: this.$store.user.currentOrg,
                    pageNum: 1,
                    pageSize: 10,
                    parentID: roomId
                });
                this.containerMap.set(roomId, result);
            } catch (error) {
                console.error(error);
            }
        },
        // 获取房间内试剂盒列表
        async getRoomBox(roomId) {
            try {
                const result = await this.$api.box.rootList({
                    orgID: this.$store.user.currentOrg,
                    pageNum: 1,
                    pageSize: 10,
                    rootID: roomId
                });
                this.roomBoxMap.set(roomId, result);
            } catch (error) {
                console.error(error);
            }
        },
        // 获取容器内试剂盒列表
        async getBox(containerId) {
            try {
                const result = await this.$api.box.rootList({
                    orgID: this.$store.user.currentOrg,
                    pageNum: 1,
                    pageSize: 10,
                    rootID: containerId
                });
                this.boxMap.set(containerId, result);
            } catch (error) {
                console.error(error);
            }
        },
        // 选择组织
        async readOrgID(orgID) {
            this.$store.user.currentOrg = orgID;
            // 重置当前选中的房间
            this.currentRoom = null;
            // 重置展开状态，只保持组织展开
            this.open = ['org'];
            // 清空所有数据
            this.containerMap.clear();
            this.boxMap.clear();
            this.roomBoxMap.clear();
            this.roomList = []; // 清空房间列表

            await this.getRootList();
            // 跳转到房间管理页面
            this.$router.push({ path: '/root/manageRoot' });
        },
        // 选择房间
        async readRoomID(roomId) {
            this.currentRoom = roomId; // 设置当前选中的房间
            this.$store.user.currentRoot = roomId;
            await this.getContainer(roomId);
            await this.getRoomBox(roomId);
            // 更新展开的项
            this.open = ['org', roomId];
            this.$router.push({
                path: '/storageLocation/manageContainer',
                query: { rootId: roomId }
            });
        },

        // 选择容器
        async readContainerID(containerId) {
            this.$store.user.currentRoot = containerId;
            await this.getBox(containerId);
            // 更新展开的项，保持房间和容器都展开
            if (this.currentRoom) {
                this.open = ['org', this.currentRoom, containerId];
            }
            this.$router.push({ path: '/box', query: { containerId: containerId } });
        },
        // 跳转到试剂盒详情
        goToBox(boxId) {
            this.$router.push({ path: '/reagent', query: { boxId: boxId } });
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
    max-height: 400px;
}
/* 高亮显示选中的组织 */
.highlighted {
    background-color: #99b998 !important;
}
/* 重置列表项的内边距和缩进 */
:deep(.v-list-group__items) {
    padding: 0 !important;
    margin: 0 !important;
}
/* 覆盖Vuetify的默认缩进 */
:deep(.v-list-group__items .v-list-item) {
    padding-inline-start: 0 !important;
}
/* 调整prepend元素的宽度 */
:deep(.v-list-item__prepend) {
    width: 30px !important;
    min-width: 30px !important;
    height: 24px !important;
}

/* 为组织下的嵌套列表组添加缩进 */
:deep(.org-list-container .v-list-group .v-list-group) {
    margin-left: 16px !important;
}

/* 为房间下的试剂盒列表添加缩进 */
:deep(.org-list-container .v-list-group > .v-list-group__items > .v-list-item) {
    padding-left: 16px !important;
}
.child {
    margin-left: 16px !important;
}
</style>
