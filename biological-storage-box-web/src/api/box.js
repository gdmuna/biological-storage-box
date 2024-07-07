import request from '@/utils/request';

const moduleUrl = '/box';

const box = {
    // 用户创建盒子
    add(data, query) {
        return request.post(`${moduleUrl}/add`, data, query);
    },
    // 用户删除盒子
    del(data) {
        return request.delete(`${moduleUrl}/del`, data);
    },
    // 获取用户组织下的盒子列表
    list(data) {
        return request.get(`${moduleUrl}/list`, data);
    },
    // 获取用户盒子信息
    one(data) {
        return request.get(`${moduleUrl}/one`, data);
    },
    // 用户更改盒子信息
    update(data) {
        return request.put(`${moduleUrl}/update`, data);
    }
};

export default box;
