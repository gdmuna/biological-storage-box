<template>
    <div class="main-container">
        <div class="w-full max-w-screen-md h-full mx-auto px-10 py-10">
            <v-card title="试剂盒图片上传">
                <file-pond ref="filepond" class="mx-5" name="filepond" label-idle="点击此处选择图片" accepted-file-types="image/jpeg, image/png" instant-upload="false" :files="inspectionFiles" @init="handleFilePondInit" />
                <v-card-actions class="mx-3">
                    <v-btn color="green-lighten-1" class="mt-10" block :loading="loading" @click="upload()">上传</v-btn>
                </v-card-actions>
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
    name: 'WorkBenchPage',
    components: {
        FilePond: vueFilePond(FilePondPluginFileValidateType, FilePondPluginImagePreview)
    },
    data() {
        return {
            imgUrl: '',
            loading: false,
            boxId: null
        };
    },
    async created() {
        // 从路由中获取 boxId
        this.boxId = this.$route.query.boxId;
    },
    mounted() {},
    updated() {},
    methods: {
        // 初始化图片上传控件
        handleFilePondInit() {
            console.log('FilePond has initialized');
            // FilePond instance methods are available on `this.$refs.pond`
        },
        // 图片上传
        async upload() {
            this.loading = true;
            // 从组件中获取图片
            const filepond = this.$refs.filepond.getFiles();
            // 生成图片名称
            const fileName = `${uuidv7()}.${filepond[0].fileExtension}`;
            // 创建FormData对象并组装图片上传数据
            let formData = new FormData();
            formData.append('file', filepond[0].file, fileName);
            formData.append('file_name', '/boxImg/' + fileName);
            this.imgUrl = await this.$api.file.upload(formData);
            if (this.imgUrl) {
                const orgID = this.$store.user.currentOrg;
                const res = await this.$api.boxImage.add(null, { boxID: this.boxId, orgID: orgID, url: this.imgUrl });
                if (res === '操作成功') {
                    // 上传成功后返回上一页
                    this.$router.go(-1);
                    this.$api.notify.success('上传成功');
                } else {
                    this.loading = false;
                    this.$api.notify.error('上传失败，请重试');
                }
            } else {
                this.loading = false;
                this.$api.notify.error('上传失败，请重试');
            }
        }
    }
};
</script>

<style scoped></style>
