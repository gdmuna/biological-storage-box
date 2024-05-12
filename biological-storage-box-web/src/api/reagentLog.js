import request from '@/utils/request';

const moduleUrl = '/reagent/log';

const reagentLog = {
    // 日志列表-盒子
    Box(data) {
        return request.post(`${moduleUrl}/box`, data);
    },
    // 日志列表-记录
    List(data) {
        return request.get(`${moduleUrl}/list`, data);
    }
};

export default reagentLog;
