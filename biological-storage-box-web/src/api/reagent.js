import request from '@/utils/request';

const moduleUrl = '/reagent';

const reagent = {
    // 查找盒子的所有试剂
    list(data) {
        return request.get(`${moduleUrl}/list`, data);
    },
    // 批量更新试剂
    update(data) {
        return request.get(`${moduleUrl}/update`, data);
    }
};

export default reagent;
