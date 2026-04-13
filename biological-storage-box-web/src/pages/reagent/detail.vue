<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm h-full mx-auto px-10 py-10">
            <v-card>
                <v-list-item class="pt-4" append-icon="mdi-chevron-right" lines="two" subtitle="试剂名称" link>{{ reagent.name }}</v-list-item>
                <v-divider class="border-opacity-75"></v-divider>
                <v-list-item append-icon="mdi-chevron-right py-4" lines="two" subtitle="试剂位置" link>[{{ reagent.x }},{{ reagent.y }}]</v-list-item>
                <v-divider class="border-opacity-75"></v-divider>
                <v-list-item append-icon="mdi-chevron-right py-4" lines="two" subtitle="更新时间" link>{{ reagent.updateTime }}</v-list-item>
                <v-divider class="border-opacity-75"></v-divider>
                <v-list-item append-icon="mdi-chevron-right py-4" lines="two" subtitle="备注" link>{{ reagent.remark }}</v-list-item>
            </v-card>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ReagentDetailPage',
    components: {},
    data() {
        return {
            reagent: {},
            boxId: null
        };
    },
    async created() {
        // 从路由中获取 boxId
        this.boxId = this.$route.query.boxId;
        this.reagentId = this.$route.query.reagentId;
    },
    mounted() {
        this.getDetail();
    },
    updated() {},
    methods: {
        // 获取试剂详情
        async getDetail() {
            let boxId = this.boxId;
            const orgId = this.$store.user.currentOrg;
            const result = await this.$api.reagent.one({
                boxID: boxId,
                orgID: orgId,
                reagentID: this.reagentId
            });
            this.reagent = result;
        }
    }
};
</script>

<style scoped></style>
