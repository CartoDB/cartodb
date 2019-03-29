import Vue from 'vue';
import Router from 'vue-router';

// Pages
import Home from 'new-dashboard/pages/Home/Home';
import Solutions from 'new-dashboard/pages/Solutions';
import Maps from 'new-dashboard/pages/Maps';
import Data from 'new-dashboard/pages/Data';
import Search from 'new-dashboard/pages/Search';
import Notifications from 'new-dashboard/pages/Notifications';

// Hooks
import {mapsBeforeEnter, datasetsBeforeEnter} from 'new-dashboard/router/hooks/check-navigation';
import updateSearchParams from 'new-dashboard/router/hooks/update-search-params';
import fetchNotifications from 'new-dashboard/router/hooks/fetch-notifications';

Vue.use(Router);

function getURLPrefix (userBaseURL) {
  return userBaseURL.replace(location.origin, '');
}

const dashboardBaseURL = '/dashboard';
const baseRouterPrefix = `${getURLPrefix(window.CartoConfig.data.user_data.base_url)}${dashboardBaseURL}`;

const router = new Router({
  base: baseRouterPrefix,
  mode: 'history',
  /* Warning: If any of the following paths is changed,
  remember to update staticRoute props in NavigationBar component */
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
      beforeEnter: mapsBeforeEnter
    },
    {
      path: '/datasets/:filter?',
      name: 'datasets',
      component: Data,
      meta: {
        title: () => 'Data | CARTO'
      },
      beforeEnter: datasetsBeforeEnter
    },
    {
      path: '/search/:query',
      name: 'search',
      component: Search,
      meta: {
        title: route => `${route.params.query} · Search | CARTO`
      },
      beforeEnter: updateSearchParams
    },
    {
      path: '/search/tag/:tag',
      name: 'tagSearch',
      component: Search,
      meta: {
        title: route => `${route.params.tag} · Search | CARTO`
      },
      beforeEnter: updateSearchParams
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
  window.scrollTo({ top: 0, left: 0 });

  Vue.nextTick(() => {
    document.title = to.meta.title(to);
  });
});

export default router;
