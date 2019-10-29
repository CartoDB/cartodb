import Vue from 'vue';
import Router from 'vue-router';

// Pages
import Home from 'new-dashboard/pages/Home/Home';
import Solutions from 'new-dashboard/pages/Solutions';
import MapsSelector from 'new-dashboard/pages/Maps/MapsSelector';
import Kuvizs from 'new-dashboard/pages/Maps/Kuvizs';
import Maps from 'new-dashboard/pages/Maps/Maps';
import DataSelector from 'new-dashboard/pages/Data/DataSelector';
import Datasets from 'new-dashboard/pages/Data/Datasets';
import Catalog from 'new-dashboard/pages/Data/Catalog';
import CatalogDetail from 'new-dashboard/pages/Data/CatalogDetail';
import Search from 'new-dashboard/pages/Search';
import Notifications from 'new-dashboard/pages/Notifications';
import ConnectedApps from 'new-dashboard/pages/Apps/ConnectedApps';
import OAuthApps from 'new-dashboard/pages/Apps/OAuthApps';
import EditApp from 'new-dashboard/components/Apps/EditApp';
import CreateApp from 'new-dashboard/components/Apps/CreateApp';
import AppList from 'new-dashboard/components/Apps/AppList';

// Hooks
import { mapsBeforeEnter, datasetsBeforeEnter, catalogDetailBeforeEnter, kuvizBeforeEnter } from 'new-dashboard/router/hooks/check-navigation';
import updateSearchParams from 'new-dashboard/router/hooks/update-search-params';
import fetchNotifications from 'new-dashboard/router/hooks/fetch-notifications';
import { fetchOAuthApps, fetchIfAppNotFound } from 'new-dashboard/router/hooks/fetch-oauth-apps';
import fetchConnectedApps from 'new-dashboard/router/hooks/fetch-connected-apps';

// Modules
import onboarding from './onboarding';

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
      },
      children: onboarding
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
      component: MapsSelector,
      meta: {
        title: () => 'Maps | CARTO'
      },
      children: [
        {
          path: 'kuvizs',
          name: 'kuvizs',
          component: Kuvizs,
          meta: {
            title: () => 'CARTOframes | CARTO'
          },
          beforeEnter: kuvizBeforeEnter
        },
        {
          path: '',
          component: Maps,
          name: 'maps',
          meta: {
            title: () => 'Maps | CARTO'
          },
          beforeEnter: mapsBeforeEnter
        }
      ]
    },
    {
      path: '/datasets/:filter?',
      component: DataSelector,
      meta: {
        title: () => 'Data | CARTO'
      },
      children: [
        {
          path: 'catalog',
          name: 'catalog',
          component: Catalog,
          meta: {
            title: () => 'Catalog | CARTO'
          }
        },
        {
          path: '',
          component: Datasets,
          name: 'datasets',
          meta: {
            title: () => 'Data | CARTO'
          },
          beforeEnter: datasetsBeforeEnter
        }
      ]
    },
    {
      path: '/datasets/catalog/:id',
      name: 'catalog_detail',
      component: CatalogDetail,
      meta: {
        title: () => 'Detail Dataset Catalog | CARTO'
      },
      beforeEnter: catalogDetailBeforeEnter
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
    },
    {
      path: '/oauth_apps',
      component: OAuthApps,
      meta: {
        title: () => 'OAuth Apps | CARTO'
      },
      children: [
        {
          path: '',
          name: 'oauth_apps_list',
          component: AppList,
          meta: {
            title: () => 'OAuth Apps | CARTO'
          },
          beforeEnter: fetchOAuthApps
        },
        {
          path: 'new',
          name: 'oauth_app_new',
          component: CreateApp,
          meta: {
            title: () => 'Create a new OAuth app | CARTO'
          }
        },
        {
          path: 'edit/:id',
          name: 'oauth_app_edit',
          component: EditApp,
          meta: {
            title: () => 'Edit an existing OAuth App | CARTO'
          },
          beforeEnter: fetchIfAppNotFound
        }
      ]
    },
    {
      path: '/connected_apps',
      name: 'connected_apps',
      component: ConnectedApps,
      meta: {
        title: () => 'Connected Apps | CARTO'
      },
      beforeEnter: fetchConnectedApps
    }
  ],
  scrollBehavior (to, from, savedPosition) {
    return { x: 0, y: 0 };
  }
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
