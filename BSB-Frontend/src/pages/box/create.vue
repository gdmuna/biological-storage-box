<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <v-card class="w-full mx-auto px-10">
                <v-form class="w-full max-w-sm mx-auto py-16" @submit.prevent="boxAdd">
                    <v-text-field v-model="name" label="试剂盒名称" :rules="[rules.notNull]" clearable></v-text-field>
                    <v-text-field v-model="shortName" label="简称" clearable></v-text-field>
                    <div class="flex space-x-4">
                        <v-select v-model="x" :items="xOptions" label="宽" :rules="[rules.notNull]" clearable></v-select>
                        <v-select v-model="y" :items="yOptions" label="高" :rules="[rules.notNull]" clearable></v-select>
                    </div>
                    <v-textarea v-model="introduce" label="试剂盒介绍" clearable></v-textarea>
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
            shortName: null,
            introduce: null,
            loading: false,
            dialog: false,
            x: null,
            y: null,
            xOptions: Array.from({ length: 10 }, (_, i) => i + 1),
            yOptions: Array.from({ length: 10 }, (_, i) => i + 1),
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
            return this.x && this.y && this.name;
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
        // 创建试剂盒
        async boxAdd() {
            this.loading = true;
            const currentOrg = this.$store.user.currentOrg;
            const currentRoot = this.$store.user.currentRoot;
            const result = await this.$api.box.add(
                {
                    name: this.name,
                    introduce: this.introduce,
                    x: this.x,
                    y: this.y,
                    rootId: currentRoot,
                    shortName: this.shortName
                },
                {
                    orgID: currentOrg
                }
            );
            console.log(result);
            if (result === 1) {
                this.$api.notify.success('创建成功');
                this.$router.go(-1);
                // 保存试剂盒信息到本地缓存
                const boxInfo = {
                    name: this.name,
                    introduce: this.introduce,
                    x: this.x,
                    y: this.y,
                    shortName: this.shortName
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
                this.shortName = boxInfo.shortName;
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

<style scoped>
/* 移除了网格相关样式 */
</style>
