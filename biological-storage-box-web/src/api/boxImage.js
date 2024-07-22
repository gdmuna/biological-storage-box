import request from '@/utils/request';

const moduleUrl = '/box/image';

const boxImage = {
    // 拍照后提交
    add(data, query) {
        return request.post(`${moduleUrl}/add`, data, query);
    },
    // 两对比图片获取
    compare(data) {
        return request.get(`${moduleUrl}/compare`, data);
    },
    // 历史拍照图片列表
    list(data) {
        return request.get(`${moduleUrl}/list`, data);
    }
};

export default boxImage;
