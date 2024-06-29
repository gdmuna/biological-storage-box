import request from '@/utils/request';

const moduleUrl = '/feedback';

const feedback = {
    // 新增
    add(data) {
        return request.post(`${moduleUrl}/add`, data);
    }
};

export default feedback;
