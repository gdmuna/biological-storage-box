import authentication from '@/utils/authentication';

import request from '@/utils/request';

const auth = {
    // 用户登录
    login(data) {
        return authentication.login(data);
    },
    // 用户注册
    register(data) {
        return authentication.register(data);
    }
};

export default auth;
