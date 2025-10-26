import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import '@/core/assets/main.css'
import '@/core/assets/fonts/fonts.css'

createApp(App)
  .use(router)
  .mount('#app')
