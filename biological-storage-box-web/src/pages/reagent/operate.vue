<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <div v-for="(item, index) in reagentList" :key="item.id" :class="index === 0 ? '' : 'mt-5'">
                <v-card>
                    <v-card-item>
                        <v-card-title>第{{ item.y }}行 - 第{{ item.x }}列</v-card-title>
                    </v-card-item>
                    <v-card-text>
                        <v-select v-model="item.operateType" label="操作" density="compact" :items="operateOptions" :bg-color="operateColor[item.operateType - 1]"></v-select>
                        <v-text-field v-model="item.name" label="试剂名称" density="compact" variant="outlined" :disabled="item.operateType === 3"></v-text-field>
                        <v-textarea v-model="item.remark" label="备注" density="compact" variant="outlined" :disabled="item.operateType === 3" rows="2" auto-grow></v-textarea>
                    </v-card-text>
                </v-card>
            </div>
            <v-btn class="mt-10" block :loading="loading" @click="summit()">提交</v-btn>
        </div>
    </div>
</template>

<script>
import box from '../../api/box';

export default {
    name: 'OperateReagentPage',
    components: {},
    data() {
        return {
            reagentList: [],
            operateOptions: [
                { title: '新增', value: 1 },
                { title: '更新', value: 2 },
                { title: '删除', value: 3 }
            ],
            operateColor: {
                0: 'cyan-lighten-1',
                1: 'teal-lighten-3',
                2: 'orange-lighten-1'
            },
            boxId: null,
            result: null,
            loading: false
        };
    },
    created() {
        // 从 store 中获取选中的试剂网格的信息
        const reagentList = this.$store.reagent.selection;
        // 根据 isEmpty 的值为 operateList 的每一项新增 operateType 属性
        this.reagentList = reagentList.map((item) => {
            item.operateType = item.isEmpty === 0 ? 3 : 1;
            return item;
        });
    },
    mounted() {},
    updated() {},
    methods: {
        async summit() {
            this.loading = true;
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
                this.boxId = item.boxId;
                return item;
            });
            const orgId = this.$store.user.currentOrg;
            // 循环向后端发送提交请求
            for (let i = 0; i < reagentList.length; i++) {
                const item = reagentList[i];
                this.result = await this.$api.reagent.update([item], {
                    boxID: this.boxId,
                    orgID: orgId
                });
            }
            // 判断是否提交成功
            if (this.result === '操作完成') {
                // 上传成功后返回上一页
                this.$router.go(-1);
                this.$api.notify.success('更新成功');
            } else {
                this.loading = false;
                this.$api.notify.error('更新失败，请重试');
            }
        }
    }
};
</script>

<style scoped></style>
