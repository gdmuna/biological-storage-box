import request from '@/utils/request';

const moduleUrl = '/user';

const user = {
    // 查询某个用户的详细信息
    userInfo(data) {
        return request.get(`${moduleUrl}/userInfo`, data);
    },
    // 查询用户加入的组织列表
    org(data) {
        return request.get(`${moduleUrl}/org`, data);
    }
};

export default user;
