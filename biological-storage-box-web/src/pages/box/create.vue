<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <v-card class="w-full mx-auto px-10">
                <v-form class="w-full max-w-sm mx-auto py-16" @submit.prevent="boxAdd">
                    <v-text-field v-model="name" label="试剂盒名称" :rules="[rules.notNull]"></v-text-field>
                    <v-text-field v-model="access" label="试剂盒位置" :rules="[rules.notNull]"></v-text-field>
                    <v-text-field v-model="xaxis" label="长度x" :rules="[rules.notNull, rules.isNumber]"></v-text-field>
                    <v-text-field v-model="yaxis" label="宽度y" :rules="[rules.notNull, rules.isNumber]"></v-text-field>
                    <v-textarea v-model="introduce" label="简介"></v-textarea>
                    <v-btn class="mt-4" type="submit" block :disabled="!btnAllowClick">创建</v-btn>
                </v-form>
            </v-card>
        </div>
    </div>
</template>

<script>
export default {
    name: 'CreateBoxPage',
    components: {},
    data() {
        return {
            name: null,
            access: null,
            xaxis: null,
            yaxis: null,
            introduce: null,
            rules: {
                notNull: (value) => {
                    if (value) return true;
                    return '此处不能为空';
                },
                isNumber: (value) => {
                    const pattern = /^(?:[1-9][0-9]?|100)$/;
                    return pattern.test(value) || '请输入 1-100 之间的数字';
                }
            }
        };
    },
    computed: {
        // 创建按钮是否可点击
        btnAllowClick() {
            const value = this.rules.notNull(this.name) && this.rules.notNull(this.access) && this.rules.notNull(this.xaxis) && this.rules.notNull(this.yaxis) && (this.rules.isNumber(this.xaxis) === true ? true : false) && (this.rules.isNumber(this.yaxis) === true ? true : false);
            return value === true ? true : false;
        }
    },
    created() {},
    mounted() {},
    updated() {},
    methods: {
        async boxAdd() {
            const currentOrg = this.$store.user.currentOrg;
            const result = await this.$api.box.add({
                name: this.name,
                access: this.access,
                xaxis: this.xaxis,
                yaxis: this.yaxis,
                introduce: this.introduce
            });
            if (result === '操作完成') {
                this.$router.push('/box');
            }
        }
    }
};
</script>

<style scoped></style>
