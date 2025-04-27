import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

// import Antd from 'ant-design-vue';
import {Button, Select, Alert, Input, Checkbox, Space, Tooltip} from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';

const app = createApp(App)

app.use(Button).use(Select).use(Alert).use(Input).use(Checkbox).use(Space).use(Tooltip)
.mount('#app')


