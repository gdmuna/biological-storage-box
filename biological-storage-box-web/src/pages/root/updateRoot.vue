<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <v-card class="w-full mx-auto px-10">
                <v-form class="w-full max-w-sm mx-auto py-16" @submit.prevent="updateRoot">
                    <v-text-field v-model="rootInfo.roomName" label="房间名称" :rules="[rules.notNull]"></v-text-field>
                    <v-text-field v-model="rootInfo.location" label="房间位置" :rules="[rules.notNull]"></v-text-field>
                    <v-textarea v-model="rootInfo.describe" label="房间描述" :rules="[rules.notNull]"></v-textarea>
                    <v-btn class="mt-4" type="submit" block :loading="loading" :disabled="!btnAllowClick">更新</v-btn>
                </v-form>
            </v-card>
        </div>
    </div>
</template>

<script>
export default {
    name: 'UpdateRootPage',
    data() {
        return {
            rootID: null,
            rootInfo: {},
            rules: {
                notNull: (value) => {
                    if (value) return true;
                    return '此处不能为空';
                }
            },
            loading: false
        };
    },
    computed: {
        // 创建按钮是否可点击
        btnAllowClick() {
            const value = this.rules.notNull(this.rootInfo.name) && this.rules.notNull(this.rootInfo.description) && this.rules.notNull(this.rootInfo.location);
            return !!value;
        }
    },
    async created() {
        // 从路由中获取 rootID
        this.rootID = this.$route.query.rootID;
        await this.getRootInfo(this.rootID);
    },
    methods: {
        // 获取某个房间的详细信息
        async getRootInfo(rootID) {
            // 模拟获取房间信息
            this.rootInfo = {
                id: rootID,
                roomName: '示例房间',
                describe: '这是一个示例房间，用于演示。',
                location: '1号楼 202 室'
            };
        },
        // 模拟 - 更新房间信息
        async updateRoot() {
            this.loading = true;
            setTimeout(() => {
                this.$router.push('/root/manageRoot');
                this.$api && this.$api.notify && this.$api.notify.success('更新成功');
                this.loading = false;
            }, 1000);
        }
        // // 更新房间信息
        // async updateRoot1() {
        //     this.loading = true;
        //     const orgID = this.$store.user.currentOrg;
        //     const result = await this.$api.box.update(
        //         {
        //             createBy: this.rootInfo.createBy,
        //             id: this.rootInfo.id,
        //             describe: this.rootInfo.describe,
        //             roomName: this.rootInfo.roomName
        //         },
        //         {
        //             orgID: orgID
        //         }
        //     );
        //     if (result === 1) {
        //         this.$router.push('/root/manageRoot');
        //         this.$api.notify.success('更新成功');
        //     } else {
        //         this.loading = false;
        //         this.$api.notify.error('更新失败，请重试');
        //     }
        // }
    }
};
</script>

<style scoped></style>
