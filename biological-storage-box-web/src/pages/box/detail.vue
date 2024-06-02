<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm h-full mx-auto px-10 py-10">
            <v-card>
                <v-list-item class="pt-4" append-icon="mdi-chevron-right" lines="two" subtitle="试剂盒名称" link>{{ box.name }}</v-list-item>
                <v-divider class="border-opacity-75"></v-divider>
                <v-list-item append-icon="mdi-chevron-right py-4" lines="two" subtitle="试剂盒位置" link>{{ box.access }}</v-list-item>
                <v-divider class="border-opacity-75"></v-divider>
                <v-list-item append-icon="mdi-chevron-right py-4" lines="two" subtitle="创建人员" link>{{ box.createBy }}</v-list-item>
                <v-divider class="border-opacity-75"></v-divider>
                <v-list-item append-icon="mdi-chevron-right py-4" lines="two" subtitle="创建时间" link>{{ box.createTime }}</v-list-item>
                <v-divider class="border-opacity-75"></v-divider>
                <v-list-item append-icon="mdi-chevron-right py-4" lines="two" subtitle="更新时间" link>{{ box.updateTime }}</v-list-item>
                <v-divider class="border-opacity-75"></v-divider>
                <v-list-item append-icon="mdi-chevron-right py-4" lines="two" subtitle="长度x" link>{{ box.xaxis }}</v-list-item>
                <v-divider class="border-opacity-75"></v-divider>
                <v-list-item append-icon="mdi-chevron-right py-4" lines="two" subtitle="长度y" link>{{ box.yaxis }}</v-list-item>
                <v-divider class="border-opacity-75"></v-divider>
                <v-list-item append-icon="mdi-chevron-right py-4" lines="two" subtitle="图片" link><v-img alt="John" src="/images/reagent.png"></v-img></v-list-item>
                <v-divider class="border-opacity-75"></v-divider>
                <v-list-item append-icon="mdi-chevron-right py-4" lines="two" subtitle="简介" link>{{ box.introduce }}</v-list-item>
            </v-card>
        </div>
    </div>
</template>

<script>
export default {
    name: 'DetailPage',
    components: {},
    data() {
        return {
            box: {},
            boxId: null
        };
    },
    async created() {
        // 从路由中获取 boxId
        this.boxId = this.$route.query.boxId;
    },
    mounted() {
        this.getDetail();
    },
    updated() {},
    methods: {
        // 获取试剂盒详情
        async getDetail() {
            let id = this.boxId;
            const result = await this.$api.box.one({ id });
            this.box = result;
        }
    }
};
</script>

<style scoped></style>
