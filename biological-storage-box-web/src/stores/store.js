import { userStore } from '@/stores/user';
import { reagentStore } from '@/stores/reagent';
import { applyReasonStore } from '@/stores/applyReason';

// 注入所有 store 模块到 Vue 实例
export default {
    install(app) {
        app.config.globalProperties.$store = {
            user: userStore(),
            reagent: reagentStore(),
            applyReason: applyReasonStore()
        };
    }
};
