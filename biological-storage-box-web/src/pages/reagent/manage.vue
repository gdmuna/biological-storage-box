<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto p-6">
            <!-- 基本信息 -->
            <v-sheet class="p-3" elevation="2" rounded>{{ boxInfo.name }}</v-sheet>
            <!-- 试剂网格 -->
            <v-sheet class="mt-3 p-3 overflow-x-scroll" elevation="2" rounded>
                <v-item-group v-model="selection" class="w-full inline-grid" multiple>
                    <div v-for="y in boxInfo.yaxis" :key="y" class="w-full flex justify-center">
                        <div v-for="x in boxInfo.xaxis" :key="x">
                            <v-item v-slot="{ isSelected, toggle }">
                                <v-card :color="cardColor(y, x, isSelected)" class="m-1" width="25" height="25" @click="toggle"></v-card>
                            </v-item>
                        </div>
                    </div>
                </v-item-group>
            </v-sheet>
            <!-- 操作列表 -->
            <v-sheet class="mt-3 p-3" elevation="2" rounded>
                <div class="flex justify-around">
                    <div>
                        <v-btn variant="flat" color="teal-lighten-1" :disabled="!(selectedCount == 1)" @click="routeToDetailReagent()">详情</v-btn>
                        <v-btn class="ml-2" variant="flat" color="teal-lighten-1" :disabled="!(selectedCount == 1)" @click="routeToLogReagent()">日志</v-btn>
                    </div>
                    <v-btn variant="flat" color="teal-darken-2" :disabled="!(selectedCount > 0)" @click="handleOperation()">操作</v-btn>
                </div>
            </v-sheet>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ManageReagentPage',
    components: {},
    data() {
        return {
            boxId: null,
            boxInfo: {},
            reagentList: [],
            selection: []
        };
    },
    computed: {
        // 试剂网格的颜色
        cardColor() {
            return (y, x, isSelected) => {
                const index = (y - 1) * this.boxInfo.xaxis + x - 1;
                const reagent = this.reagentList[index];
                // 根据网格是否为空与是否被选中来设置颜色
                if (isSelected) {
                    return reagent && reagent.isDelete == 0 ? 'orange-lighten-1' : 'cyan-lighten-1';
                } else {
                    return reagent && reagent.isDelete == 0 ? 'light-green-lighten-1' : 'blue-grey-lighten-5';
                }
            };
        },
        // 选中试剂网格的数量
        selectedCount() {
            return this.selection.length;
        }
    },
    async created() {
        // 从路由中获取 boxId
        this.boxId = this.$route.query.boxId;
        await this.getBoxInfo(this.boxId);
        await this.getReagentList(this.boxId);
    },
    mounted() {},
    updated() {},
    methods: {
        // 获取某个试剂盒的详细信息
        async getBoxInfo(boxId) {
            const result = await this.$api.box.one({ id: boxId });
            this.boxInfo = result;
        },
        // 获取某个试剂盒内的试剂列表
        async getReagentList(boxId) {
            // 初始化试剂列表
            const initialReagentList = [];
            for (let y = 1; y <= this.boxInfo.yaxis; y++) {
                for (let x = 1; x <= this.boxInfo.xaxis; x++) {
                    initialReagentList.push({
                        id: (y - 1) * this.boxInfo.xaxis + x,
                        boxId: Number(boxId),
                        xaxis: x,
                        yaxis: y,
                        isDelete: 1,
                        tag: null,
                        remark: null,
                        updateTime: null
                    });
                }
            }
            // 合并试剂列表数据
            const result = await this.$api.reagent.list({ boxId });
            this.reagentList = initialReagentList.map((reagent) => {
                const item = result.find((item) => item.xaxis === reagent.xaxis && item.yaxis === reagent.yaxis);
                return item ? item : reagent;
            });
        },
        // 操作按钮
        async handleOperation() {
            // 根据 selection 从 reagentList 中获取选中的试剂网格的信息
            // selection 中的元素就是 reagentList 的索引
            const selectedReagentList = this.selection.map((index) => this.reagentList[index]);
            // 将选中的试剂网格的信息传递给 store
            this.$store.reagent.selection = selectedReagentList;
            // 跳转到试剂操作页面
            this.$router.push({ path: '/reagent/operate' });
        },
        // 跳转到试剂日志页面
        async routeToLogReagent() {
            let boxId = this.boxId;
            this.$router.push({ path: '/reagent/log', query: { boxId } });
        },
        // 跳转到试剂详情页面
        async routeToDetailReagent() {
            let boxId = this.boxId;
            this.$router.push({ path: '/reagent/detail', query: { boxId } });
        }
    }
};
</script>

<style scoped></style>
