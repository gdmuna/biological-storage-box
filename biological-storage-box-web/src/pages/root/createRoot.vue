<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <v-card class="w-full mx-auto px-10">
                <v-form class="w-full max-w-sm mx-auto py-16" @submit.prevent="addRoot">
                    <!-- 房间名称输入框 -->
                    <v-text-field v-model="roomName" label="房间名称" :rules="[rules.notNull]"></v-text-field>
                    <!-- 房间介绍文本区域 -->
                    <v-textarea v-model="describe" label="房间介绍" :rules="[rules.notNull]"></v-textarea>
                    <!-- 创建按钮 -->
                    <v-btn class="mt-4" type="submit" block :loading="loading" :disabled="!btnAllowClick">创建</v-btn>
                </v-form>
            </v-card>
        </div>
    </div>
</template>

<script>
export default {
    name: 'CreateRoomPage',
    data() {
        return {
            roomName: null,
            // address: null,
            describe: null,
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
            return this.rules.notNull(this.roomName) === true && this.rules.notNull(this.describe) === true;
        }
    },
    methods: {
        async addRoot() {
            this.loading = true;
            const currentOrg = this.$store.user.currentOrg;
            const result = await this.$api.root.add(
                {
                    roomName: this.roomName,
                    describe: this.describe
                },
                {
                    orgID: currentOrg
                }
            );
            if (result === 1) {
                this.$api.notify.success('房间创建成功');
                this.$router.push('/root/manageRoot');
            } else {
                this.loading = false;
                this.$api.notify.error('房间创建失败，请重试');
            }
        }
    }
};
</script>

<style scoped></style>
