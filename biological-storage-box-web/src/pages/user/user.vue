<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <v-card class="mx-auto px-1 py-1" :title="userInfo.nickName">
                <template #prepend>
                    <v-avatar size="80">
                        <v-img alt="John" src="/images/avatar.jpg"></v-img>
                    </v-avatar>
                </template>
                <template #subtitle>
                    <span @longpress="copyUID">uid: {{ userInfo.uid }}</span>
                </template>
            </v-card>
            <v-card class="mt-5">
                <v-list-item prepend-icon="mdi-message" append-icon="mdi-chevron-right" lines="two" subtitle="消息" link @click="goToInformation"></v-list-item>
                <v-divider class="border-opacity-75"></v-divider>
                <v-list-item prepend-icon="mdi-message" append-icon="mdi-chevron-right" lines="two" subtitle="意见反馈" link @click="goToFeedback"></v-list-item>
                <v-divider class="border-opacity-75"></v-divider>
                <v-list-item prepend-icon="mdi-cog" append-icon="mdi-chevron-right" lines="two" subtitle="设置" link @click="goToSetting"></v-list-item>
            </v-card>
        </div>
    </div>
</template>

<script>
export default {
    name: 'UserPage',
    data() {
        return {
            userInfo: {
                nickName: '',
                uid: ''
            }
        };
    },
    created() {
        this.fetchUserInfo();
    },
    methods: {
        async fetchUserInfo() {
            const response = await this.$api.user.userInfo();
            this.userInfo = response;
        },
        goToInformation() {
            this.$router.push('/user/information');
        },
        goToFeedback() {
            this.$router.push('/user/feedback');
        },
        goToSetting() {
            this.$router.push('/user/Setting');
        },
        copyUID() {
            wx.setClipboardData({
                data: this.userInfo.uid,
                success: () => {
                    wx.showToast({
                        title: 'UID 已复制',
                        icon: 'success',
                        duration: 2000
                    });
                },
                fail: () => {
                    wx.showToast({
                        title: '复制失败',
                        icon: 'none',
                        duration: 2000
                    });
                }
            });
        }
    }
};
</script>

<style scoped></style>
