<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto p-6">
            <!-- 试剂盒基本信息 -->
            <v-sheet class="p-3" elevation="2" rounded>{{ boxInfo.name }}</v-sheet>
            <!-- 图片对比区域 -->
            <div class="diff aspect-[16/9]">
                <div class="diff-item-1">
                    <img alt="新增图片" :src="imageUrl1" />
                </div>
                <div class="diff-item-2">
                    <img alt="历史图片" :src="imageUrl2" />
                </div>
                <div class="diff-resizer"></div>
            </div>
            <!-- 试剂网格 -->
            <v-sheet class="mt-3 py-3 pr-3 overflow-x-scroll" elevation="2" style="border-radius: 4px 25px 4px 4px">
                <v-item-group v-model="selection" class="w-full inline-grid" multiple>
                    <div class="w-full flex justify-center">
                        <div style="width: 25px"></div>
                        <div v-for="x in boxInfo.x" :key="x" class="mx-1 flex items-center justify-center" style="width: 25px">
                            {{ x }}
                        </div>
                    </div>
                    <div v-for="y in boxInfo.y" :key="y" class="w-full flex justify-center">
                        <div class="my-1 flex items-center justify-center" style="width: 25px; height: 25px">
                            {{ y }}
                        </div>
                        <div v-for="x in boxInfo.x" :key="x">
                            <v-item v-slot="{ isSelected, toggle }">
                                <v-card :color="cardColor(y, x, isSelected)" class="m-1" width="25" height="25" @click="handleCellClick(y, x, toggle)"></v-card>
                            </v-item>
                        </div>
                    </div>
                </v-item-group>
            </v-sheet>
            <!-- 操作按钮区域 -->
            <v-sheet class="mt-3 p-3" elevation="2" rounded>
                <div class="flex justify-around">
                    <div>
                        <v-btn variant="flat" :color="activeMode === 'single' ? 'teal-lighten-1' : 'grey-lighten-1'" :disabled="activeMode === 'single'" @click="singleOperation()">单操作</v-btn>
                        <v-btn class="ml-2" variant="flat" :color="activeMode === 'multiple' ? 'teal-lighten-1' : 'grey-lighten-1'" :disabled="activeMode === 'multiple'" @click="multipleOperations()">多操作</v-btn>
                        <v-btn v-if="activeMode === 'multiple' && selection.length > 0" class="ml-2" variant="flat" color="teal-lighten-1" @click="showMultiActionDialog">OK</v-btn>
                    </div>
                    <v-btn variant="flat" color="teal-darken-2" @click="routeToDetailBox()">详情</v-btn>
                </div>
            </v-sheet>
            <v-fab icon="mdi-plus" class="mb-6" location="bottom end" size="60" absolute app appear @click="routeToUploadImage()"></v-fab>
        </div>
        <!-- 单操作对话框 -->
        <v-dialog v-model="singleChoice" max-width="500px">
            <v-card>
                <v-card-title>单操作</v-card-title>
                <v-card-text>
                    <p class="mb-3">选中的格子坐标: ({{ selectedCell.y }}, {{ selectedCell.x }})</p>
                    <v-text-field v-model="selectedReagent.name" label="试剂名称" outlined dense readonly></v-text-field>
                    <v-text-field v-model="selectedReagent.remark" label="备注" outlined dense readonly></v-text-field>
                </v-card-text>
                <v-card-actions>
                    <v-btn color="teal-lighten-1" @click="routeToDetailReagent()">详情</v-btn>
                    <v-btn color="teal-lighten-1" @click="singleChoiceChange = true">更改</v-btn>
                    <v-btn color="teal-lighten-1" @click="showDeleteDialog()">删除</v-btn>
                    <v-btn color="teal-lighten-1" @click="singleChoice = false">关闭</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <!-- 单操作更改对话框 -->
        <v-dialog v-model="singleChoiceChange" max-width="500px">
            <v-card>
                <v-card-title>单操作</v-card-title>
                <v-card-text>
                    <p class="mb-3">选中的格子坐标: ({{ selectedCell.y }}, {{ selectedCell.x }})</p>
                    <v-text-field v-model="selectedReagent.name" label="试剂名称"></v-text-field>
                    <v-text-field v-model="selectedReagent.remark" label="备注"></v-text-field>
                </v-card-text>
                <v-card-actions>
                    <v-btn color="teal-lighten-1" :loading="loading" @click="update()">更改</v-btn>
                    <v-btn color="teal-lighten-1" @click="close()">关闭</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <!-- 单操作新增对话框 -->
        <v-dialog v-model="singleChoiceNoReagent" max-width="500px">
            <v-card>
                <v-card-title>单操作</v-card-title>
                <v-card-text>
                    <p class="mb-3">选中的格子坐标: ({{ selectedCell.y }}, {{ selectedCell.x }})</p>
                    <v-text-field v-model="newReagent.name" label="试剂名称" outlined dense></v-text-field>
                    <v-text-field v-model="newReagent.remark" label="备注" outlined dense></v-text-field>
                </v-card-text>
                <v-card-actions>
                    <v-btn color="teal-lighten-1" :loading="loading" @click="save()">保存</v-btn>
                    <v-btn color="teal-lighten-1" @click="close()">关闭</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <!-- 删除确认对话框 -->
        <v-dialog v-model="deleteDialog" max-width="500px">
            <v-card title="确认删除">
                <v-card-actions class="ml-2">
                    <v-btn class="basis-1/2" variant="flat" color="light-green-lighten-1" :loading="loading" @click="deleteReagent()">确认</v-btn>
                    <v-btn class="basis-1/2" variant="flat" color="light-green-lighten-4" @click="cancelDelete()">取消</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <!-- 多操作确认对话框 -->
        <v-dialog v-model="multiActionDialog" max-width="500px">
            <v-card>
                <v-card-title>请选择操作类型</v-card-title>
                <v-card-actions class="d-flex justify-center px-5">
                    <v-btn class="basis-1/3" variant="flat" color="light-green-lighten-1" @click="handleBatchOperation('update')">批量更改</v-btn>
                    <v-btn class="basis-1/3" variant="flat" color="light-green-lighten-1" @click="deleteDialogmore = true">批量删除</v-btn>
                    <v-btn class="basis-1/3" variant="flat" color="light-green-lighten-4" @click="multiActionDialog = false">取消</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <!-- 多操作删除确认对话框 -->
        <v-dialog v-model="deleteDialogmore" max-width="500px">
            <v-card title="确认删除">
                <v-card-actions class="ml-2">
                    <v-btn class="basis-1/2" variant="flat" color="light-green-lighten-1" :loading="loading" @click="handleBatchOperation('delete')">确认</v-btn>
                    <v-btn class="basis-1/2" variant="flat" color="light-green-lighten-4" @click="cancelDelete()">取消</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <!-- 批量修改对话框 -->
        <v-dialog v-model="batchUpdateDialog" max-width="500px">
            <v-card>
                <v-card-title>批量修改试剂信息</v-card-title>
                <v-card-text>
                    <v-text-field v-model="batchData.name" label="试剂名称"></v-text-field>
                    <v-text-field v-model="batchData.remark" label="备注信息"></v-text-field>
                </v-card-text>
                <v-card-actions>
                    <v-btn color="teal-lighten-1" @click="submitBatchUpdate">提交</v-btn>
                    <v-btn color="grey" @click="batchUpdateDialog = false">取消</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
export default {
    name: 'ManageReagentPage',
    components: {},
    data() {
        return {
            loading: false,
            boxId: null,
            boxInfo: {},
            reagentList: [],
            selection: [], // 选中的网格项
            imageUrl1: '',
            imageUrl2: '',
            singleChoice: false, // 单操作对话框显示状态
            singleChoiceChange: false, // 单操作更改对话框显示状态
            singleChoiceNoReagent: false, // 单操作新增对话框显示状态
            selectedCell: { x: null, y: null }, // 选中的网格坐标
            selectedReagent: {}, // 选中的试剂信息
            activeMode: 'single', // 当前操作模式
            deleteDialog: false, // 删除确认对话框显示状态
            newReagent: {
                name: '',
                remark: ''
            },
            multiActionDialog: false, // 多操作对话框显示状态
            batchUpdateDialog: false, // 批量修改对话框显示状态
            batchData: { name: '', remark: '' },
            selectedReagents: [], // 选中的试剂列表
            deleteDialogmore: false // 多操作删除确认对话框显示状态
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
        }
    },
    async created() {
        // 从路由中获取 boxId
        this.boxId = this.$route.query.boxId;
        await this.getBoxInfo(this.boxId);
        await this.getReagentList(this.boxId);
        this.getBoxImageUrl(this.boxId);
        this.singleOperation();
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
        // 切换到单操作模式
        singleOperation() {
            this.activeMode = 'single';
            this.selection = [];
        },
        // 切换到多操作模式
        multipleOperations() {
            this.activeMode = 'multiple';
        },
        // 处理网格单元格点击事件
        handleCellClick(y, x, toggle) {
            if (this.activeMode === 'single') {
                const index = (y - 1) * this.boxInfo.x + x - 1;
                this.selection = [index];
                this.selectedCell = { x, y };
                this.selectedReagent = this.reagentList[index];
                if (this.selectedReagent.isEmpty === 1) {
                    this.singleChoiceNoReagent = true;
                } else {
                    this.singleChoice = true;
                }
            } else if (this.activeMode === 'multiple') {
                toggle();
            }
        },
        // 跳转到试剂盒详情页
        routeToDetailBox() {
            this.$router.push({ path: '/box/detail', query: { boxId: this.boxId } });
        },
        // 跳转到试剂详情页
        routeToDetailReagent() {
            const reagentId = this.selectedReagent.id;
            this.$router.push({ path: '/reagent/detail', query: { boxId: this.boxId, reagentId } });
        },
        // 跳转到上传图片页
        routeToUploadImage() {
            this.$router.push({ path: '/reagent/upload', query: { boxId: this.boxId } });
        },
        // 更新试剂信息
        async update() {
            this.loading = true;
            const orgId = this.$store.user.currentOrg;
            const payload = [
                {
                    boxId: this.boxId,
                    id: this.selectedReagent.id,
                    name: this.selectedReagent.name,
                    operateType: 2,
                    remark: this.selectedReagent.remark,
                    x: this.selectedCell.x,
                    y: this.selectedCell.y
                }
            ];
            try {
                const result = await this.$api.reagent.update(payload, { boxID: this.boxId, orgID: orgId });
                if (result === '操作完成') {
                    await this.getReagentList(this.boxId);
                    this.$api.notify.success('更新成功');
                    this.selection = [];
                    this.close();
                } else {
                    this.$api.notify.error('更新失败，请重试');
                }
            } catch (error) {
                this.$api.notify.error('更新失败，请重试');
            } finally {
                this.loading = false;
            }
        },
        // 保存新增试剂信息
        async save() {
            this.loading = true;
            const orgId = this.$store.user.currentOrg;
            const payload = [
                {
                    boxId: this.boxId,
                    id: this.selectedReagent.id,
                    name: this.newReagent.name,
                    operateType: 1,
                    remark: this.newReagent.remark,
                    x: this.selectedCell.x,
                    y: this.selectedCell.y
                }
            ];
            try {
                const result = await this.$api.reagent.update(payload, { boxID: this.boxId, orgID: orgId });
                if (result === '操作完成') {
                    await this.getReagentList(this.boxId);
                    this.$api.notify.success('新增成功');
                    this.selection = [];
                    this.close();
                } else {
                    this.$api.notify.error('新增失败，请重试');
                }
            } catch (error) {
                this.$api.notify.error('新增失败，请重试');
            } finally {
                this.loading = false;
            }
        },
        // 显示删除确认对话框
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        // 执行删除试剂操作
        async deleteReagent() {
            this.loading = true;
            const orgId = this.$store.user.currentOrg;
            const payload = [
                {
                    boxId: this.boxId,
                    id: this.selectedReagent.id,
                    name: this.selectedReagent.name,
                    operateType: 3,
                    remark: this.selectedReagent.remark,
                    x: this.selectedCell.x,
                    y: this.selectedCell.y
                }
            ];
            try {
                const result = await this.$api.reagent.update(payload, { boxID: this.boxId, orgID: orgId });
                if (result === '操作完成') {
                    await this.getReagentList(this.boxId);
                    this.$api.notify.success('删除成功');
                    this.selection = [];
                    this.close();
                    this.cancelDelete();
                } else {
                    this.$api.notify.error('删除失败，请重试');
                }
            } catch (error) {
                this.$api.notify.error('删除失败，请重试');
            } finally {
                this.loading = false;
            }
        },
        // 取消删除操作
        cancelDelete() {
            this.deleteDialog = false;
            this.deleteDialogmore = false;
        },
        // 关闭对话框
        close() {
            this.singleChoice = false;
            this.singleChoiceChange = false;
            this.singleChoiceNoReagent = false;
            this.newReagent = { name: '', remark: '' };
        },
        // 显示多操作对话框
        showMultiActionDialog() {
            this.selectedReagents = this.selection.map((index) => this.reagentList[index]);
            this.multiActionDialog = true;
        },
        // 处理批量操作
        handleBatchOperation(actionType) {
            this.multiActionDialog = false;
            if (actionType === 'delete') {
                this.deleteMultipleReagents();
            } else if (actionType === 'update') {
                this.batchUpdateDialog = true;
            }
        },
        // 批量删除试剂
        async deleteMultipleReagents() {
            this.loading = true;
            const orgId = this.$store.user.currentOrg;
            const validReagents = this.selectedReagents.filter((reagent) => reagent.isEmpty === 0);
            if (validReagents.length === 0) {
                this.$api.notify.warning('选中的试剂中无有效可删除项');
                this.loading = false;
                return;
            }
            const payload = validReagents.map((reagent) => ({
                boxId: this.boxId,
                id: reagent.id,
                operateType: 3,
                x: reagent.x,
                y: reagent.y
            }));
            try {
                const result = await this.$api.reagent.update(payload, {
                    boxID: this.boxId,
                    orgID: orgId
                });
                if (result === '操作完成') {
                    await this.getReagentList(this.boxId);
                    this.$api.notify.success(`成功删除${validReagents.length}项`);
                    this.selection = [];
                    this.deleteDialogmore = false;
                }
            } catch (error) {
                this.$api.notify.error('删除失败: ' + error.message);
            } finally {
                this.loading = false;
            }
        },
        // 提交批量更新
        async submitBatchUpdate() {
            this.loading = true;
            const orgId = this.$store.user.currentOrg;
            // 处理两种操作类型
            const payload = this.selectedReagents.map((reagent) => {
                // 判断是否是新增操作（当前为空位且输入了名称）
                const isNew = reagent.isEmpty === 1 && this.batchData.name?.trim();
                return {
                    boxId: this.boxId,
                    id: reagent.id,
                    name: isNew ? this.batchData.name : this.batchData.name || reagent.name,
                    remark: this.batchData.remark || reagent.remark,
                    operateType: isNew ? 1 : 2, // 动态设置操作类型
                    x: reagent.x,
                    y: reagent.y
                };
            });
            // 过滤有效操作（排除空更新）
            const validPayload = payload.filter((item) => {
                // 新增操作必须要有名称
                if (item.operateType === 1 && !item.name?.trim()) return false;
                // 更新操作至少有一个修改项
                if (item.operateType === 2) {
                    return this.batchData.name !== undefined || this.batchData.remark !== undefined;
                }
                return true;
            });
            try {
                const result = await this.$api.reagent.update(validPayload, {
                    boxID: this.boxId,
                    orgID: orgId
                });
                if (result === '操作完成') {
                    await this.getReagentList(this.boxId);
                    const newCount = validPayload.filter((i) => i.operateType === 1).length;
                    const updateCount = validPayload.length - newCount;
                    let msg = [];
                    if (newCount) msg.push(`新增${newCount}项`);
                    if (updateCount) msg.push(`更新${updateCount}项`);
                    this.$api.notify.success(msg.join('，'));
                    this.batchUpdateDialog = false;
                    this.batchData = { name: '', remark: '' };
                    this.selection = [];
                }
            } catch (error) {
                this.$api.notify.error('操作失败: ' + (error.response?.data?.message || error.message));
            } finally {
                this.loading = false;
            }
        }
    }
};
</script>

<style scoped></style>
