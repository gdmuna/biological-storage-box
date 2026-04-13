import request from '@/utils/request';

const moduleUrl = '/user';

const user = {
    // 向用户邮箱发送验证码
    sendEmail(data) {
        return request.get(`${moduleUrl}/email/code`, data);
    },
    // 通过邮箱验证码修改密码
    updatePasswordByCode(data) {
        return request.put(`${moduleUrl}/email/update/password`, data);
    },
    // 查询用户个人信息
    userInfo(data) {
        return request.get(`${moduleUrl}/info`, data);
    },
    // 搜索用户
    search(data) {
        return request.get(`${moduleUrl}/search`, data);
    },
    //修改邮箱
    updateEmail(data) {
        return request.put(`${moduleUrl}/update/email`, data);
    },
    // 修改用户个人信息
    updateInfo(data) {
        return request.put(`${moduleUrl}/update/info`, data);
    },
    // 修改密码
    updatePassword(data) {
        return request.put(`${moduleUrl}/update/password`, data);
    }
};

export default user;
