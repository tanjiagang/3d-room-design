import { createApp } from 'vue'
// import ElementPlus from 'element-plus'
// import 'element-plus/dist/index.css'
import App from './App.vue'
import router from '@/router'
import { createPinia } from 'pinia';



const app = createApp(App);
app.use(router);

const pinia = createPinia();
app.use(pinia);

// app.use(ElementPlus);

app.mount('#app');
