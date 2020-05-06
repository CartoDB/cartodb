// Hooks
import fetchConnectedApps from 'new-dashboard/router/hooks/fetch-connected-apps';

// Lazy Pages
const ConnectedApps = () => import('new-dashboard/pages/Apps/ConnectedApps');

const routes = [
  {
    path: '/app_permissions',
    name: 'app_permissions',
    component: ConnectedApps,
    meta: {
      title: () => 'App Permissions | CARTO'
    },
    beforeEnter: fetchConnectedApps
  }
];

export default routes;
