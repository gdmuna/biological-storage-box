// Vue
import { createApp } from 'vue';

// Vue-Router
import router from '@/router';

// Pinia
import { createPinia } from 'pinia';
const pinia = createPinia();
import store from '@/stores/store';

// Vuetify
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
const vuetify = createVuetify({
    icons: {
        defaultSet: 'mdi'
    }
});

// App Entry
import App from '@/App.vue';

// global styles
import '@/style.css';

// api
import api from '@/api/api';

const app = createApp(App).use(router).use(pinia).use(store).use(vuetify).use(api).mount('#app');
