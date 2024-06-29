import request from '@/utils/request';

const moduleUrl = '/box/log';

const boxLog = {
    // 盒子操作历史记录
    list(data) {
        return request.get(`${moduleUrl}/list`, data);
    },
    // 试剂操作历史记录
    reagenList(data) {
        return request.get(`${moduleUrl}/reagen/list`, data);
    }
};

export default boxLog;
