import Vue from 'vue';
import VueRouter from 'vue-router';
import CustomPortrait from '../views/CustomPortrait.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'CustomPortrait',
    component: CustomPortrait,
  },
];

const router = new VueRouter({
  routes,
});

export default router;
