<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <div v-for="(item, index) in boxList" :key="item.id" :class="index === 0 ? '' : 'mt-5'">
                <v-card class="pb-2">
                    <v-card-item>
                        <v-card-title>{{ item.id }}</v-card-title>
                        <template #append>
                            <v-avatar size="24">
                                <v-img>{{ statusJudgment(item.operationType) }}</v-img>
                            </v-avatar>
                        </template>
                        <v-card-subtitle class="pb-1">
                            操作人员：
                            <v-chip size="small" color="indigo">
                                <v-icon icon="mdi-account-circle" start></v-icon>
                                {{ item.realName }}
                            </v-chip>
                        </v-card-subtitle>
                    </v-card-item>
                    <v-card-text class="py-1">
                        操作试剂名：
                        <v-chip size="small" color="deep-purple-lighten-1">{{ item.name }}</v-chip>
                    </v-card-text>
                    <v-card-text class="py-1">
                        操作位置：
                        <v-chip size="small" color="purple-lighten-1">[{{ item.x }},{{ item.y }}]</v-chip>
                    </v-card-text>
                    <v-card-text class="py-1">
                        操作时间：
                        <v-chip size="small" color="deep-purple-lighten-1">{{ item.createTime }}</v-chip>
                    </v-card-text>
                    <v-card-text class="py-1">
                        备注：
                        <v-chip size="small" color="purple-lighten-1">{{ item.remark }}</v-chip>
                    </v-card-text>
                </v-card>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'LogPage',
    components: {},
    data() {
        return {
            boxList: [],
            boxId: null
        };
    },
    async created() {
        // 从路由中获取 boxId
        this.boxId = this.$route.query.boxId;
    },
    mounted() {
        this.getLog();
    },
    updated() {},
    methods: {
        // 获取试剂盒操作日志
        async getLog() {
            let boxId = this.boxId;
            const orgId = this.$store.user.currentOrg;
            const result = await this.$api.boxLog.list({ boxID: boxId, orgID: orgId, pageNum: 1, pageSize: 10 });
            this.boxList = result;
        },
        // 操作类型判断
        statusJudgment(operationType) {
            if (operationType === 1) {
                return '存';
            } else if (operationType === 2) {
                return '更';
            } else if (operationType === 3) {
                return '删';
            }
        }
    }
};
</script>

<style scoped></style>
