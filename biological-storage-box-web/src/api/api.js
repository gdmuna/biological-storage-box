import auth from '@/api/auth';
import box from '@/api/box';
import boxImage from '@/api/boxImage';
import boxLog from '@/api/boxLog';
import feedback from '@/api/feedback';
import file from '@/api/file';
import org from '@/api/org';
import orgUser from '@/api/orgUser';
import reagent from '@/api/reagent';
import user from '@/api/user';
import root from '@/api/root';
import boxAlias from '@/api/boxAlias';

import notify from '@/api/notify';

// 注入所有 api 模块到 Vue 实例
export default {
    install(app) {
        app.config.globalProperties.$api = {
            auth,
            box,
            boxImage,
            boxLog,
            feedback,
            file,
            org,
            orgUser,
            reagent,
            user,
            notify,
            root,
            boxAlias
        };
    }
};
