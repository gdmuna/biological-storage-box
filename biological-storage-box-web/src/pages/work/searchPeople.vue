<template>
    <div class="main-container py-10">
        <div class="w-full max-w-screen-sm mx-auto px-10">
            <!-- 搜索框 -->
            <v-text-field v-model="searchUserName" class="mb-6" :loading="loading" append-inner-icon="mdi-magnify" label="搜索人员（输入正确的uid或者用户昵称）" variant="solo" hide-details single-line @input="handleInput" @click:append-inner="search"></v-text-field>
            <!-- 人员列表 -->
            <template v-if="userList.length === 0">
                <v-card class="w-full mx-auto p-6">
                    <v-list-item>
                        <v-list-item-title>查无此人员</v-list-item-title>
                    </v-list-item>
                </v-card>
            </template>
            <template v-else>
                <div v-for="(item, index) in userList" :key="index" class="mb-4">
                    <v-card class="border border-gray-300 rounded-lg">
                        <v-list-item>
                            <div class="flex justify-between items-center w-full">
                                <div class="flex items-center flex-1">
                                    <v-icon class="mr-4">mdi-account</v-icon>
                                    <div class="text-left">
                                        <v-list-item-title class="text-lg font-semibold">{{ item.nickName }}</v-list-item-title>
                                        <v-list-item-subtitle class="text-base mb-2">{{ item.uid }}</v-list-item-subtitle>
                                    </div>
                                </div>
                                <div class="flex items-center justify-center" style="width: 80px">
                                    <v-chip v-if="!item.joined" class="w-full text-center flex items-center justify-center" @click="inviteUser(item.uid)">邀请</v-chip>
                                    <v-chip v-else class="w-full text-center flex items-center justify-center" disabled>已邀请</v-chip>
                                </div>
                            </div>
                        </v-list-item>
                    </v-card>
                </div>
            </template>
        </div>
    </div>
</template>

<script>
export default {
    name: 'InviteUserPage',
    data() {
        return {
            loading: false,
            searchUserName: '',
            userList: [],
            memberList: [],
            debounceTimer: null // 用于存储防抖计时器
        };
    },
    created() {},
    mounted() {
        this.getOrgMemberList();
    },
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
        // 获取组织成员列表
        async getOrgMemberList() {
            const result = await this.$api.orgUser.memberList({ orgID: this.$store.user.currentOrg, pageNum: 1, pageSize: 10 });
            // 获取组织成员的uid列表
            if (result && Array.isArray(result)) {
                this.memberList = result.map((member) => member.uid);
            } else {
                this.memberList = [];
            }
        },
        // 搜索用户
        async search() {
            this.loading = true;
            const result = await this.$api.user.search({ s: this.searchUserName, pageNum: 1, pageSize: 10 });
            // 判断用户是否已在组织中
            if (result && Array.isArray(result)) {
                this.userList = result.map((user) => ({
                    ...user,
                    joined: this.memberList.includes(user.uid)
                }));
            } else {
                this.userList = [];
            }
            this.loading = false;
        },
        // 邀请用户
        async inviteUser(uid) {
            const result = await this.$api.orgUser.invite(
                {},
                {
                    orgID: this.$store.user.currentOrg,
                    uid: uid
                }
            );
            if (result === '成功发送邀请信息') {
                this.updateUserJoinedStatus(uid);
                this.$api.notify.success('邀请成功');
            } else {
                this.$api.notify.error('邀请失败');
            }
        },
        // 更新用户的邀请状态
        updateUserJoinedStatus(uid) {
            this.userList = this.userList.map((user) => (user.uid === uid ? { ...user, joined: true } : user));
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
