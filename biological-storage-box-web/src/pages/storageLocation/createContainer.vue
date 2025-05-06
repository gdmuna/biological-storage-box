<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <v-card class="w-full mx-auto px-10">
                <v-form class="w-full max-w-sm mx-auto py-16" @submit.prevent="containerAdd">
                    <!-- 容器名称输入框 -->
                    <v-text-field v-model="containerName" label="容器名称" :rules="[rules.notNull]"></v-text-field>
                    <!-- 容器介绍文本区域 -->
                    <v-textarea v-model="description" label="容器介绍" :rules="[rules.notNull]"></v-textarea>
                    <!-- 创建按钮 -->
                    <v-btn class="mt-4" type="submit" block :loading="loading" :disabled="!btnAllowClick">创建</v-btn>
                </v-form>
            </v-card>
        </div>
    </div>
</template>

<script>
export default {
    name: 'CreateContainerPage',
    data() {
        return {
            containerName: null,
            parentId: null,
            description: null,
            loading: false,
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
            return this.rules.notNull(this.containerName) === true && this.rules.notNull(this.description) === true;
        }
    },
    methods: {
        // 容器创建
        async containerAdd() {
            this.loading = true;
            const currentOrg = this.$store.user.currentOrg;
            const result = await this.$api.root.add(
                {
                    roomName: this.containerName,
                    roomDescribe: this.description,
                    parentId: this.$store.user.currentRoot
                },
                {
                    orgID: currentOrg
                }
            );
            if (result === 1) {
                this.$api.notify.success('容器创建成功');
                this.$router.push('/storageLocation/manageContainer');
            } else {
                this.loading = false;
                this.$api.notify.error('容器创建失败，请重试');
            }
        }
    }
};
</script>

<style scoped></style>
