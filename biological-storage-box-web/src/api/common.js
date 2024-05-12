import request from '@/utils/request';

const moduleUrl = '/common';

const common = {
    // 上传文件
    upload(data) {
        return request.post(`${moduleUrl}/upload`, data);
    }
};

export default common;
