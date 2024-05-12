import request from '@/utils/request';

const moduleUrl = '/reagent';

const reagent = {
    // 新增样品管到盒子里
    addList(data) {
        return request.post(`${moduleUrl}/addList`, data);
    },
    // 查找盒子的全部样品管
    list(data) {
        return request.get(`${moduleUrl}/list`, data);
    },
    // 对试剂进行操作
    opera(data) {
        return request.post(`${moduleUrl}/opera`, data);
    }
};

export default reagent;
