import authentication from '@/utils/authentication';

import request from '@/utils/request';

const auth = {
    // 用户登录
    login(data) {
        return authentication.login(data);
    },
    // 用户注册
    register(data) {
        return request.post(`/user/register`, data);
    }
};

export default auth;
