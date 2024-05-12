import request from '@/utils/request';

const moduleUrl = '/org/box';
// 组织 = 课题组
const orgBox = {
    // 组织创建组织
    add(data) {
        return request.post(`${moduleUrl}/add`, data);
    },
    // 组织删除组织
    del(data) {
        return request.delete(`${moduleUrl}/del`, data);
    },
    // 查询盒子列表
    list(data) {
        return request.get(`${moduleUrl}/list`, data);
    },
    // 组织修改盒子
    up(data) {
        return request.put(`${moduleUrl}/up`, data);
    }
};

export default orgBox;
