<template>
    <div class="main-container apply-page bg-gray-100">
        <v-card class="w-full max-w-screen-sm mx-auto p-6">
            <!-- 邀请组织信息 -->
            <v-text-field v-model="name" label="邀请组织" readonly outlined dense></v-text-field>
            <v-textarea v-model="introduce" label="组织简介" readonly outlined dense></v-textarea>
            <v-card-actions class="justify-center pb-2">
                <v-btn class="mt-2 teal-lighten-1-bg text-white" style="width: 90%" @click="agreeInvitation">同意邀请</v-btn>
            </v-card-actions>
        </v-card>
    </div>
</template>

<script>
export default {
    name: 'ReviewInvitedJoinOrgPage',
    data() {
        return {
            name: '',
            introduce: ''
        };
    },
    created() {},
    mounted() {},
    updated() {},
    methods: {}
};
</script>

<style scoped>
/* 使白色底框不占满屏幕 */
.apply-page {
    padding: 20px;
}
/* 按钮样式 */
.teal-lighten-1-bg {
    background-color: #95b9a1; /* teal-lighten-1 颜色的背景色 */
    border-radius: 8px; /* 适当的圆角半径 */
    padding: 12px; /* 适当的内边距 */
    margin: 0; /* 移除默认的 margin */
}
</style>
