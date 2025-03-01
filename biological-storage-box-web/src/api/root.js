import request from '@/utils/request';

const moduleUrl = '/root';

const root = {
    // 用户创建房间
    add(data, query) {
        return request.post(`${moduleUrl}/add`, data, query);
    },
    // 用户删除房间
    del(data, query) {
        return request.delete(`${moduleUrl}/del`, data, query);
    },
    // 获取用户组织下的房间列表
    list(data) {
        return request.get(`${moduleUrl}/list`, data);
    },
    // 获取用户房间信息
    one(data) {
        return request.get(`${moduleUrl}/one`, data);
    },
    // 用户更改房间信息
    update(data, query) {
        return request.put(`${moduleUrl}/update`, data, query);
    }
};

export default root;
