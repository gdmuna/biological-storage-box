<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <v-card class="w-full mx-auto px-10">
                <v-form class="w-full max-w-sm mx-auto py-16" @submit.prevent="updateContainer">
                    <v-text-field v-model="containerInfo.roomName" label="存储容器名称" :rules="[rules.notNull]"></v-text-field>
                    <v-textarea v-model="containerInfo.roomDescribe" label="容器描述" :rules="[rules.notNull]"></v-textarea>
                    <v-btn class="mt-4" type="submit" block :loading="loading" :disabled="!btnAllowClick">更新</v-btn>
                </v-form>
            </v-card>
        </div>
    </div>
</template>

<script>
export default {
    name: 'UpdateContainerPage',
    data() {
        return {
            containerId: null,
            containerInfo: {},
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
        // 更新按钮是否可点击
        btnAllowClick() {
            const value = this.rules.notNull(this.containerInfo.roomName) && this.rules.notNull(this.containerInfo.roomDescribe);
            return !!value;
        },
    },
    // 从路由中获取 containerId
    async created() {
        this.containerId = this.$route.query.containerId;
        await this.getContainerInfo(this.containerId);
    },
    methods: {
        // 获取某个存储容器的详细信息
        async getContainerInfo(containerId) {
            const orgId = this.$store.user.currentOrg;
            const result = await this.$api.root.one({
                orgID: orgId,
                rootID: containerId
            })
            this.containerInfo = result;
        },
        // 更新存储容器信息
        async updateContainer() {
            this.loading = true;
            const orgID = this.$store.user.currentOrg;
            const result = await this.$api.root.update(
                {
                    createBy: this.containerInfo.createBy,
                    id: this.containerInfo.id,
                    roomDescribe: this.containerInfo.roomDescribe,
                    roomName: this.containerInfo.roomName
                },
                {
                    orgID: orgID
                }
            );
            if (result === 1) {
                this.$router.push('/storageLocation/manageContainer');
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
