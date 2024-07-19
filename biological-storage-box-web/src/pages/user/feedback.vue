<template>
    <div class="main-container">
        <div class="w-full max-w-screen-sm mx-auto px-10 py-10">
            <v-card class="w-full mx-auto px-10 py-13">
                <var-form @submit.prevent="add">
                    <!-- 反馈类型 -->
                    <v-select v-model="type" label="反馈类型" :items="['bug', '功能想法', '建议']" variant="solo" :rules="[rules.notNull]"></v-select>
                    <!-- 反馈内容 -->
                    <v-textarea v-model="content" label="反馈内容" :rules="[rules.notNull]"></v-textarea>
                    <!-- 联系方式 -->
                    <v-text-field v-model="contact" label="联系方式" :rules="[rules.notNull]"></v-text-field>
                    <!-- 图片上传 -->
                    <file-pond ref="filepond" name="filepond" :allow-multiple="true" label-idle="点击此处选择图片" accepted-file-types="image/jpeg, image/png" instant-upload="false" :files="inspectionFiles" @init="handleFilePondInit" @addfile="handleFilePondAddFile" />
                    <!-- 文字注释 -->
                    <div style="margin-top: 8px">
                        <small style="color: lightgrey" display:block>由于经费限制，我们使用了成本较低的服务器，这可能导致上传速度较慢。感谢您的理解和支持。</small>
                    </div>
                    <!-- 提交按钮 -->
                    <v-btn class="mt-4" type="submit" block :disabled="!submit">创建</v-btn>
                </var-form>
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
            type: null,
            content: null,
            contact: null,
            rules: {
                notNull: (value) => {
                    if (value) return true;
                    return '此处不能为空';
                },
                isNumber: (value) => {
                    const pattern = /^(?:[1-9][0-9]?|100)$/;
                    return pattern.test(value) || '请输入 1-100 之间的数字';
                }
            },
            imgUrl: ['暂无图片'],
            inspectionFiles: []
        };
    },
    computed: {
        // 提交按钮是否可点击
        submit() {
            const value = this.rules.notNull(this.type) && this.rules.notNull(this.content) && this.rules.notNull(this.contact);
            return value === true ? true : false;
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
        // 添加文件到图片上传控件
        async handleFilePondAddFile() {
            console.log('FilePond has added a file');
            const imgUrls = [];
            await this.upload();
            // 调用上传接口上传图片
            const response = await this.$api.file.upload(this.formData);
            // 上传成功则将图片地址存入imgUrls否则提示用户重新上传
            if (response) {
                const imgUrl = response.data.imgUrl;
                imgUrls.push(imgUrl);
            } else {
                alert('上传失败，请您再次上传');
            }
            // 所有图片上传成功后，更新图片地址
            this.imgUrl = imgUrls;
            // this.$store.setting.imgList = imgUrls;
        },
        // 图片上传
        async upload() {
            // 从组件中获取图片文件
            const filepond = this.$refs.filepond.getFiles();
            // 遍历图片文件
            for (let i = 0; i < filepond.length; i++) {
                // 获取图片文件并生成图片名称
                const file = filepond[i].file;
                const fileName = uuidv7();
                // 创建FormData对象并组装图片上传数据
                let formData = new FormData();
                formData.append('file', filepond[i].file, 'inspection.png');
                formData.append('file-name', `${fileName}.${filepond[i].fileExtension}`);
            }
        },
        // 提交反馈
        async add() {
            const result = await this.$api.feedback.add({
                type: this.type,
                content: this.content,
                contact: this.contact,
                imgUrl: this.imgUrl[0]
            });
            if (result === '操作完成') {
                this.$router.push('/work');
            }
        }
    }
};
</script>

<style scoped></style>
