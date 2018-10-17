import Vue from 'vue';
import Router from 'vue-router';
import HelloWorld from 'new-dashboard/components/HelloWorld';

Vue.use(Router);

function getRouterPrefix (userBaseURL) {
  return userBaseURL.replace(location.origin, '');
}

const dashboardBaseURL = '/dashboard';
const baseRouterPrefix = `${getRouterPrefix(window.CartoConfig.data.user_data.base_url)}${dashboardBaseURL}`;

export default new Router({
  base: baseRouterPrefix,
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'HelloWorld',
      component: HelloWorld
    }
  ]
});
