<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <div v-for="(item, index) in boxList" :key="item.id" :class="index === 0 ? '' : 'mt-5'">
                <v-card>
                    <v-card-item>
                        <v-card-title>{{ item.name }}</v-card-title>
                        <v-card-subtitle>{{ item.createBy }}</v-card-subtitle>
                    </v-card-item>
                    <v-card-text>{{ item.createTime }}</v-card-text>
                    <v-card-text>{{ item.updateTime }}</v-card-text>
                    <v-card-actions>
                        <v-btn variant="flat" color="light-green-lighten-4" text>查看</v-btn>
                        <v-btn variant="flat" color="light-green-lighten-4" text>编辑</v-btn>
                        <v-btn variant="flat" color="light-green-lighten-4" text>删除</v-btn>
                    </v-card-actions>
                </v-card>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ManageBoxPage',
    components: {},
    data() {
        return {
            boxList: []
        };
    },
    created() {},
    mounted() {
        this.getBox();
    },
    updated() {},
    methods: {
        async getBox() {
            const result = await this.$api.box.org({ pageNum: 1, pageSize: 10 });
            this.boxList = result;
        }
    }
};
</script>

<style scoped></style>
