<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <v-card class="w-full mx-auto px-10">
                <v-form class="w-full max-w-sm mx-auto py-16" @submit.prevent="orgUpdate">
                    <v-text-field v-model="orgInfo.name" label="课题组名称" :rules="[rules.notNull]"></v-text-field>
                    <v-textarea v-model="orgInfo.introduce" label="课题组介绍"></v-textarea>
                    <v-btn class="mt-4" type="submit" block :disabled="!btnAllowClick">更新</v-btn>
                </v-form>
            </v-card>
        </div>
    </div>
</template>

<script>
export default {
    name: 'UpdateOrgPage',
    components: {},
    data() {
        return {
            orgId: null,
            orgInfo: {},
            rules: {
                notNull: (value) => {
                    if (value) return true;
                    return '此处不能为空';
                }
            }
        };
    },
    computed: {
        // 创建按钮是否可点击
        btnAllowClick() {
            const value = this.rules.notNull(this.orgInfo.name);
            if (value) {
                return true;
            } else {
                return false;
            }
        }
    },
    async created() {
        // 从路由中获取 orgId
        this.orgId = this.$route.query.orgId;
        await this.getOrgInfo(this.orgId);
    },
    mounted() {},
    updated() {},
    methods: {
        // 获取某个试剂盒的详细信息
        async getOrgInfo(orgId) {
            const result = await this.$api.org.one({ orgID: orgId });
            this.orgInfo = result;
        },
        async orgUpdate() {
            const orgID = this.$store.user.currentOrg;
            const result = await this.$api.org.update({
                id: this.orgInfo.id,
                introduce: this.orgInfo.introduce,
                name: this.orgInfo.name
            });
            if (result === '操作成功') {
                // 上传成功后返回上一页
                this.$router.go(-1);
            }
        }
    }
};
</script>

<style scoped></style>
