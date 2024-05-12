import request from '@/utils/request';

const moduleUrl = '/org';
// 组织 = 课题组
const org = {
    // 创建组织
    add(data) {
        return request.post(`${moduleUrl}/add`, data);
    },
    // 删除组织
    del(data) {
        return request.delete(`${moduleUrl}/del`, data);
    },
    // 查看组织成员
    members(data) {
        return request.get(`${moduleUrl}/members`, data);
    },
    // 修改组织
    update(data) {
        return request.put(`${moduleUrl}/update`, data);
    },
    // 生成邀请码
    uuid(data) {
        return request.post(`${moduleUrl}/uuid`, data);
    },
    // 确定加入组织
    uuidJoin(data) {
        return request.get(`${moduleUrl}/uuid/join`, data);
    },
    // 根据邀请码查询组织详细信息
    uuidSee(data) {
        return request.get(`${moduleUrl}/uuid/see`, data);
    }
};

export default org;
