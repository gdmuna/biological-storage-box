<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <v-card class="w-full mx-auto px-10">
                <v-form class="w-full max-w-sm mx-auto py-16" @submit.prevent="boxAdd">
                    <v-text-field v-model="name" label="试剂盒名称" :rules="[rules.notNull]" clearable></v-text-field>
                    <v-text-field v-model="nickName1" label="简称1" :rules="[rules.notNull]" clearable></v-text-field>
                    <v-text-field v-model="nickName2" label="简称2" :rules="[rules.notNull]" clearable></v-text-field>
                    <v-text-field v-model="x" label="长度x" :rules="[rules.notNull, rules.isNumber]" clearable></v-text-field>
                    <v-text-field v-model="y" label="宽度y" :rules="[rules.notNull, rules.isNumber]" clearable></v-text-field>
                    <v-textarea v-model="introduce" label="试剂盒介绍" :rules="[rules.notNull]" clearable></v-textarea>
                    <v-btn class="mt-4" type="submit" block :loading="loading" :disabled="!btnAllowClick">创建</v-btn>
                </v-form>
            </v-card>
        </div>
    </div>

    <!-- 弹窗提示是否使用上次的信息 -->
    <v-dialog v-model="dialog" max-width="500px">
        <v-card>
            <v-card-title>使用上次的试剂盒信息?</v-card-title>
            <v-card-actions>
                <v-btn variant="flat" color="green" @click="useLastInfo">使用</v-btn>
                <v-btn variant="flat" color="red" @click="cancelUseLastInfo">取消</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    name: 'CreateBoxPage',
    components: {},
    data() {
        return {
            name: null,
            nickName1: '这里是简称1',
            nickName2: '这里是简称2',
            introduce: null,
            x: null,
            y: null,
            loading: false,
            dialog: false,
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
            const firstValue = (this.rules.isNumber(this.x) === true ? true : false) && (this.rules.isNumber(this.y) === true ? true : false);
            const secondeValue = this.rules.notNull(this.name);
            if (firstValue && secondeValue === true) {
                return true;
            } else {
                return false;
            }
        }
    },
    created() {
        // 检查是否有上次保存的试剂盒信息
        const savedBoxInfo = localStorage.getItem('lastBoxInfo');
        if (savedBoxInfo) {
            // 如果有，则弹窗询问是否使用上次信息
            this.dialog = true;
        }
    },
    mounted() {},
    updated() {},
    methods: {
        async boxAdd() {
            this.loading = true;
            const currentOrg = this.$store.user.currentOrg;
            const result = await this.$api.box.add(
                {
                    name: this.name,
                    introduce: this.introduce,
                    x: this.x,
                    y: this.y
                },
                {
                    orgID: currentOrg
                }
            );
            console.log(result);
            if (result === 1) {
                this.$api.notify.success('创建成功');
                this.$router.push('/box');
                // 保存试剂盒信息到本地缓存
                const boxInfo = {
                    name: this.name,
                    introduce: this.introduce,
                    x: this.x,
                    y: this.y
                };
                localStorage.setItem('lastBoxInfo', JSON.stringify(boxInfo));
            } else {
                this.loading = false;
                this.$api.notify.error('创建失败，请重试');
            }
        },
        // 使用上次的信息填充表单
        useLastInfo() {
            const savedBoxInfo = localStorage.getItem('lastBoxInfo');
            if (savedBoxInfo) {
                const boxInfo = JSON.parse(savedBoxInfo);
                this.name = boxInfo.name;
                this.introduce = boxInfo.introduce;
                this.x = boxInfo.x;
                this.y = boxInfo.y;
            }
            this.dialog = false; // 关闭弹窗
        },
        // 取消使用上次的信息
        cancelUseLastInfo() {
            this.dialog = false; // 关闭弹窗
        }
    }
};
</script>

<style scoped></style>
