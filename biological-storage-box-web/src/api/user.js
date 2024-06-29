import request from '@/utils/request';

const moduleUrl = '/user';

const user = {
    // 查询用户个人信息
    userInfo(data) {
        return request.get(`${moduleUrl}/info`, data);
    },
    // 搜索用户
    search(data) {
        return request.get(`${moduleUrl}/search`, data);
    },
    // 修改用户个人信息
    updateInfo(data) {
        return request.put(`${moduleUrl}/update/info`, data);
    },
    // 修改用户密码
    updatePassword(data) {
        return request.put(`${moduleUrl}/update/password`, data);
    }
};

export default user;
