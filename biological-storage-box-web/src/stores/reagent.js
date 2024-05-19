import { defineStore } from 'pinia';

export const reagentStore = defineStore('reagentStore', {
    state: () => ({
        selection: []
    })
});
