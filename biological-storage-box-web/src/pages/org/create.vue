<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <v-card class="w-full mx-auto px-10">
                <v-form class="w-full max-w-sm mx-auto py-16" @submit.prevent="orgAdd">
                    <v-text-field v-model="orgName" label="课题组名称" :rules="[rules.notNull]"></v-text-field>
                    <v-textarea v-model="introduce" label="简介"></v-textarea>
                    <v-btn class="mt-4" type="submit" block :disabled="!btnAllowClick">创建</v-btn>
                </v-form>
            </v-card>
        </div>
    </div>
</template>

<script>
export default {
    name: 'CreateOrgPage',
    components: {},
    data() {
        return {
            orgName: null,
            introduce: null,
            memberCount: 0,
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
            const value = this.rules.notNull(this.orgName);
            return value === true ? true : false;
        }
    },
    created() {},
    mounted() {},
    updated() {},
    methods: {
        async orgAdd() {
            const result = await this.$api.org.add({
                orgName: this.orgName,
                introduce: this.introduce,
                memberCount: this.memberCount
            });
            if (result === '操作完成') {
                this.$router.push('/box');
                console.log('创建成功');
            }
        }
    }
};
</script>

<style scoped></style>
