import auth from '@/api/auth';
import box from '@/api/box';
import common from '@/api/common';
import org from '@/api/org';
import orgBox from '@/api/orgBox';
import reagent from '@/api/reagent';
import reagentLog from '@/api/reagentLog';
import searcher from '@/api/searcher';
import user from '@/api/user';

// 注入所有 api 模块到 Vue 实例
export default {
    install(app) {
        app.config.globalProperties.$api = {
            auth,
            box,
            common,
            org,
            orgBox,
            reagent,
            reagentLog,
            searcher,
            user
        };
    }
};
