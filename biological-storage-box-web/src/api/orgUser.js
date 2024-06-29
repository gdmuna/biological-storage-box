import request from '@/utils/request';

const moduleUrl = '/org/user';
// 组织 = 课题组
const orgBox = {
    // 将成员踢出组织
    del(data) {
        return request.delete(`${moduleUrl}/del`, data);
    },
    // 邀请用户加入组织
    invite(data) {
        return request.put(`${moduleUrl}/invite`, data);
    },
    // 用户已经加入的组织列表
    list(data) {
        return request.get(`${moduleUrl}/list`, data);
    },
    // 组织成员列表
    memberList(data) {
        return request.get(`${moduleUrl}/member/list`, data);
    },
    // 修改成员权限
    updateAuthority(data) {
        return request.put(`${moduleUrl}/updateAuthority`, data);
    }
};

export default orgBox;
