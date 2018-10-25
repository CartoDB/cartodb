import Vue from 'vue';
import Router from 'vue-router';

// Pages
import Home from 'new-dashboard/pages/Home';
import Solutions from 'new-dashboard/pages/Solutions';
import Maps from 'new-dashboard/pages/Maps';
import Data from 'new-dashboard/pages/Data';

Vue.use(Router);

function getURLPrefix (userBaseURL) {
  return userBaseURL.replace(location.origin, '');
}

const dashboardBaseURL = '/dashboard';
const baseRouterPrefix = `${getURLPrefix(window.CartoConfig.data.user_data.base_url)}${dashboardBaseURL}`;

const router = new Router({
  base: baseRouterPrefix,
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: {
        title: () => 'Home | CARTO'
      }
    },
    {
      path: '/solutions',
      name: 'solutions',
      component: Solutions,
      meta: {
        title: () => 'Solutions | CARTO'
      }
    },
    {
      path: '/visualizations',
      name: 'maps',
      component: Maps,
      meta: {
        title: () => 'Maps | CARTO'
      }
    },
    {
      path: '/tables',
      name: 'data',
      component: Data,
      meta: {
        title: () => 'Data | CARTO'
      }
    }
  ]
});

router.afterEach(to => {
  Vue.nextTick(() => {
    document.title = to.meta.title(to);
  });
});

export default router;
