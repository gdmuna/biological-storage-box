<template>
    <div class="main-container py-10">
        <div class="w-full max-w-screen-sm mx-auto px-10">
            <!-- 申请加入课题组消息列表 -->
            <div class="mb-6">
                <div v-for="message in joinRequests" :key="message.id" class="mb-4">
                    <v-card class="border border-gray-300 rounded-lg" @click="goToReviewInformationJoinOrg(message.id)">
                        <v-list-item>
                            <div class="flex justify-between items-center w-full">
                                <div class="flex items-center flex-1">
                                    <v-icon class="mr-4 text-light-green-lighten-4">mdi-bell</v-icon>
                                    <div>
                                        <v-list-item-title class="text-lg font-semibold">{{ message.nickName }} 申请加入课题组</v-list-item-title>
                                        <v-list-item-subtitle class="text-base mb-2">{{ message.ms || '没有提供消息' }}</v-list-item-subtitle>
                                    </div>
                                </div>
                                <div class="ml-4 flex items-center justify-center">
                                    <span class="text-gray-500 text-sm">{{ message.time }}</span>
                                </div>
                            </div>
                        </v-list-item>
                    </v-card>
                </div>
            </div>

            <!-- 邀请加入课题组消息列表 -->
            <div class="mb-6">
                <div v-for="message in invitations" :key="message.id" class="mb-4">
                    <v-card class="border border-gray-300 rounded-lg" @click="goToReviewInvitedJoinOrg(message.id)">
                        <v-list-item>
                            <div class="flex justify-between items-center w-full">
                                <div class="flex items-center flex-1">
                                    <v-icon class="mr-4 text-light-green-lighten-4">mdi-account-group</v-icon>
                                    <div>
                                        <v-list-item-title class="text-lg font-semibold">{{ message.name }} 邀请您加入</v-list-item-title>
                                        <v-list-item-subtitle class="text-base">{{ message.ms || '邀请您加入一同共事' }}</v-list-item-subtitle>
                                    </div>
                                </div>
                                <div class="ml-4 flex items-center justify-center">
                                    <span class="text-gray-500 text-sm">{{ message.time }}</span>
                                </div>
                            </div>
                        </v-list-item>
                    </v-card>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'MessagePage',
    data() {
        return {
            joinRequests: [],
            invitations: []
        };
    },
    created() {
        this.fetchJoinRequests();
        this.fetchInvitations();
    },
    mounted() {},
    updated() {},
    methods: {
        // 获取申请加入课题组的消息
        async fetchJoinRequests() {
            // 获取从本地缓存中获取审核人当前所属组织的orgID
            const orgID = String(localStorage.getItem('orgID'));
            const result = await this.$api.orgUser.applyMs();
            console.log(result);
            // 根据审核人的orgID过滤申请消息
            this.joinRequests = result
                .filter((item) => String(item.applyOrgID) === orgID)
                .map((item) => ({
                    id: item.id,
                    nickName: item.nickName,
                    ms: item.ms,
                    time: '时间未知'
                }));
        },
        // 获取邀请加入课题组的消息
        async fetchInvitations() {
            const result = await this.$api.orgUser.inviteMs();
            this.invitations = result.map((item) => ({
                id: item.id,
                name: item.name,
                ms: item.ms,
                time: '时间未知'
            }));
        },
        // 跳转到查看申请加入的页面
        goToReviewInformationJoinOrg(id) {
            // 获取点击的消息对象
            const selectedMessage = this.joinRequests.find((message) => message.id === id);
            // 存储申请人信息
            this.$store.applyReason.applicant = selectedMessage.nickName;
            this.$store.applyReason.applyReason = selectedMessage.ms;
            this.$store.applyReason.applicantID = selectedMessage.id;
            this.$router.push({ path: '/user/reviewInformationJoinOrg', query: { id } });
        },
        // 跳转到查看邀请加入的页面
        goToReviewInvitedJoinOrg(id) {
            this.$router.push({ path: '/user/reviewInvitedJoinOrg', query: { id } });
        }
    }
};
</script>

<style scoped>
/* 根据需求添加样式 */
</style>
