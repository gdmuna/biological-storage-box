import request from '@/utils/request';

const moduleUrl = '/org/user';
// 组织 = 课题组
const orgUser = {
    // 申请加入组织
    apply(data, query) {
        return request.put(`${moduleUrl}/apply`, data, query);
    },
    // 同意申请
    applyAc(data, query) {
        return request.put(`${moduleUrl}/apply/ac`, data, query);
    }, // 查看申请加入组织信息
    applyMs(data) {
        return request.get(`${moduleUrl}/apply/ms`, data);
    },
    // 将成员踢出组织
    del(data) {
        return request.delete(`${moduleUrl}/del`, data);
    },
    // 邀请用户加入组织
    invite(data, query) {
        return request.put(`${moduleUrl}/invite`, data, query);
    },
    // 同意加入组织
    inviteAc(data, query) {
        return request.put(`${moduleUrl}/invite/ac`, data, query);
    }, // 查看邀请加入组织信息
    inviteMs(data) {
        return request.get(`${moduleUrl}/invite/ms`, data);
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

export default orgUser;
