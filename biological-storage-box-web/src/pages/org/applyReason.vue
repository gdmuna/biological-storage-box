<template>
    <div class="main-container apply-page bg-gray-100">
        <v-card class="w-full max-w-screen-sm mx-auto p-6">
            <v-textarea v-model="applyReason" label="申请理由" outlined required placeholder="申请理由最多输入100字" maxlength="100" counter></v-textarea>
            <v-btn class="mt-6" @click="submitApplication">提交申请</v-btn>
        </v-card>
    </div>
</template>

<script>
export default {
    name: 'ApplyReason',
    data() {
        return {
            applyReason: '',
            orgId: null
        };
    },
    created() {
        this.orgId = this.$route.query.orgId;
    },
    mounted() {},
    updated() {},
    methods: {
        async submitApplication() {
            try {
                await this.$api.orgUser.apply({ ms: this.applyReason, org: this.orgId });
                this.$router.push('/joinOrg'); // 跳转回搜索组织页面
            } catch (error) {
                console.error('提交申请失败:', error);
            }
        }
    }
};
</script>

<style scoped>
.apply-page {
    padding: 20px;
}
</style>
