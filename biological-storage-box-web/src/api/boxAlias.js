import request from '@/utils/request';

const moduleUrl = '/box/alias';

const boxAlias = {
    // 用户新增盒子别名
    add(data) {
        return request.post(`${moduleUrl}/add`, data);
    },
    // 用户删除盒子别名
    del(data) {
        return request.delete(`${moduleUrl}/del`, data);
    },
    // 获取用户组织下的盒子别名列表
    list(data) {
        return request.get(`${moduleUrl}/list`, data);
    },
    // 用户更改盒子别名
    update(data) {
        return request.put(`${moduleUrl}/update`, data);
    }
};

export default boxAlias;
