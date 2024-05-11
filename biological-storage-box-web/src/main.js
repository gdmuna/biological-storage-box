// Vue
import { createApp } from 'vue';

// Vue-Router
import router from '@/router';

// Pinia
import { createPinia } from 'pinia';

// Vuetify
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

// global styles
import '@/style.css';

import App from '@/App.vue';

const pinia = createPinia();
const vuetify = createVuetify({
    components,
    directives
});

const app = createApp(App).use(router).use(pinia).use(vuetify).mount('#app');
