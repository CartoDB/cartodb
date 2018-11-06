import Vue from 'vue';
import Router from 'vue-router';

import store from 'new-dashboard/store';

// Pages
import Home from 'new-dashboard/pages/Home';
import Solutions from 'new-dashboard/pages/Solutions';
import Maps from 'new-dashboard/pages/Maps';
import Data from 'new-dashboard/pages/Data';
import { isAllowed } from '../core/filters';

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
      },
      beforeEnter: function (to, from, next) {
        store.dispatch('maps/featuredFavoritedMaps/fetchMaps');
        next();
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
      },
      beforeEnter: function (to, from, next) {
        store.dispatch('maps/fetchMaps');
        next();
      }
    },
    {
      path: '/datasets/:filter?',
      name: 'datasets',
      component: Data,
      meta: {
        title: () => 'Data | CARTO'
      },
      beforeEnter: checkNavigation('datasets')
    }
  ]
});

router.afterEach(to => {
  Vue.nextTick(() => {
    document.title = to.meta.title(to);
  });
});

function checkNavigation (redirectionRoute) {
  return function (to, _, next) {
    const urlOptions = { ...to.params, ...to.query };

    if (urlOptions.filter && !isAllowed(urlOptions.filter)) {
      return next({ name: redirectionRoute });
    }
    store.dispatch('datasets/setURLOptions', urlOptions);
    next();
  };
}

export default router;
