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
    created() {
        this.nickname = this.$store.applyReason.applicant;
        this.applyReason = this.$store.applyReason.applyReason;
    },
    mounted() {},
    updated() {},
    methods: {
        async examinationPassed() {
            const result = await this.$api.orgUser.applyAc({}, { orgID: localStorage.getItem('orgID'), userID: this.$store.applyReason.applicantID });
            if (!result) {
                this.$api.notify.error('审核失败');
                return;
            } else {
                this.$api.notify.success('审核通过');
            }
            this.$router.push('/user/information');
        }
    }
};
</script>

<style scoped>
/* 使白色底框不占满屏幕 */
.apply-page {
    padding: 20px;
}
/* 按钮样式 */
.teal-lighten-1-bg {
    background-color: #95b9a1;
    border-radius: 8px;
    padding: 12px;
    margin: 0;
}
</style>
