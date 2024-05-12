import { defineStore } from 'pinia';

export const userStore = defineStore('userStore', {
    state: () => ({
        userId: null,
        nickName: null,
        realName: null,
        avatar: null,
        currentOrg: null,
        currentRole: null
    })
});
