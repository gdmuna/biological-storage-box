import request from '@/utils/request';

const moduleUrl = '/file';

const file = {
    // 上传文件
    upload(data) {
        return request.upload(`${moduleUrl}/upload`, data);
    }
};

export default file;
