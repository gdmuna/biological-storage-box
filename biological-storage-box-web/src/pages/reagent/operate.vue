<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <div v-for="(item, index) in reagentList" :key="item.id" :class="index === 0 ? '' : 'mt-5'">
                <v-card>
                    <v-card-item>
                        <v-card-title>第{{ item.yaxis }}行 - 第{{ item.xaxis }}列</v-card-title>
                    </v-card-item>
                    <v-card-text>
                        <v-select v-model="item.sign" label="操作" density="compact" :items="operateOptions" :bg-color="operateColor[item.sign - 1]"></v-select>
                        <v-text-field v-model="item.tag" label="试剂名称" density="compact" variant="outlined" :disabled="item.sign === 3"></v-text-field>
                        <v-textarea v-model="item.remark" label="备注" density="compact" variant="outlined" :disabled="item.sign === 3" rows="2" auto-grow></v-textarea>
                    </v-card-text>
                </v-card>
            </div>
            <v-btn class="mt-10" block @click="summit()">提交</v-btn>
        </div>
    </div>
</template>

<script>
export default {
    name: 'OperateReagentPage',
    components: {},
    data() {
        return {
            reagentList: [],
            operateOptions: [
                { title: '新增', value: 1 },
                { title: '修改', value: 2 },
                { title: '删除', value: 3 }
            ],
            operateColor: {
                0: 'cyan-lighten-1',
                1: 'teal-lighten-3',
                2: 'orange-lighten-1'
            }
        };
    },
    created() {
        // 从 store 中获取选中的试剂网格的信息
        const reagentList = this.$store.reagent.selection;
        // 根据 isDelete 的值为 operateList 的每一项新增 sign 属性
        this.reagentList = reagentList.map((item) => {
            item.sign = item.isDelete === 0 ? 3 : 1;
            return item;
        });
    },
    mounted() {},
    updated() {},
    methods: {
        async summit() {
            // 将 sign = 1 的项的 isDelete 置 0
            // 将 sign = 3 的项的 isDelete 置 1，并且将 tag 和 remark 置空
            const reagentList = this.reagentList.map((item) => {
                item.updateTime = null;
                if (item.sign === 1) {
                    item.isDelete = 0;
                } else if (item.sign === 3) {
                    item.isDelete = 1;
                    item.tag = null;
                    item.remark = null;
                }
                return item;
            });
            // 循环向后端发送提交请求
            for (let i = 0; i < reagentList.length; i++) {
                const item = reagentList[i];
                const res = await this.$api.reagent.opera(item);
            }
            // 提交成功后，返回试剂管理页面
            this.$router.go(-1);
        }
    }
};
</script>

<style scoped></style>
