<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <v-card class="w-full mx-auto px-10 py-13">
                <v-form @submit.prevent="add">
                    <!-- 反馈类型 -->
                    <v-select v-model="type" label="反馈类型" :items="feedbackType" variant="solo" :rules="[rules.notNull]"></v-select>
                    <!-- 反馈内容 -->
                    <v-textarea v-model="content" label="反馈内容" :rules="[rules.notNull]"></v-textarea>
                    <!-- 联系方式 -->
                    <v-text-field v-model="contact" label="邮箱" :rules="[rules.notNull]"></v-text-field>
                    <!-- 图片上传 -->
                    <file-pond ref="filepond" name="filepond" :allow-multiple="true" label-idle="点击此处选择图片" accepted-file-types="image/jpeg, image/png" instant-upload="false" :files="inspectionFiles" @init="handleFilePondInit" />
                    <!-- 文字注释 -->
                    <div style="margin-top: 8px">
                        <small style="color: lightgrey" display:block>由于经费限制，我们使用了成本较低的服务器，这可能导致上传速度较慢。感谢您的理解和支持。</small>
                    </div>
                    <!-- 提交按钮 -->
                    <v-btn :loading="loading" class="mt-4" type="submit" block :disabled="!submit">创建</v-btn>
                </v-form>
            </v-card>
        </div>
    </div>
</template>

<script>
import vueFilePond from 'vue-filepond';
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
// 引入uuidv7的包
import { v7 as uuidv7 } from 'uuid';

export default {
    name: 'FeedbackPage',
    components: {
        FilePond: vueFilePond(FilePondPluginFileValidateType, FilePondPluginImagePreview)
    },
    data() {
        return {
            feedbackType: [
                { title: 'bug', value: 1 },
                { title: '功能想法', value: 2 },
                { title: '建议', value: 3 }
            ],
            type: null,
            content: null,
            contact: null,
            imgUrl: null,
            imgUrls: [],
            rules: {
                notNull: (value) => {
                    if (value) return true;
                    return '此处不能为空';
                }
            },
            inspectionFiles: [],
            loading: false
        };
    },
    computed: {
        // 提交按钮是否可点击
        submit() {
            const firstValue = this.rules.notNull(this.type);
            const secondeValue = this.rules.notNull(this.content);
            const thirdValue = this.rules.notNull(this.contact);
            if (firstValue === true && secondeValue === true && thirdValue === true) {
                return true;
            } else {
                return false;
            }
        }
    },
    created() {
        this.user = this.$store.user;
    },
    mounted() {},
    updated() {},
    methods: {
        // 初始化图片上传控件
        handleFilePondInit() {
            console.log('FilePond has initialized');
        },
        // 提交反馈
        async add() {
            // 设置加载状态
            this.loading = true;
            // 从组件中获取图片文件
            const filepond = this.$refs.filepond.getFiles();
            // 遍历图片文件
            for (let i = 0; i < filepond.length; i++) {
                // 生成图片名称
                const fileName = `${uuidv7()}.${filepond[i].fileExtension}`;
                // 创建FormData对象并组装图片上传数据
                let formData = new FormData();
                formData.append('file', filepond[i].file, fileName);
                formData.append('file_name', '/opinion/' + fileName);
                this.imgUrl = await this.$api.file.upload(formData);
                this.imgUrls.push(this.imgUrl);
            }
            // 将图片地址数组转换为字符串
            this.imgUrls = this.imgUrls.join(',');
            // 调用接口提交反馈
            if (this.imgUrls) {
                const result = await this.$api.feedback.add({
                    content: this.content,
                    email: this.contact,
                    imageList: this.imgUrls,
                    type: this.type
                });
                if (result === '已经收到反馈') {
                    // 上传成功后返回上一页
                    this.$router.go(-1);
                    this.$api.notify.success('已经收到反馈');
                } else {
                    this.loading = false;
                    this.$api.notify.error('反馈失败，请重试');
                }
            } else {
                this.loading = false;
                this.$api.notify.error('图片上传失败，请重试');
            }
        }
    }
};
</script>

<style scoped></style>
