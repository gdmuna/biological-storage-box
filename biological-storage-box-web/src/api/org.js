import request from '@/utils/request';

const moduleUrl = '/org';
// 组织 = 课题组
const org = {
    // 创建组织
    add(data) {
        return request.post(`${moduleUrl}/create`, data);
    },
    // 删除组织
    del(data, query) {
        return request.delete(`${moduleUrl}/del`, data, query);
    },
    // 用户加入的组织
    list(data) {
        return request.get(`${moduleUrl}/list`, data);
    },
    // 单个组织
    one(data) {
        return request.get(`${moduleUrl}/one`, data);
    },
    // 搜索组织
    search(data) {
        return request.get(`${moduleUrl}/search`, data);
    },
    // 修改组织
    update(data) {
        return request.put(`${moduleUrl}/update`, data);
    }
};

export default org;
