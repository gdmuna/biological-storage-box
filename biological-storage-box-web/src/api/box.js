import request from '@/utils/request';

const moduleUrl = '/box';

const box = {
    // 用户创建盒子
    add(data, query) {
        return request.post(`${moduleUrl}/add`, data, query);
    },
    // 用户删除盒子
    del(data, query) {
        return request.delete(`${moduleUrl}/del`, data, query);
    },
    // 获取用户组织下的盒子列表
    list(data) {
        return request.get(`${moduleUrl}/list`, data);
    },
    // 获取用户盒子信息
    one(data) {
        return request.get(`${moduleUrl}/one`, data);
    },
    // 获取用户房间内的盒子列表
    rootList(data) {
        return request.get(`${moduleUrl}/root/list`, data);
    },
    // 搜索盒子
    search(data) {
        return request.get(`${moduleUrl}/search`, data);
    },
    // 用户更改盒子信息
    update(data, query) {
        return request.put(`${moduleUrl}/update`, data, query);
    }
};

export default box;
