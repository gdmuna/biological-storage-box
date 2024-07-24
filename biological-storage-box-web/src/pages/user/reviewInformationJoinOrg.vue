<template>
    <div class="main-container apply-page bg-gray-100">
        <v-card class="w-full max-w-screen-sm mx-auto p-6">
            <!-- 申请人信息 -->
            <v-text-field v-model="nickname" label="申请人" readonly outlined dense></v-text-field>
            <v-textarea v-model="applyReason" label="申请理由" readonly outlined dense></v-textarea>
            <v-card-actions class="justify-center pb-2">
                <v-btn class="mt-2 teal-lighten-1-bg text-white" style="width: 90%" @click="examinationPassed">审核通过</v-btn>
            </v-card-actions>
        </v-card>
    </div>
</template>

<script>
export default {
    name: 'ReviewInformationJoinOrgPage',
    data() {
        return {
            nickname: '',
            applyReason: ''
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
