import Vue from 'vue';
import Router from 'vue-router';
import HelloWorld from 'new-dashboard/components/HelloWorld';

Vue.use(Router);

// TODO: Change to match user in URL
const user = 'jesusowner';
const prefix = `/u/${user}/dashboard`;

export default new Router({
  base: prefix,
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'HelloWorld',
      component: HelloWorld
    }
  ]
});
