import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
    const sidebarCollapsed = ref(false);

    function toggleSidebar() {
        sidebarCollapsed.value = !sidebarCollapsed.value;
    }

    return { sidebarCollapsed, toggleSidebar };
});
