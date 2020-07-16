import Vue from 'vue';
import Router from 'vue-router';

// Routes
import HomeRoutes from './routes/home';
import SolutionsRoutes from './routes/solutions';
import MapsRoutes from './routes/maps';
import DataRoutes from './routes/data';
import SearchRoutes from './routes/search';
import NotificationRoutes from './routes/notifications';
import OAuthRoutes from './routes/oauth_apps';
import ConnectedAppsRoutes from './routes/connected_apps';
import ConnectionsRoutes from './routes/connections';

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
    ...HomeRoutes,
    ...SolutionsRoutes,
    ...MapsRoutes,
    ...DataRoutes,
    ...SearchRoutes,
    ...NotificationRoutes,
    ...OAuthRoutes,
    ...ConnectedAppsRoutes,
    ...ConnectionsRoutes
  ],

  scrollBehavior () {
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
