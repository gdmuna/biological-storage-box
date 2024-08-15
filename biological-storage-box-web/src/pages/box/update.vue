<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <v-card class="w-full mx-auto px-10">
                <v-form class="w-full max-w-sm mx-auto py-16" @submit.prevent="boxAdd">
                    <v-text-field v-model="boxInfo.name" label="试剂盒名称" :rules="[rules.notNull]"></v-text-field>
                    <v-textarea v-model="boxInfo.introduce" label="试剂盒介绍" :rules="[rules.notNull]"></v-textarea>
                    <v-btn class="mt-4" type="submit" block :loading="loading" :disabled="!btnAllowClick">更新</v-btn>
                </v-form>
            </v-card>
        </div>
    </div>
</template>

<script>
export default {
    name: 'UpdatePage',
    components: {},
    data() {
        return {
            boxId: null,
            boxInfo: {},
            rules: {
                notNull: (value) => {
                    if (value) return true;
                    return '此处不能为空';
                },
                isNumber: (value) => {
                    const pattern = /^(?:[1-9][0-9]?|100)$/;
                    return pattern.test(value) || '请输入 1-100 之间的数字';
                }
            },
            loading: false
        };
    },
    computed: {
        // 创建按钮是否可点击
        btnAllowClick() {
            const value = this.rules.notNull(this.boxInfo.name) && this.rules.notNull(this.boxInfo.introduce);
            if (value) {
                return true;
            } else {
                return false;
            }
        }
    },
    async created() {
        // 从路由中获取 boxId
        this.boxId = this.$route.query.boxId;
        await this.getBoxInfo(this.boxId);
    },
    mounted() {},
    updated() {},
    methods: {
        // 获取某个试剂盒的详细信息
        async getBoxInfo(boxId) {
            const orgID = this.$store.user.currentOrg;
            const result = await this.$api.box.one({ boxID: boxId, orgID: orgID });
            this.boxInfo = result;
        },
        async boxAdd() {
            this.loading = true;
            const orgID = this.$store.user.currentOrg;
            const result = await this.$api.box.update(
                {
                    createBy: this.boxInfo.createBy,
                    id: this.boxInfo.id,
                    introduce: this.boxInfo.introduce,
                    name: this.boxInfo.name
                },
                {
                    orgID: orgID
                }
            );
            if (result === 1) {
                this.$router.push('/box');
                this.$api.notify.success('更新成功');
            } else {
                this.loading = false;
                this.$api.notify.error('更新失败，请重试');
            }
        }
    }
};
</script>

<style scoped></style>
