import request from '@/utils/request';

const moduleUrl = '/box';

const box = {
    // 用户创建盒子
    add(data) {
        return request.post(`${moduleUrl}/add`, data);
    },
    // 移除用户盒子
    del(data) {
        return request.delete(`${moduleUrl}/del`, data);
    },
    // 获取用户单个盒子
    one(data) {
        return request.get(`${moduleUrl}/one`, data);
    },
    // 获取用户组织下的盒子
    org(data) {
        return request.get(`${moduleUrl}/org`, data);
    },
    // 获取用户创建的盒子
    private(data) {
        return request.get(`${moduleUrl}/private`, data);
    },
    // 修改用户单个盒子
    update(data) {
        return request.put(`${moduleUrl}/update`, data);
    }
};

export default box;
