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
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
const vuetify = createVuetify({
    components,
    directives,
    icons: {
        defaultSet: 'mdi'
    }
});

// global styles
import '@/style.css';

// api
import api from '@/api/api';

// App Entry
import App from '@/App.vue';

const app = createApp(App).use(router).use(pinia).use(store).use(vuetify).use(api).mount('#app');
