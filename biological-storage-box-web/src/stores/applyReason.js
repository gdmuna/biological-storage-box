import { defineStore } from 'pinia';

export const applyReasonStore = defineStore('applyReasonStore', {
    state: () => ({
        applicant: null,
        applyReason: null,
        applicantId: null
    })
});
