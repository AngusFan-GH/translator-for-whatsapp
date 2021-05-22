import Vue from 'vue';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import Messager from '../../common/scripts/messager';
import { MESSAGER_SENDER } from '../../common/modal/index';
import router from './router';
import App from './App.vue';
import './assets/style.scss';

Vue.config.productionTip = false;
Vue.prototype.$Messager = new Messager(MESSAGER_SENDER.POPUP);

Vue.use(ElementUI);

new Vue({
  router,
  render: (h) => h(App),
}).$mount('#app');
