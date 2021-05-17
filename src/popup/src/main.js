import Vue from 'vue';
import App from './App.vue';
import router from './router';
import Messager from '../../common/scripts/messager';
import { MESSAGER_SENDER } from '../../common/modal/index';

Vue.config.productionTip = false;
Vue.prototype.$Messager = new Messager(MESSAGER_SENDER.POPUP);

new Vue({
  router,
  render: (h) => h(App),
}).$mount('#app');
