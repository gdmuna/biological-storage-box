<template>
    <div class="main-container py-10">
        <div class="w-full max-w-screen-sm mx-auto px-10">
            <!-- 申请加入课题组消息列表 -->
            <div class="mb-6">
                <div v-for="(message, index) in joinRequests" :key="index" class="mb-4">
                    <v-card class="border border-gray-300 rounded-lg" @click="goToReviewInformationJoinOrg(message.id)">
                        <v-list-item>
                            <div class="flex justify-between items-center w-full">
                                <div class="flex items-center flex-1">
                                    <v-icon class="mr-4 text-light-green-lighten-4">mdi-bell</v-icon>
                                    <div>
                                        <v-list-item-title class="text-lg font-semibold">{{ message.nickname }}申请加入课题组</v-list-item-title>
                                        <v-list-item-subtitle class="text-base mb-2">{{ message.subtitle }}</v-list-item-subtitle>
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
                <div v-for="(message, index) in invitations" :key="index" class="mb-4">
                    <v-card class="border border-gray-300 rounded-lg" @click="goToReviewInvitedJoinOrg(message.id)">
                        <v-list-item>
                            <div class="flex justify-between items-center w-full">
                                <div class="flex items-center flex-1">
                                    <v-icon class="mr-4 text-light-green-lighten-4">mdi-account-group</v-icon>
                                    <div>
                                        <v-list-item-title class="text-lg font-semibold">{{ message.name }}邀请您加入</v-list-item-title>
                                        <v-list-item-subtitle class="text-base mb-2">{{ message.subtitle }}</v-list-item-subtitle>
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
            joinRequests: [], // 申请加入课题组消息列表
            invitations: [] // 邀请加入课题组消息列表
        };
    },
    created() {
        this.fetchJoinRequests();
        this.fetchInvitations();
    },
    methods: {
        // 模拟接口请求，获取申请加入课题组的消息
        fetchJoinRequests() {
            this.joinRequests = [
                {
                    id: 1,
                    nickname: '张三',
                    subtitle: '这里放申请理由',
                    time: '2024-07-23'
                }
            ];
        },
        fetchInvitations() {
            this.invitations = [
                {
                    id: 1,
                    name: 'xx实验室',
                    subtitle: '这是放组织简介',
                    time: '2024-07-22'
                },
                {
                    id: 2,
                    name: 'yy实验室',
                    subtitle: '这是放组织简介',
                    time: '2024-07-21'
                }
            ];
        },
        goToReviewInformationJoinOrg(id) {
            this.$router.push({ path: '/user/reviewInformationJoinOrg', params: { id } });
        },
        goToReviewInvitedJoinOrg(id) {
            this.$router.push({ path: '/user/reviewInvitedJoinOrg', params: { id } });
        }
    }
};
</script>

<style scoped></style>
