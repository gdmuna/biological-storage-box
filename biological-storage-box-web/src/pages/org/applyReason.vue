<template>
    <div class="main-container apply-page bg-gray-100">
        <v-card class="w-full max-w-screen-sm mx-auto p-6">
            <v-textarea v-model="applyReason" label="申请理由" outlined required placeholder="申请理由最多输入100字" maxlength="100" counter></v-textarea>
            <v-btn class="mt-6" :disabled="loading || !isFormValid" :loading="loading" @click="submitApplication">提交申请</v-btn>
        </v-card>
    </div>
</template>

<script>
export default {
    name: 'ApplyReason',
    data() {
        return {
            applyReason: '',
            orgId: 0,
            loading: false
        };
    },
    computed: {
        isFormValid() {
            return this.applyReason;
        }
    },
    created() {
        this.orgId = this.$route.query.orgId;
    },
    mounted() {},
    updated() {},
    methods: {
        async submitApplication() {
            this.loading = true;
            const result = await this.$api.orgUser.apply(
                {},
                {
                    ms: this.applyReason,
                    orgID: this.orgId
                }
            );
            if (result === '发送申请成功') {
                this.$api.notify.success('申请成功');
                this.$router.push('/org/joinOrg');
            } else {
                this.$api.notify.error('申请失败');
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
