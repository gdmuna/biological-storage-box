import request from '@/utils/request';

const moduleUrl = '/searcher';

const searcher = {
    // 搜索试剂盒接口
    searcherBox(data) {
        return request.get(`${moduleUrl}/box`, data);
    },
    // 搜索试剂接口
    searcherReagent(data) {
        return request.get(`${moduleUrl}/reagent`, data);
    }
};

export default searcher;
