<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <v-card class="w-full mx-auto px-10">
                <v-form class="w-full max-w-sm mx-auto py-16" @submit.prevent="boxAdd">
                    <v-text-field v-model="name" label="试剂盒名称" :rules="[rules.notNull]" clearable></v-text-field>
                    <v-text-field v-model="nickName1" label="简称1" :rules="[rules.notNull]" clearable></v-text-field>
                    <v-text-field v-model="nickName2" label="简称2" :rules="[rules.notNull]" clearable></v-text-field>
                    <div class="mb-3">
                        <div>
                            <div v-if="selectedX && selectedY" class="text-body-2 text-grey-darken-2">当前尺寸：{{ selectedX }} × {{ selectedY }}</div>
                            <div
                                @mouseleave="
                                    hoverX = null;
                                    hoverY = null;
                                ">
                                <div v-for="row in 10" :key="row" class="flex w-full justify-center">
                                    <div
                                        v-for="col in 10"
                                        :key="col"
                                        class="grid-cell"
                                        :class="{
                                            'active': (hoverX >= col || selectedX >= col) && (hoverY >= row || selectedY >= row),
                                            'selected': selectedX >= col && selectedY >= row,
                                            'rounded-sm': $vuetify.display.smAndUp
                                        }"
                                        @mouseover="
                                            hoverX = col;
                                            hoverY = row;
                                        "
                                        @click="selectSize(col, row)"></div>
                                </div>
                                <div class="text-caption text-grey-darken-1 mb-1 text-right">（最大10×10）</div>
                            </div>
                        </div>
                    </div>
                    <v-textarea v-model="introduce" label="试剂盒介绍" clearable></v-textarea>
                    <v-btn class="mt-4" type="submit" block :loading="loading" :disabled="!btnAllowClick">创建</v-btn>
                </v-form>
            </v-card>
        </div>
    </div>

    <!-- 弹窗提示是否使用上次的信息 -->
    <v-dialog v-model="dialog" max-width="500px">
        <v-card>
            <v-card-title>使用上次的试剂盒信息?</v-card-title>
            <v-card-actions>
                <v-btn variant="flat" color="green" @click="useLastInfo">使用</v-btn>
                <v-btn variant="flat" color="red" @click="cancelUseLastInfo">取消</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    name: 'CreateBoxPage',
    components: {},
    data() {
        return {
            name: null,
            nickName1: '这里是简称1',
            nickName2: '这里是简称2',
            introduce: null,
            x: null,
            y: null,
            loading: false,
            dialog: false,
            selectedX: null,
            selectedY: null,
            hoverX: null,
            hoverY: null,
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
            return this.selectedX && this.selectedY && this.name;
        }
    },
    created() {
        // 检查是否有上次保存的试剂盒信息
        const savedBoxInfo = localStorage.getItem('lastBoxInfo');
        if (savedBoxInfo) {
            // 如果有，则弹窗询问是否使用上次信息
            this.dialog = true;
        }
    },
    mounted() {},
    updated() {},
    methods: {
        async selectSize(x, y) {
            this.selectedX = x;
            this.selectedY = y;
            // 同时更新x,y值用于表单提交
            this.x = x;
            this.y = y;
        },
        async boxAdd() {
            this.loading = true;
            const currentOrg = this.$store.user.currentOrg;
            const result = await this.$api.box.add(
                {
                    name: this.name,
                    introduce: this.introduce,
                    x: this.x,
                    y: this.y
                },
                {
                    orgID: currentOrg
                }
            );
            console.log(result);
            if (result === 1) {
                this.$api.notify.success('创建成功');
                this.$router.push('/box');
                // 保存试剂盒信息到本地缓存
                const boxInfo = {
                    name: this.name,
                    introduce: this.introduce,
                    x: this.x,
                    y: this.y
                };
                localStorage.setItem('lastBoxInfo', JSON.stringify(boxInfo));
            } else {
                this.loading = false;
                this.$api.notify.error('创建失败，请重试');
            }
        },
        // 使用上次的信息填充表单
        useLastInfo() {
            const savedBoxInfo = localStorage.getItem('lastBoxInfo');
            if (savedBoxInfo) {
                const boxInfo = JSON.parse(savedBoxInfo);
                this.name = boxInfo.name;
                this.introduce = boxInfo.introduce;
                this.x = boxInfo.x;
                this.y = boxInfo.y;
            }
            this.dialog = false; // 关闭弹窗
        },
        // 取消使用上次的信息
        cancelUseLastInfo() {
            this.dialog = false; // 关闭弹窗
        }
    }
};
</script>

<style scoped>
.grid-cell {
    width: 10px;
    height: 10px;
    border: 3px solid rgba(0, 0, 0, 0.08);
    margin: 0.5px;
    border-radius: 5px;
    cursor: pointer;
    transition:
        background-color 0.2s ease-in-out,
        border-color 0.2s ease-in-out;
}

.grid-cell:hover {
    background: #9ccc65 !important;
}

.grid-cell.selected {
    background: #9ccc65 !important;
    border-color: rgba(0, 0, 0, 0.08);
    box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.1);
}

@media (max-width: 600px) {
    .grid-cell {
        width: 24px;
        height: 24px;
    }
}
</style>
