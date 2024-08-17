<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto p-6">
            <!-- 基本信息 -->
            <v-sheet class="p-3" elevation="2" rounded>{{ boxInfo.name }}</v-sheet>
            <div class="diff aspect-[16/9]">
                <div class="diff-item-1">
                    <img alt="daisy" :src="imageUrl1" />
                </div>
                <div class="diff-item-2">
                    <img alt="daisy" :src="imageUrl2" />
                </div>
                <div class="diff-resizer"></div>
            </div>
            <!-- 试剂网格 -->
            <v-sheet class="mt-3 p-3 overflow-x-scroll" elevation="2" rounded>
                <v-item-group v-model="selection" class="w-full inline-grid" multiple>
                    <div v-for="y in boxInfo.y" :key="y" class="w-full flex justify-center">
                        <div v-for="x in boxInfo.x" :key="x">
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
                        <v-btn variant="flat" color="teal-lighten-1" :disabled="!(selectedCount <= 1)" @click="routeToDetailReagent()">详情</v-btn>
                        <v-btn class="ml-2" variant="flat" color="teal-lighten-1" :disabled="!(selectedCount <= 1)" @click="routeToLogReagent()">日志</v-btn>
                    </div>
                    <v-btn variant="flat" color="teal-darken-2" :disabled="!(selectedCount > 0)" @click="handleOperation()">操作</v-btn>
                </div>
            </v-sheet>
            <v-fab icon="mdi-plus" class="mb-6" location="bottom end" size="60" absolute app appear @click="routeToUploadImage()"></v-fab>
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
            selection: [],
            imageUrl1: '',
            imageUrl2: ''
        };
    },
    computed: {
        // 试剂网格的颜色
        cardColor() {
            return (y, x, isSelected) => {
                const index = (y - 1) * this.boxInfo.x + x - 1;
                const reagent = this.reagentList[index];
                // 根据网格是否为空与是否被选中来设置颜色
                if (isSelected) {
                    return reagent && reagent.isEmpty == 0 ? 'orange-lighten-1' : 'cyan-lighten-1';
                } else {
                    return reagent && reagent.isEmpty == 0 ? 'light-green-lighten-1' : 'blue-grey-lighten-5';
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
        this.getBoxImageUrl(this.boxId);
    },
    mounted() {},
    updated() {},
    methods: {
        // 获取某个试剂盒的详细信息
        async getBoxInfo(boxId) {
            const orgID = this.$store.user.currentOrg;
            const result = await this.$api.box.one({ boxID: boxId, orgID: orgID });
            this.boxInfo = result;
        },
        // 获取试剂盒两张图片的 URL
        async getBoxImageUrl(boxId) {
            const orgID = this.$store.user.currentOrg;
            const result = await this.$api.boxImage.compare({ boxID: boxId, orgID: orgID });
            let baseUrl = 'https://picx.gdmuna.com/p/cheng';
            const imgUrl = '/temp/boxImg/01916102-29b1-766e-8fbf-bb031ad824b1.jpg';
            if (result[0].boxId == boxId) {
                this.imageUrl2 = baseUrl + result[0].url;
                if (result[1].boxId == boxId) {
                    this.imageUrl1 = baseUrl + result[1].url;
                } else {
                    this.imageUrl1 = baseUrl + imgUrl;
                }
            } else {
                this.imageUrl1 = baseUrl + imgUrl;
                this.imageUrl2 = baseUrl + imgUrl;
            }
        },
        // 获取某个试剂盒内的试剂列表
        async getReagentList(boxId) {
            // 初始化试剂列表
            const initialReagentList = [];
            for (let y = 1; y <= this.boxInfo.y; y++) {
                for (let x = 1; x <= this.boxInfo.x; x++) {
                    initialReagentList.push({
                        id: (y - 1) * this.boxInfo.x + x,
                        boxId: Number(boxId),
                        name: null,
                        x: x,
                        y: y,
                        remark: null,
                        updateTime: null,
                        isEmpty: 1
                    });
                }
            }
            // 合并试剂列表数据
            const orgId = this.$store.user.currentOrg;
            const result = await this.$api.reagent.list({ boxID: boxId, orgID: orgId });
            this.reagentList = initialReagentList.map((reagent) => {
                const item = result.find((item) => item.x === reagent.x && item.y === reagent.y);
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
            if (this.selectedCount == 0) {
                let boxId = this.boxId;
                this.$router.push({ path: '/box/detail', query: { boxId } });
            } else if (this.selectedCount == 1) {
                let boxId = this.boxId;
                this.$router.push({ path: '/reagent/detail', query: { boxId } });
            }
        },
        // 跳转到上传图片页面
        async routeToUploadImage() {
            let boxId = this.boxId;
            this.$router.push({ path: '/reagent/upload', query: { boxId } });
        }
    }
};
</script>

<style scoped></style>
