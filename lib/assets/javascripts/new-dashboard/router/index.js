import Vue from 'vue';
import Router from 'vue-router';

import store from 'new-dashboard/store';

// Pages
import Home from 'new-dashboard/pages/Home';
import Solutions from 'new-dashboard/pages/Solutions';
import Maps from 'new-dashboard/pages/Maps';
import Data from 'new-dashboard/pages/Data';
import Notifications from 'new-dashboard/pages/Notifications';

// Filters
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
      path: '/maps/:filter?',
      name: 'maps',
      component: Maps,
      meta: {
        title: () => 'Maps | CARTO'
      },
      beforeEnter: checkNavigation('maps', 'maps')
    },
    {
      path: '/datasets/:filter?',
      name: 'datasets',
      component: Data,
      meta: {
        title: () => 'Data | CARTO'
      },
      beforeEnter: checkNavigation('datasets', 'datasets')
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: Notifications,
      meta: {
        title: () => 'Notifications | CARTO'
      },
      beforeEnter: fetchNotifications
    }
  ]
});

router.beforeEach((to, _, next) => {
  if (!to.matched || !to.matched.length) {
    next({ name: 'home' });
  }

  next();
});

router.afterEach(to => {
  Vue.nextTick(() => {
    document.title = to.meta.title(to);
  });
});

function checkNavigation (storeModule, redirectionRoute) {
  return function (to, _, next) {
    const urlOptions = { ...to.params, ...to.query };

    if (urlOptions.filter && !isAllowed(urlOptions.filter)) {
      return next({ name: redirectionRoute });
    }
    store.dispatch(`${storeModule}/setURLOptions`, urlOptions);
    next();
  };
}

function fetchNotifications (to, from, next) {
  store.dispatch('notifications/fetchNotifications', {
    baseUrl: store.state.user.base_url,
    userId: store.state.user.id,
    apiKey: store.state.user.api_key
  });
  next();
}

export default router;
