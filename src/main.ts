import { createApp } from 'vue'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router/index.ts'
import { createPinia } from 'pinia';
import Core from './core/index.ts'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import '@/assets/global.less'
import { LazyLoad } from '@/directives/lazyload.ts'


const app = createApp(App);
app.use(router);

app.directive('lazyload', LazyLoad);

const pinia = createPinia();
app.use(pinia);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

app.mount('#app');
const core = new Core();

core.render();
